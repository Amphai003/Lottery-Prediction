package services

import (
	"strings"
	"testing"
)

func TestCalculateDigitScores(t *testing.T) {
	// Setup mock history
	// history represents draws from newest to oldest
	history := []string{"12", "34", "12", "12", "56"}
	digits := 2
	pos := 0 // We're scoring the tens digit (position 0 of a 2-digit number)

	scores := CalculateDigitScores(history, digits, pos)

	if len(scores) != 10 {
		t.Fatalf("Expected 10 digit scores, got %d", len(scores))
	}

	// Verify digit '1'
	// freq = 3, mom = 3, lastSeen = 0
	// freqScore = 3 * 1.2 = 3.6
	// momScore = 3 * 2.8 = 8.4
	// gapScore = 5.0 (since lastSeen < 3)
	// total = 3.6 + 8.4 + 5.0 = 17.0
	var score1 digitScore
	for _, s := range scores {
		if s.digit == "1" {
			score1 = s
			break
		}
	}
	if score1.frequency != 3 {
		t.Errorf("Expected frequency of '1' to be 3, got %d", score1.frequency)
	}
	if score1.momentum != 3 {
		t.Errorf("Expected momentum of '1' to be 3, got %d", score1.momentum)
	}
	if score1.lastSeen != 0 {
		t.Errorf("Expected lastSeen of '1' to be 0, got %d", score1.lastSeen)
	}
	if score1.score != 17.0 {
		t.Errorf("Expected score of '1' to be 17.0, got %f", score1.score)
	}

	// Verify digit '3'
	// freq = 1, mom = 1, lastSeen = 1
	// freqScore = 1 * 1.2 = 1.2
	// momScore = 1 * 2.8 = 2.8
	// gapScore = 5.0 (since lastSeen < 3)
	// total = 1.2 + 2.8 + 5.0 = 9.0
	var score3 digitScore
	for _, s := range scores {
		if s.digit == "3" {
			score3 = s
			break
		}
	}
	if score3.score != 9.0 {
		t.Errorf("Expected score of '3' to be 9.0, got %f", score3.score)
	}

	// Verify digit '5'
	// freq = 1, mom = 1, lastSeen = 4
	// freqScore = 1 * 1.2 = 1.2
	// momScore = 1 * 2.8 = 2.8
	// gapScore = 0.0 (since 3 <= lastSeen <= 25)
	// total = 1.2 + 2.8 = 4.0
	var score5 digitScore
	for _, s := range scores {
		if s.digit == "5" {
			score5 = s
			break
		}
	}
	if score5.score != 4.0 {
		t.Errorf("Expected score of '5' to be 4.0, got %f", score5.score)
	}

	// Verify digit '0' (not in history)
	// freq = 0, mom = 0, lastSeen = 999
	// freqScore = 0
	// momScore = 0
	// gapScore = 7.0 (since lastSeen > 25)
	// total = 7.0
	var score0 digitScore
	for _, s := range scores {
		if s.digit == "0" {
			score0 = s
			break
		}
	}
	if score0.score != 7.0 {
		t.Errorf("Expected score of '0' to be 7.0, got %f", score0.score)
	}
}

func TestGenerateAutoPredictions(t *testing.T) {
	results := GenerateAutoPredictions(3, 5)

	if len(results) != 5 {
		t.Fatalf("Expected 5 predictions, got %d", len(results))
	}

	// Honest odds: a 3-digit ticket is a true 1-in-1000 = 0.1% chance.
	seen := make(map[string]bool)
	for _, p := range results {
		if len(p.Numbers) != 3 {
			t.Errorf("Expected prediction number to have 3 digits, got %d (value: %s)", len(p.Numbers), p.Numbers)
		}
		if p.Probability != 0.1 {
			t.Errorf("Expected honest 3-digit probability of 0.1%%, got %f", p.Probability)
		}
		if !strings.Contains(p.Explanation, "[PULSE UNIFORM]") {
			t.Errorf("Expected explanation to contain [PULSE UNIFORM], got %s", p.Explanation)
		}
		// Coverage guarantee: every pick in the batch must be distinct.
		if seen[p.Numbers] {
			t.Errorf("Expected all picks to be distinct, but %s was repeated", p.Numbers)
		}
		seen[p.Numbers] = true
	}
}

// TestGenerateAutoPredictionsUniform verifies the generator is genuinely uniform
// (the old physics simulation was heavily biased toward low digits: 15%+ for 0/1
// vs 5.5% for 9). Over many single-digit draws every digit should land near 10%.
func TestGenerateAutoPredictionsUniform(t *testing.T) {
	counts := make([]int, 10)
	const n = 60000
	for i := 0; i < n; i++ {
		r := GenerateAutoPredictions(1, 1)
		counts[int(r[0].Numbers[0]-'0')]++
	}
	expected := float64(n) / 10.0
	for d := 0; d < 10; d++ {
		// Allow a generous 20% tolerance band; a biased generator (e.g. 15% vs 5%)
		// would blow straight past this, a fair one comfortably stays inside.
		if float64(counts[d]) < expected*0.8 || float64(counts[d]) > expected*1.2 {
			t.Errorf("digit %d appeared %d times (%.1f%%), expected ~%.0f (10%%) — distribution not uniform",
				d, counts[d], 100*float64(counts[d])/float64(n), expected)
		}
	}
}

// TestGenerateAutoPredictionsDistinctCap ensures we never loop forever or emit
// duplicates when asked for more picks than the number space allows.
func TestGenerateAutoPredictionsDistinctCap(t *testing.T) {
	// Only 100 distinct 2-digit numbers exist; asking for 150 must cap at 100.
	results := GenerateAutoPredictions(2, 150)
	if len(results) != 100 {
		t.Fatalf("Expected batch to cap at 100 distinct 2-digit numbers, got %d", len(results))
	}
	seen := make(map[string]bool)
	for _, p := range results {
		if seen[p.Numbers] {
			t.Fatalf("Duplicate pick %s in a distinct batch", p.Numbers)
		}
		seen[p.Numbers] = true
	}
}
