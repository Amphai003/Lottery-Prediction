package models

type APIResponse struct {
	Status     int    `json:"status"`
	Error      bool   `json:"error"`
	Msg        string `json:"msg"`
	Message    string `json:"message"`
	ResultData []struct {
		ID          int    `json:"id"`
		RoundID     int    `json:"roundId"`
		RoundDate   string `json:"roundDate"`
		WinNumber   string `json:"winNumber"`
		RoundNumber string `json:"roundNumber"`
	} `json:"resultData"`
}
