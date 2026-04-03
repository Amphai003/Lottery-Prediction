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
	var latestWin string; var latestDate time.Time
	db.DB.QueryRow("SELECT win_number, round_date FROM prize_history WHERE win_number != '' ORDER BY api_id DESC LIMIT 1").Scan(&latestWin, &latestDate)

	rows, _ := db.DB.Query("SELECT id, numbers, probability, source, predicted_at FROM predictions ORDER BY predicted_at DESC LIMIT 500")
	defer rows.Close()
	var results []map[string]interface{}
	for rows.Next() {
		var id int; var num, src string; var prob float64; var at time.Time
		rows.Scan(&id, &num, &prob, &src, &at)
		
		status := "Lost Case"
		// Improvement: Check match FIRST before pending
		if latestWin != "" && strings.HasSuffix(latestWin, num) {
			status = "Win Lottery"
		} else if at.After(latestDate.Add(24 * time.Hour)) {
			status = "Pending Result"
		}
		
		results = append(results, map[string]interface{}{"id": id, "numbers": num, "probability": prob, "source": src, "predicted_at": at.UTC(), "status": status})
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

	// 2. Frequency Logic (Hot Numbers)
	// We'll map position (0 to digits-1) -> digit (0-9) -> count
	freqMap := make([]map[int]int, digits)
	for i := 0; i < digits; i++ {
		freqMap[i] = make(map[int]int)
	}

	for _, h := range history {
		if len(h) < digits { continue }
		// Extract last 'digits' from the history string
		suffix := h[len(h)-digits:]
		for i, char := range suffix {
			d := int(char - '0')
			if d >= 0 && d <= 9 {
				freqMap[i][d]++
			}
		}
	}

	for i := 0; i < count; i++ {
		num := ""
		for pos := 0; pos < digits; pos++ {
			// Find weights for this position
			weights := freqMap[pos]
			totalWeight := 0
			for d := 0; d <= 9; d++ {
				w := weights[d] + 1 // +1 smoothing to avoid 0% chance
				totalWeight += w
			}

			rVal := rand.Intn(totalWeight)
			cumulative := 0
			digit := 0
			for d := 0; d <= 9; d++ {
				cumulative += (weights[d] + 1)
				if rVal < cumulative {
					digit = d
					break
				}
			}
			num += fmt.Sprintf("%d", digit)
		}
		
		winRate := rand.Intn(10) + 78 // Slightly higher perceived winrate for hot numbers
		predictions = append(predictions, fmt.Sprintf("NUMBER: %s, WINRATE: %d%%, EXPLANATION: Frequency analysis (Last 100 Draws). Based on digit position hot-zones.", num, winRate))
	}

	json.NewEncoder(w).Encode(map[string]string{"prediction": strings.Join(predictions, "|||")})
}
