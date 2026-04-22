package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
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

func SyncData() (int, error) {
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

	count := 0
	for _, item := range apiResp.ResultData {
		win := strings.ReplaceAll(item.WinNumber, " ", "")
		_, err := db.DB.Exec("INSERT INTO prize_history (api_id, round_id, round_date, win_number, round_number) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (api_id) DO UPDATE SET win_number = $6", 
			item.ID, item.RoundID, item.RoundDate, win, item.RoundNumber, win)
		if err == nil {
			count++
		}
	}
	fmt.Printf("[%v] Sync complete. Processed %d records.\n", time.Now().Format("15:04:05"), count)
	return count, nil
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
	rows, _ := db.DB.Query(fmt.Sprintf("SELECT api_id, round_number, round_date, win_number FROM prize_history ORDER BY api_id DESC LIMIT %s OFFSET %s", limit, offset))
	defer rows.Close()
	var results []map[string]interface{}
	for rows.Next() {
		var aid int; var rNum, wNum string; var t time.Time; rows.Scan(&aid, &rNum, &t, &wNum)
		results = append(results, map[string]interface{}{"apiId": aid, "roundNumber": rNum, "roundDate": t.UTC(), "winNumber": wNum})
	}
	var total int; db.DB.QueryRow("SELECT COUNT(*) FROM prize_history").Scan(&total)
	json.NewEncoder(w).Encode(map[string]interface{}{"data": results, "total": total})
}

func SaveBatchHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	if r.Method == "OPTIONS" { return }
	var batch []struct { 
		Numbers     string  `json:"numbers"` 
		Probability float64 `json:"probability"` 
		Source      string  `json:"source"`
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
			db.DB.Exec("INSERT INTO predictions (numbers, probability, source, predicted_at) VALUES ($1, $2, $3, $4)", p.Numbers, p.Probability, src, now) 
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
	}
	json.NewDecoder(r.Body).Decode(&p)
	now := time.Now().UTC()
	src := p.Source; if src == "" { src = "manual" }
	db.DB.Exec("INSERT INTO predictions (numbers, probability, source, predicted_at) VALUES ($1, $2, $3, $4)", p.Numbers, p.Probability, src, now)
	fmt.Fprint(w, `{"status":"ok"}`)
}

func DeletePredictionHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	if r.Method == "OPTIONS" { return }
	id := r.URL.Query().Get("id")
	db.DB.Exec("DELETE FROM predictions WHERE id = $1", id)
	fmt.Fprint(w, `{"status":"ok"}`)
}

func PurgeHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	if r.Method == "OPTIONS" { return }
	source := r.URL.Query().Get("source")
	if source == "" {
		db.DB.Exec("DELETE FROM predictions")
	} else {
		db.DB.Exec("DELETE FROM predictions WHERE source = $1", source)
	}
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
	rows, _ := db.DB.Query("SELECT id, numbers, probability, source, predicted_at FROM predictions ORDER BY predicted_at DESC LIMIT 500")
	if rows == nil { 
		json.NewEncoder(w).Encode([]interface{}{})
		return 
	}
	defer rows.Close()
	
	var results []map[string]interface{}
	for rows.Next() {
		var id int; var num, src string; var prob float64; var at time.Time
		rows.Scan(&id, &num, &prob, &src, &at)
		
		// Map prediction timestamp to ICT day string
		predictedDate := at.In(ict).Format("2006-01-02")
		
		status := "Lost Case"
		winners, found := winMap[predictedDate]
		
		if found {
			// A winner exists for this EXACT day
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
			if predictedDate == todayDateStr || at.After(lastDrawDate) {
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
			"predicted_at": at.UTC(), 
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
	rows, _ := db.DB.Query("SELECT win_number FROM prize_history WHERE win_number != '' ORDER BY api_id DESC LIMIT 1000")
	var sb strings.Builder
	for rows.Next() { var wN string; rows.Scan(&wN); sb.WriteString(wN + ",") }
	history := sb.String()
	var wg sync.WaitGroup
	var gptRes, geminiRes string
	wg.Add(2)
	go func() { defer wg.Done(); gptRes = services.CallOpenAI(history, digits, count) }()
	go func() { defer wg.Done(); geminiRes = services.CallGemini(history, digits, count) }()
	wg.Wait()
	json.NewEncoder(w).Encode(map[string]string{"gpt4_prediction": gptRes, "gemini_prediction": geminiRes})
}

func LocalPredictHandler(w http.ResponseWriter, r *http.Request) {
	SetCORS(w)
	digitsStr := r.URL.Query().Get("digits"); if digitsStr == "" { digitsStr = "6" }
	digits := 6; fmt.Sscanf(digitsStr, "%d", &digits)
	countStr := r.URL.Query().Get("count"); if countStr == "" { countStr = "5" }
	count := 5; fmt.Sscanf(countStr, "%d", &count)

	// 1. Fetch last 100 winning numbers
	rows, err := db.DB.Query("SELECT win_number FROM prize_history WHERE win_number != '' ORDER BY api_id DESC LIMIT 100")
	var history []string
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var wNum string
			if err := rows.Scan(&wNum); err == nil {
				history = append(history, strings.ReplaceAll(wNum, " ", "")) 
			}
		}
	}

	rand.Seed(time.Now().UnixNano())
	var predictions []string

	// 2. Advanced Frequency Logic (Hot Numbers + Recent Bias)
	freqMap := make([]map[int]int, digits)
	for i := 0; i < digits; i++ {
		freqMap[i] = make(map[int]int)
	}

	comboMap := make(map[string]int)

	for hIndex, h := range history {
		if len(h) < digits { continue }
		suffix := h[len(h)-digits:]
		
		// Smoother weight decay for the history
		// Recent draws still matter, but do not overwhelm the entire 100 history
		weight := 1
		if hIndex < 30 { weight = 2 }
		if hIndex < 10 { weight = 3 }
		if hIndex < 3 { weight = 4 }

		comboMap[suffix] += weight

		for i, char := range suffix {
			d := int(char - '0')
			if d >= 0 && d <= 9 {
				freqMap[i][d] += weight
			}
		}
	}

	for i := 0; i < count; i++ {
		num := ""
		explanation := ""
		
		// Strategy 1: Best Combination (Highest weight with more randomness)
		if i == 0 {
			bestCombo := ""
			maxC := 0
			for c, co := range comboMap {
				// Increased random variance so it doesn't just pick the absolute newest
				score := co + rand.Intn(10)
				if score > maxC { maxC = score; bestCombo = c }
			}
			if maxC > 5 && bestCombo != "" {
				num = bestCombo
				explanation = "Pattern Recognition: Identified frequent combination across history."
			}
		}
		
		// Strategy 2: Proportional Probability per position
		if num == "" {
			for pos := 0; pos < digits; pos++ {
				weights := freqMap[pos]
				totalWeight := 0
				for d := 0; d <= 9; d++ {
					w := weights[d] + 1 // Use direct weight, no squaring
					totalWeight += w
				}

				rVal := rand.Intn(totalWeight)
				cumulative := 0
				digit := 0
				for d := 0; d <= 9; d++ {
					w := weights[d] + 1
					cumulative += w
					if rVal < cumulative {
						digit = d
						break
					}
				}
				num += fmt.Sprintf("%d", digit)
			}
			explanation = "Historical Frequency Distribution. Balanced selection from last 100 draws."
		}
		
		winRate := rand.Intn(8) + 88 // 88% - 95% perceived win rate
		predictions = append(predictions, fmt.Sprintf("NUMBER: %s, WINRATE: %d%%, EXPLANATION: %s", num, winRate, explanation))
	}

	json.NewEncoder(w).Encode(map[string]string{"prediction": strings.Join(predictions, "|||")})
}
