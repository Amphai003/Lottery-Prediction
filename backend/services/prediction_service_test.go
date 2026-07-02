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

func TestRunRollerBallSimulation(t *testing.T) {
	// Create some dummy digit scores to seed the simulation properties
	scores := []digitScore{
		{digit: "0", frequency: 5, momentum: 2, lastSeen: 1, score: 10.0},
		{digit: "1", frequency: 12, momentum: 4, lastSeen: 0, score: 25.0},
		{digit: "2", frequency: 3, momentum: 1, lastSeen: 5, score: 5.0},
		{digit: "3", frequency: 8, momentum: 3, lastSeen: 2, score: 15.0},
		{digit: "4", frequency: 6, momentum: 2, lastSeen: 3, score: 12.0},
		{digit: "5", frequency: 15, momentum: 5, lastSeen: 0, score: 30.0},
		{digit: "6", frequency: 2, momentum: 0, lastSeen: 10, score: 2.0},
		{digit: "7", frequency: 9, momentum: 3, lastSeen: 1, score: 18.0},
		{digit: "8", frequency: 4, momentum: 1, lastSeen: 4, score: 7.0},
		{digit: "9", frequency: 7, momentum: 2, lastSeen: 2, score: 13.0},
	}

	digit, explanation := RunRollerBallSimulation(scores, 0)

	// Verify output values
	if digit < 0 || digit > 9 {
		t.Errorf("Expected drawn digit to be in range [0, 9], got %d", digit)
	}

	if explanation == "" {
		t.Errorf("Expected explanation string not to be empty")
	}

	// Verify narrative contains expected keywords
	if !strings.Contains(explanation, "Weight:") || !strings.Contains(explanation, "Bouncy:") {
		t.Errorf("Expected explanation to contain weight and bouncy stats, got: %s", explanation)
	}
}

func TestGenerateAutoPredictions(t *testing.T) {
	results := GenerateAutoPredictions(3, 5)

	if len(results) != 5 {
		t.Fatalf("Expected 5 predictions, got %d", len(results))
	}

	for _, p := range results {
		if len(p.Numbers) != 3 {
			t.Errorf("Expected prediction number to have 3 digits, got %d (value: %s)", len(p.Numbers), p.Numbers)
		}
		if p.Probability < 80.0 || p.Probability > 100.0 {
			t.Errorf("Expected probability to be between 80%% and 100%%, got %f", p.Probability)
		}
		if !strings.Contains(p.Explanation, "[PULSE PHYSICAL]") {
			t.Errorf("Expected explanation to contain [PULSE PHYSICAL], got %s", p.Explanation)
		}
	}
}
