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
		// Default development string if none provided (from ap-southeast-1)
		connStr = "postgresql://postgres.mbjgjskyuatvkwawcxqn:Ampha1%40.T0m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	// Run Migrations Individually
	statements := []string{
		`CREATE TABLE IF NOT EXISTS prize_history (
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
		)`,
		`CREATE TABLE IF NOT EXISTS predictions (
			id SERIAL PRIMARY KEY,
			numbers TEXT,
			probability FLOAT,
			source TEXT DEFAULT 'manual',
			explanation TEXT DEFAULT '',
			predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'`,
		`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS explanation TEXT DEFAULT ''`,
	}

	for _, stmt := range statements {
		_, err = db.Exec(stmt)
		if err != nil {
			// We log but don't fatal, as ADD COLUMN IF NOT EXISTS might not be supported 
			// and we rely on the manual check if needed, but here it's for safety.
			log.Printf("Migration Update: %v", err)
		}
	}

	fmt.Println("Database initialized successfully.")
	return db
}
