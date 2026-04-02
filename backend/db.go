package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func initDB() *sql.DB {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		// Default local development string if none provided
		connStr = "postgres://postgres:AA%40pgadmin%232025@localhost:5432/lottery_db?sslmode=disable"
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	// Create table if not exists
	schema := `
	CREATE TABLE IF NOT EXISTS prize_history (
		id SERIAL PRIMARY KEY,
		api_id INTEGER UNIQUE,
		round_id INTEGER,
		round_date TIMESTAMP,
		round_description TEXT,
		round_start_time TIMESTAMP,
		round_end_time TIMESTAMP,
		round_number TEXT,
		win_number TEXT,
		lot_number INTEGER,
		year_id INTEGER,
		is_close_sale BOOLEAN,
		round_status INTEGER,
		is_jackpot BOOLEAN,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS predictions (
		id SERIAL PRIMARY KEY,
		numbers TEXT,
		probability FLOAT,
		source TEXT DEFAULT 'manual',
		predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	ALTER TABLE predictions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
	`
	_, err = db.Exec(schema)
	if err != nil {
		log.Printf("Could not update schema: %v", err)
	}

	fmt.Println("Database initialized successfully.")
	return db
}
