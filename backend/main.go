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

	// 2. Synchronize Live Data (non-blocking)
	go func() {
		_, _ = handlers.SyncData()
	}()

	// 3. Register Business Routes
	routes.RegisterRoutes()

	// 4. Serve Static Frontend Files
	staticDir := "frontend/build"
	
	// Create a catch-all handler for the frontend
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If the request is for /api/, it MUST NOT be handled here.
		// Go's DefaultServeMux should have already matched it to an API route.
		// If we reach here with an /api/ path, it means the route doesn't exist.
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		// Clean the path to prevent directory traversal
		cleanPath := filepath.Clean(r.URL.Path)
		fullPath := filepath.Join(staticDir, cleanPath)

		// Check if file exists and is not a directory
		info, err := os.Stat(fullPath)
		if os.IsNotExist(err) || info.IsDir() {
			// Serve index.html for SPA routing
			http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
			return
		}

		// Otherwise serve the file normally
		http.ServeFile(w, r, fullPath)
	})

	// 5. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	fmt.Printf("LottoAnalytica Backend [v4.1.0] - Stable Architecture\n")
	fmt.Printf("Node status: ACTIVE | Port: %s\n", port)
	
	err := http.ListenAndServe("0.0.0.0:"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

