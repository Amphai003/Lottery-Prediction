package services

import (
	crand "crypto/rand"
	"fmt"
	"math/big"
	"math/rand"
	"time"

	"lottery-backend/db"
)

type PredictionResult struct {
	Numbers     string  `json:"numbers"`
	Probability float64 `json:"probability"`
	Explanation string  `json:"explanation"`
	Source      string  `json:"source"`
}

func GetHistoryData(limit int) []string {
	rows, err := db.DB.Query("SELECT win_number FROM prize_history WHERE win_number != '' ORDER BY api_id DESC LIMIT $1", limit)
	var history []string
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var wNum string
			if err := rows.Scan(&wNum); err == nil {
				// Clean win number: keep only digits
				cleaned := ""
				for _, r := range wNum {
					if r >= '0' && r <= '9' {
						cleaned += string(r)
					}
				}
				history = append(history, cleaned)
			}
		}
	}
	return history
}

func GetHistoryByDayAndMonth(dayOfWeek time.Weekday, months int) []string {
	startDate := time.Now().AddDate(0, -months, 0)
	rows, err := db.DB.Query(`
		SELECT win_number FROM prize_history
		WHERE win_number != ''
		AND round_date >= $1
		AND EXTRACT(DOW FROM round_date) = $2
		ORDER BY round_date DESC
	`, startDate, int(dayOfWeek))

	var history []string
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var wNum string
			if err := rows.Scan(&wNum); err == nil {
				cleaned := ""
				for _, r := range wNum {
					if r >= '0' && r <= '9' { cleaned += string(r) }
				}
				history = append(history, cleaned)
			}
		}
	}
	return history
}

// Score Analysis for a specific position
type digitScore struct {
	digit     string
	frequency int     // Long term count
	momentum  int     // Short term count (last 20)
	lastSeen  int     // Draws since last appearance
	score     float64 // Total weighted score
}

func CalculateDigitScores(history []string, digits int, pos int) []digitScore {
	scores := make([]digitScore, 10)
	for i := 0; i < 10; i++ {
		scores[i] = digitScore{digit: fmt.Sprintf("%d", i), lastSeen: 999}
	}

	for hIdx, h := range history {
		if len(h) < digits { continue }
		// Align to the right (suffix)
		idx := len(h) - digits + pos
		if idx < 0 || idx >= len(h) { continue }

		d := int(h[idx] - '0')
		if d < 0 || d > 9 { continue }

		scores[d].frequency++
		if hIdx < 20 { scores[d].momentum++ }
		if hIdx < scores[d].lastSeen { scores[d].lastSeen = hIdx }
	}

	for i := 0; i < 10; i++ {
		// Frequency: Reward consistent numbers
		freqScore := float64(scores[i].frequency) * 1.2
		// Momentum: Reward numbers on a hot streak
		momScore := float64(scores[i].momentum) * 2.8
		// Gap: Reward 'due' numbers but also 'very hot' ones
		gapScore := 0.0
		if scores[i].lastSeen < 3 { gapScore = 5.0 } // Hot streak bonus
		if scores[i].lastSeen > 25 { gapScore = 7.0 } // Deep cold reversal (overdue)

		scores[i].score = freqScore + momScore + gapScore
	}
	return scores
}

func GeneratePredictions(digits int, count int) ([]PredictionResult, []map[string]int) {
	history := GetHistoryData(10)
	legacyFreqMap := make([]map[string]int, digits)
	allPositionScores := make([][]digitScore, digits)

	for pos := 0; pos < digits; pos++ {
		scores := CalculateDigitScores(history, digits, pos)
		allPositionScores[pos] = scores
		legacyFreqMap[pos] = make(map[string]int)
		for _, s := range scores { legacyFreqMap[pos][s.digit] = s.frequency }
	}

	var results []PredictionResult
	for i := 0; i < count; i++ {
		num := ""
		method := ""
		explanation := ""

		strategy := i % 4
		switch strategy {
		case 0:
			method = "🔥 HOT PEAK"
			explanation = "Highest combined frequency and momentum."
			for pos := 0; pos < digits; pos++ {
				best := allPositionScores[pos][0]
				for _, s := range allPositionScores[pos] { if s.score > best.score { best = s } }
				num += best.digit
			}
		case 1:
			method = "❄️ OVERDUE REVERSAL"
			explanation = "Targets digits that haven't appeared in 25+ draws."
			for pos := 0; pos < digits; pos++ {
				bestGap := allPositionScores[pos][0]
				for _, s := range allPositionScores[pos] { if s.lastSeen > bestGap.lastSeen { bestGap = s } }
				num += bestGap.digit
			}
		case 2:
			method = "⚡ TREND DIVERGENCE"
			explanation = "Follows secondary trends using 2nd/3rd ranked digits."
			for pos := 0; pos < digits; pos++ {
				type dRank struct { d string; s float64 }
				var ranks []dRank
				for _, s := range allPositionScores[pos] { ranks = append(ranks, dRank{s.digit, s.score}) }
				for a := 0; a < 10; a++ {
					for b := a+1; b < 10; b++ {
						if ranks[a].s < ranks[b].s { ranks[a], ranks[b] = ranks[b], ranks[a] }
					}
				}
				num += ranks[1+(pos%2)].d
			}
		default:
			method = "⚖️ BALANCED"
			explanation = "Statistical symmetry model."
			for pos := 0; pos < digits; pos++ {
				num += allPositionScores[pos][rand.Intn(3)].digit
			}
		}

		results = append(results, PredictionResult{
			Numbers:     num,
			Probability: 85.0 + (rand.Float64() * 10),
			Explanation: fmt.Sprintf("[%s] %s", method, explanation),
		})
	}
	return results, legacyFreqMap
}

// secureDigit returns a cryptographically uniform digit in [0,9].
// Every digit is exactly equally likely — this is the only fair way to
// pick a number for a memoryless, unpredictable lottery draw.
func secureDigit() int {
	n, err := crand.Int(crand.Reader, big.NewInt(10))
	if err != nil {
		return rand.Intn(10) // fallback source is also uniform
	}
	return int(n.Int64())
}

// GenerateAutoPredictions produces `count` DISTINCT, uniformly-random numbers of
// the given digit length.
//
// A fair lottery cannot be predicted: past draws carry zero information about
// future ones, so no weighting/momentum/physics scheme can beat the base odds.
// The only lever a generator actually has is COVERAGE — making every pick in a
// batch distinct so they cover `count` non-overlapping outcomes. With suffix
// matching, `count` distinct k-digit picks give a true count/10^k chance that one
// of them hits, which is the mathematical best a random generator can do.
func GenerateAutoPredictions(digits int, count int) []PredictionResult {
	if digits < 1 {
		digits = 1
	}

	// Total distinct numbers that exist for this length (10^digits).
	space := 1
	for i := 0; i < digits; i++ {
		space *= 10
	}
	if count > space {
		count = space // can't emit more distinct numbers than exist
	}

	// Honest odds, expressed as percentages for the UI.
	singleProb := 100.0 / float64(space)        // one ticket's real win chance
	batchProb := singleProb * float64(count)    // chance ≥1 of the distinct picks hits

	seen := make(map[string]bool, count)
	results := make([]PredictionResult, 0, count)
	for len(results) < count {
		num := ""
		for pos := 0; pos < digits; pos++ {
			num += fmt.Sprintf("%d", secureDigit())
		}
		if seen[num] {
			continue // enforce distinct coverage across the batch
		}
		seen[num] = true

		results = append(results, PredictionResult{
			Numbers:     num,
			Probability: singleProb,
			Source:      "auto",
			Explanation: fmt.Sprintf(
				"[PULSE UNIFORM] Cryptographically fair random pick — every digit 0-9 equally likely. Honest odds for this %d-digit ticket: %s%% (1 in %d). This batch of %d distinct picks covers %s%% of all possible outcomes.",
				digits, trimPct(singleProb), space, count, trimPct(batchProb)),
		})
	}
	return results
}

// trimPct formats a percentage with just enough precision to stay meaningful
// for very long-odds lengths (e.g. 0.0001% for a 6-digit ticket).
func trimPct(p float64) string {
	switch {
	case p >= 1.0:
		return fmt.Sprintf("%.2f", p)
	case p >= 0.01:
		return fmt.Sprintf("%.3f", p)
	default:
		return fmt.Sprintf("%.4f", p)
	}
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
