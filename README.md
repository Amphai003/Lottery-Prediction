# Lottery Prediction Dashboard

A premium, full-stack predictive analytics suite for lottery data.

## Project Structure
- **/frontend**: React + Vite + Tailwind CSS dashboard.
- **/backend**: Golang service with PostgreSQL integration and data scraping.

## Prerequisites
- Node.js (v18+) & Yarn
- Go (v1.20+)
- PostgreSQL (running on port 5432 or via `DATABASE_URL` env var)

## Getting Started

### 1. Setup Backend
```bash
cd backend
go mod tidy
# Ensure PostgreSQL is running then:
cp .env.example .env
# Edit .env and paste your API keys
DATABASE_URL=postgres://user:pass@localhost:5432/lottery_db go run .
```
The backend will:
- Auto-create the `prize_history` table.
- Fetch historical data from `laodl.com`.
- Sync it with your local PostgreSQL.
- Serve JSON data at `http://localhost:8080/api/history`.

### 2. Setup Frontend
```bash
cd frontend
yarn
yarn dev
```
The frontend will:
- Fetch real historical data from your backend.
- Analyze "Hot" and "Cold" number frequencies.
- Visualize trends in real-time.
- Provide AI forecasts based on current probability models.

## Features
- **Real-time Data Sync**: Automated fetching from external lottery APIs.
- **Predictive Analytics**: Frequency-based hot/cold number detection.
- **Premium UI**: Glassmorphism, animations, and high-tech aesthetics.
- **Database Persistence**: Historical data stored in PostgreSQL for AI training.

## API Endpoints
- `GET /api/history`: Returns the complete winning history.
- `GET /api/sync`: Manually triggers a data refresh from the external source.

---
Disclaimer: For entertainment purposes only. Predictive systems are probabilistic models. Play responsibly.
