package main

import (
	"fmt"
	"log"
	"net/http"
	"lottery-backend/db"
	"lottery-backend/handlers"
	"lottery-backend/routes"
)

func main() {
	// 1. Initialize Database
	database := db.InitDB()
	defer database.Close()

	// 2. Synchronize Live Data
	_, _ = handlers.SyncData()

	// 3. Register Business Routes
	routes.RegisterRoutes()

	// 4. Start Server
	fmt.Println("LottoAnalytica Backend [v4.1.0] - Stable Architecture")
	fmt.Println("Node status: ACTIVE | Port: 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
