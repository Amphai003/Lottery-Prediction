package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
	"lottery-backend/db"
	"lottery-backend/models"
	"lottery-backend/services"
)

func SetCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
}

var (
	syncMutex sync.Mutex
)

// GetNextDrawTime calculates the upcoming draw date/time (Mon, Tue, Wed, Thu, Fri at 20:30 ICT)
func GetNextDrawTime(t time.Time) time.Time {
	ict := time.FixedZone("ICT", 7*3600)
	t = t.In(ict)

	// If it's already past today's draw time, start looking from tomorrow
	if t.Hour() > 20 || (t.Hour() == 20 && t.Minute() >= 30) {
		t = t.AddDate(0, 0, 1)
	}
	// Reset to start of day for the search
	t = time.Date(t.Year(), t.Month(), t.Day(), 20, 30, 0, 0, ict)

	for {
		wd := t.Weekday()
		if wd == time.Monday || wd == time.Tuesday || wd == time.Wednesday || wd == time.Thursday || wd == time.Friday {
			return t
		}
		t = t.AddDate(0, 0, 1)
	}
}

func SyncData() (int, error) {
	// 1. Prevent concurrent syncs from triggering multiple auto-predictions
	syncMutex.Lock()
	defer syncMutex.Unlock()

	const dataURL = "https://laodl.com/api/website/laolot/WinPrizeHistory?type=1"
	
	resp, err := http.Get(dataURL)
	if err != nil || resp == nil { 
		return 0, fmt.Errorf("failed to fetch from source: %v", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var apiResp models.APIResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return 0, fmt.Errorf("failed to parse result data: %v", err)
	}

	if len(apiResp.ResultData) > 0 {
		fmt.Printf("[%v] Latest from API: RD#%s | Date: %s | Win: [%s]\n", 
			time.Now().Format("15:04:05"), 
			apiResp.ResultData[0].RoundNumber, 
			apiResp.ResultData[0].RoundDate, 
			apiResp.ResultData[0].WinNumber)
	}

	var maxAPIID int
	_ = db.DB.QueryRow("SELECT COALESCE(MAX(api_id), 0) FROM prize_history").Scan(&maxAPIID)

	count := 0
	hasNewLottery := false
	for _, item := range apiResp.ResultData {
		if maxAPIID > 0 && item.ID > maxAPIID {
			hasNewLottery = true
		}
		win := strings.ReplaceAll(item.WinNumber, " ", "")
		_, err := db.DB.Exec("INSERT INTO prize_history (api_id, round_id, round_date, win_number, round_number) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (api_id) DO UPDATE SET win_number = $6", 
			item.ID, item.RoundID, item.RoundDate, win, item.RoundNumber, win)
		if err == nil {
			count++
		}
	}
	fmt.Printf("[%v] Sync complete. Processed %d records. Has New Lottery: %t\n", time.Now().Format("15:04:05"), count, hasNewLottery)

	// 3. Smart Trigger: Ensure we have auto-predictions.
	ict := time.FixedZone("ICT", 7*3600)
	now := time.Now().In(ict)

	upcomingDraw := GetNextDrawTime(now)
	upcomingDrawStr := upcomingDraw.Format("2006-01-02")

	// Check if we already have auto predictions for the upcoming draw
	hasUpcomingPrediction := false
	rows, err := db.DB.Query("SELECT predicted_at FROM predictions WHERE source = 'auto'")
	if err == nil && rows != nil {
		defer rows.Close()
		for rows.Next() {
			var at time.Time
			if err := rows.Scan(&at); err == nil {
				if GetNextDrawTime(at).Format("2006-01-02") == upcomingDrawStr {
					hasUpcomingPrediction = true
					break
				}
			}
		}
	}

	var totalAutoCount int
	_ = db.DB.QueryRow("SELECT COUNT(*) FROM predictions WHERE source = 'auto'").Scan(&totalAutoCount)

	shouldGenerate := false
	reason := ""

	if totalAutoCount == 0 {
		shouldGenerate = true
		reason = "initial bootstrap (0 predictions in database)"
	} else if hasNewLottery {
		shouldGenerate = true
		reason = "new lottery result detected from API"
	} else if !hasUpcomingPrediction {
		shouldGenerate = true
		reason = fmt.Sprintf("no auto predictions generated for the upcoming draw %s yet", upcomingDrawStr)
	}

	if shouldGenerate {
		fmt.Printf("[%v] TRIGGER AUTO PREDICTION: %s. Generating fresh 15-set...\n", time.Now().Format("15:04:05"), reason)
		
		saveTime := time.Now().UTC()
		configs := []struct{ d, c int }{{2, 14}, {6, 1}}
		
		for _, conf := range configs {
			preds := services.GenerateAutoPredictions(conf.d, conf.c)
			for _, p := range preds {
				_, err := db.DB.Exec("INSERT INTO predictions (numbers, probability, source, explanation, predicted_at) VALUES ($1, $2, $3, $4, $5)", p.Numbers, p.Probability, "auto", p.Explanation, saveTime)
				if err != nil {
					log.Printf("ERROR: Failed to save auto-prediction: %v", err)
				}
			}
		}
		fmt.Printf("[%v] Auto-Batch (15 items) generated and saved.\n", time.Now().Format("15:04:05"))

		// Clean up any older duplicate auto-predictions targeting the same draw date
		CleanDuplicateAutoPredictions(upcomingDrawStr, saveTime)
	}

	return count, nil
}

func CleanDuplicateAutoPredictions(targetDrawDateStr string, keepTime time.Time) {
	rows, err := db.DB.Query("SELECT id, predicted_at FROM predictions WHERE source = 'auto'")
	if err != nil {
		return
	}
	defer rows.Close()

	var idsToDelete []int
	for rows.Next() {
		var id int
		var predictedAt time.Time
		if err := rows.Scan(&id, &predictedAt); err == nil {
			// If it has the same target draw date, but was generated at a different time than the one we want to keep
			if GetNextDrawTime(predictedAt).Format("2006-01-02") == targetDrawDateStr {
				if predictedAt.Sub(keepTime).Abs() > 10*time.Second {
					idsToDelete = append(idsToDelete, id)
				}
			}
		}
	}

	if len(idsToDelete) > 0 {
		fmt.Printf("[%v] Cleaning up %d older duplicate auto-predictions targeting %s\n", time.Now().Format("15:04:05"), len(idsToDelete), targetDrawDateStr)
		for _, id := range idsToDelete {
			_, _ = db.DB.Exec("DELETE FROM predictions WHERE id = $1", id)
		}
	}
}

func SyncHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	count, err := SyncData()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	fmt.Fprintf(w, `{"status":"ok", "count": %d}`, count)
}

func GetHistoryHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	limit := r.URL.Query().Get("limit"); if limit == "" { limit = "100" }
	offset := r.URL.Query().Get("offset"); if offset == "" { offset = "0" }
	rows, err := db.DB.Query(fmt.Sprintf("SELECT api_id, round_number, round_date, win_number FROM prize_history ORDER BY api_id DESC LIMIT %s OFFSET %s", limit, offset))
	if err != nil {
		log.Printf("DB Error in GetHistory: %v", err)
		http.Error(w, "Internal server error", 500)
		return
	}
	defer rows.Close()
	var results []map[string]interface{}
	for rows.Next() {
		var aid int; var rNum, wNum string; var t time.Time; 
		if err := rows.Scan(&aid, &rNum, &t, &wNum); err != nil {
			continue
		}
		results = append(results, map[string]interface{}{"apiId": aid, "roundNumber": rNum, "roundDate": t.UTC(), "winNumber": wNum})
	}
	var total int; 
	err = db.DB.QueryRow("SELECT COUNT(*) FROM prize_history").Scan(&total)
	if err != nil { total = 0 }
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": results, "total": total})
}

func SaveBatchHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	if r.Method == "OPTIONS" { return }
	var batch []struct { 
		Numbers     string  `json:"numbers"` 
		Probability float64 `json:"probability"` 
		Source      string  `json:"source"`
		Explanation string  `json:"explanation"`
	}
	if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
		log.Printf("ERROR: Failed to decode batch: %v", err)
		http.Error(w, err.Error(), 400)
		return
	}
	fmt.Printf("[%v] Saving batch of %d records\n", time.Now().Format("15:04:05"), len(batch))
	now := time.Now().UTC()
	for _, p := range batch {
		if p.Numbers != "" { 
			src := p.Source
			if src == "" { src = "manual" }
			db.DB.Exec("INSERT INTO predictions (numbers, probability, source, explanation, predicted_at) VALUES ($1, $2, $3, $4, $5)", p.Numbers, p.Probability, src, p.Explanation, now) 
		}
	}
	fmt.Fprint(w, `{"status":"ok"}`)
}

func SavePredictionHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	if r.Method == "OPTIONS" { return }
	var p struct { 
		Numbers     string  `json:"numbers"` 
		Probability float64 `json:"probability"` 
		Source      string  `json:"source"` 
		Explanation string  `json:"explanation"`
	}
	json.NewDecoder(r.Body).Decode(&p)
	now := time.Now().UTC()
	src := p.Source; if src == "" { src = "manual" }
	db.DB.Exec("INSERT INTO predictions (numbers, probability, source, explanation, predicted_at) VALUES ($1, $2, $3, $4, $5)", p.Numbers, p.Probability, src, p.Explanation, now)
	fmt.Fprint(w, `{"status":"ok"}`)
}

func DeletePredictionHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	if r.Method == "OPTIONS" { return }
	id := r.URL.Query().Get("id")
	res, err := db.DB.Exec("DELETE FROM predictions WHERE id = $1", id)
	if err != nil {
		log.Printf("ERROR: Failed to delete prediction %s: %v", id, err)
		http.Error(w, err.Error(), 500)
		return
	}
	rows, _ := res.RowsAffected()
	log.Printf("DELETE: Removed prediction ID %s (Rows: %d)", id, rows)
	fmt.Fprint(w, `{"status":"ok"}`)
}

func PurgeHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	if r.Method == "OPTIONS" { return }
	source := r.URL.Query().Get("source")
	var res sql.Result
	var err error
	if source == "" {
		log.Println("PURGE: Deleting ALL predictions from database")
		res, err = db.DB.Exec("DELETE FROM predictions")
	} else {
		log.Printf("PURGE: Deleting all predictions for source: %s", source)
		res, err = db.DB.Exec("DELETE FROM predictions WHERE source = $1", source)
	}
	
	if err != nil {
		log.Printf("ERROR: Purge failed: %v", err)
		http.Error(w, err.Error(), 500)
		return
	}
	rows, _ := res.RowsAffected()
	log.Printf("PURGE: Success. Removed %d records.", rows)
	fmt.Fprint(w, `{"status":"ok"}`)
}

func GetSavedPredictionsHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	w.Header().Set("Content-Type", "application/json")

	// Use ICT (+7) for date matching to align with Lao/Thai lottery cycles
	ict := time.FixedZone("ICT", 7*3600)
	todayDateStr := time.Now().In(ict).Format("2006-01-02")

	// 1. Fetch all winning numbers from history into a map for precise date matching
	winMap := make(map[string][]string)
	historyRows, _ := db.DB.Query("SELECT round_date, win_number FROM prize_history WHERE win_number != ''")
	var lastDrawDate time.Time
	if historyRows != nil {
		defer historyRows.Close()
		for historyRows.Next() {
			var rd time.Time; var wn string
			if err := historyRows.Scan(&rd, &wn); err == nil {
				dateStr := rd.In(ict).Format("2006-01-02")
				winMap[dateStr] = append(winMap[dateStr], strings.ReplaceAll(wn, " ", ""))
				if rd.After(lastDrawDate) {
					lastDrawDate = rd
				}
			}
		}
	}

	// 2. Evaluate each prediction based on its specific date
	rows, _ := db.DB.Query("SELECT id, numbers, probability, source, explanation, predicted_at FROM predictions ORDER BY predicted_at DESC")
	if rows == nil { 
		json.NewEncoder(w).Encode([]interface{}{})
		return 
	}
	defer rows.Close()
	
	var results []map[string]interface{}
	for rows.Next() {
		var id int; var num, src, expl string; var prob float64; var at time.Time
		rows.Scan(&id, &num, &prob, &src, &expl, &at)
		
		// Map prediction timestamp to the ACTUAL Target Draw Date
		// This ensures predictions made on Saturday/Sunday correctly map to Monday's draw.
		targetDrawTime := GetNextDrawTime(at)
		predictedDateStr := targetDrawTime.Format("2006-01-02")
		
		status := "Lost Case"
		winners, found := winMap[predictedDateStr]
		
		if found {
			// A winner exists for this targeted day
			isWin := false
			for _, winNum := range winners {
				if strings.HasSuffix(winNum, num) {
					isWin = true
					break
				}
			}
			if isWin {
				status = "Win Lottery"
			} else {
				status = "Lost Case"
			}
		} else {
			// No winner recorded for this date yet
			// If it's today (local) or after our latest known draw, it's pending
			if predictedDateStr == todayDateStr || at.After(lastDrawDate) {
				status = "Pending Result"
			} else {
				// Past date with no result found -> Missed Round
				status = "Lost Case"
			}
		}
		
		results = append(results, map[string]interface{}{
			"id": id, 
			"numbers": num, 
			"probability": prob, 
			"source": src, 
			"explanation": expl,
			"predicted_at": at.UTC(), 
			"targetDate": predictedDateStr,
			"status": status,
		})
	}
	json.NewEncoder(w).Encode(results)
}

func AIPredictHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	if r.Method == "OPTIONS" { return }
	digits := r.URL.Query().Get("digits"); if digits == "" { digits = "6" }
	count := r.URL.Query().Get("count"); if count == "" { count = "5" }
	rows, err := db.DB.Query("SELECT win_number FROM prize_history WHERE win_number != '' ORDER BY api_id DESC LIMIT 1000")
	if err != nil {
		http.Error(w, "Failed to fetch history for AI", 500)
		return
	}
	defer rows.Close()
	var sb strings.Builder
	for rows.Next() { 
		var wN string; 
		if err := rows.Scan(&wN); err == nil {
			sb.WriteString(wN + ",") 
		}
	}
	history := sb.String()
	var wg sync.WaitGroup
	var gptRes, geminiRes string
	wg.Add(2)
	go func() { defer wg.Done(); gptRes = services.CallOpenAI(history, digits, count) }()
	go func() { defer wg.Done(); geminiRes = services.CallGemini(history, digits, count) }()
	wg.Wait()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"gpt4_prediction": gptRes, "gemini_prediction": geminiRes})
}

func LocalPredictHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	digitsStr := r.URL.Query().Get("digits"); if digitsStr == "" { digitsStr = "6" }
	digits := 6; fmt.Sscanf(digitsStr, "%d", &digits)
	countStr := r.URL.Query().Get("count"); if countStr == "" { countStr = "5" }
	count := 5; fmt.Sscanf(countStr, "%d", &count)

	predictions, freqMap := services.GeneratePredictions(digits, count)

	var pStrings []string
	for _, p := range predictions {
		pStrings = append(pStrings, fmt.Sprintf("NUMBER: %s, WINRATE: %.0f%%, EXPLANATION: %s", p.Numbers, p.Probability, p.Explanation))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"prediction":  strings.Join(pStrings, "|||"),
		"frequencies": freqMap,
	})
}
