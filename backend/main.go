package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
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

	// 4. Serve Static Frontend Files
	// Check for environment variable to determine if we should serve static files
	// (usually true in production)
	staticDir := "frontend/build"
	
	// Create a catch-all handler for the frontend
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If the request starts with /api/, it's handled by other routes
		if strings.HasPrefix(r.URL.Path, "/api/") {
			return
		}

		// Get the absolute path to prevent directory traversal
		path, err := filepath.Abs(filepath.Join(staticDir, r.URL.Path))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Check if file exists and is not a directory
		info, err := os.Stat(path)
		if os.IsNotExist(err) || info.IsDir() {
			// Serve index.html for SPA routing
			http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
			return
		}

		// Otherwise serve the file normally
		http.FileServer(http.Dir(staticDir)).ServeHTTP(w, r)
	})

	// 5. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	fmt.Printf("LottoAnalytica Backend [v4.1.0] - Stable Architecture\n")
	fmt.Printf("Node status: ACTIVE | Port: %s\n", port)
	
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

