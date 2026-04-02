package routes

import (
	"net/http"
	"lottery-backend/handlers"
)

func RegisterRoutes() {
	http.HandleFunc("/api/history", handlers.GetHistoryHandler)
	http.HandleFunc("/api/ai-predict", handlers.AIPredictHandler)
	http.HandleFunc("/api/local-predict", handlers.LocalPredictHandler)
	http.HandleFunc("/api/save-prediction", handlers.SavePredictionHandler)
	http.HandleFunc("/api/save-batch", handlers.SaveBatchHandler)
	http.HandleFunc("/api/predictions", handlers.GetSavedPredictionsHandler)
	http.HandleFunc("/api/delete-prediction", handlers.DeletePredictionHandler)
	http.HandleFunc("/api/purge", handlers.PurgeHandler)
	http.HandleFunc("/api/sync", handlers.SyncHandler)
}
