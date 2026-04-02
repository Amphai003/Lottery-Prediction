package main

import (
	"database/sql/driver"
	
	"fmt"
	"strings"
	"time"
)

type LottoTime struct {
	time.Time
}

func (lt *LottoTime) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), "\"")
	if s == "null" || s == "" {
		lt.Time = time.Time{}
		return nil
	}
	// Try standard RFC3339 first
	t, err := time.Parse(time.RFC3339, s)
	if err == nil {
		lt.Time = t
		return nil
	}
	// Then try the format in the Lao API: "2026-03-25T00:00:00"
	t, err = time.Parse("2006-01-02T15:04:05", s)
	if err == nil {
		lt.Time = t
		return nil
	}
	return err
}

func (lt LottoTime) Value() (driver.Value, error) {
	return lt.Time, nil
}

func (lt *LottoTime) Scan(value interface{}) error {
	if t, ok := value.(time.Time); ok {
		lt.Time = t
		return nil
	}
	return fmt.Errorf("could not scan type %T into LottoTime", value)
}

type PrizeHistory struct {
	ID               int       `json:"id" db:"id"`
	RoundID          int       `json:"roundId" db:"round_id"`
	RoundDate        LottoTime `json:"roundDate" db:"round_date"`
	RoundDescription string    `json:"roundDescription" db:"round_description"`
	RoundStartTime   LottoTime `json:"roundStartTime" db:"round_start_time"`
	RoundEndTime     LottoTime `json:"roundEndTime" db:"round_end_time"`
	RoundNumber      string    `json:"roundNumber" db:"round_number"`
	WinNumber        string    `json:"winNumber" db:"win_number"`
	LotNumber        int       `json:"lotNumber" db:"lot_number"`
	YearID           int       `json:"yearId" db:"year_id"`
	IsCloseSale      bool      `json:"isCloseSale" db:"is_close_sale"`
	RoundStatus      int       `json:"roundStatus" db:"round_status"`
	IsJackpot        bool      `json:"isjackpot" db:"is_jackpot"`
}

type APIResponse struct {
	Status     int            `json:"status"`
	Error      bool           `json:"error"`
	Msg        string         `json:"msg"`
	Message    string         `json:"message"`
	ResultData []PrizeHistory `json:"resultData"`
}
