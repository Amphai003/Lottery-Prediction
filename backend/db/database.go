package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() *sql.DB {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		// Use fallback from local development
		log.Println("WARNING: DATABASE_URL not set, using local fallback connection string.")
		connStr = "postgres://postgres:AA%40pgadmin%232025@localhost:5432/lottery_db?sslmode=disable"
	}
	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("FATAL: Failed to open database connection: %v", err)
	}

	// Verify the connection is actually alive
	if err = DB.Ping(); err != nil {
		log.Fatalf("FATAL: Cannot reach database. Check DATABASE_URL environment variable. Error: %v", err)
	}

	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS prize_history (
		id SERIAL PRIMARY KEY,
		api_id INT UNIQUE,
		round_id TEXT,
		round_date TIMESTAMP,
		win_number TEXT,
		round_number TEXT
	)`)
	if err != nil { log.Fatalf("FATAL: Failed to create prize_history table: %v", err) }

	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS predictions (
		id SERIAL PRIMARY KEY,
		numbers TEXT,
		probability DOUBLE PRECISION,
		source TEXT DEFAULT 'manual',
		predicted_at TIMESTAMP
	)`)
	if err != nil { log.Fatalf("FATAL: Failed to create predictions table: %v", err) }
	_, _ = DB.Exec("ALTER TABLE predictions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'")

	fmt.Println("Database initialized successfully.")
	return DB
}
