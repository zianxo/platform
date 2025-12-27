package models

import (
	"time"

	"github.com/google/uuid"
)

type Capital struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Balance   float64   `json:"balance"`
	Currency  string    `json:"currency"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Budget struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	TotalAmount float64   `json:"total_amount"`
	SpentAmount float64   `json:"spent_amount,omitempty"` // Computed
	StartDate   string    `json:"start_date"`             // YYYY-MM-DD
	EndDate     string    `json:"end_date"`               // YYYY-MM-DD
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

type Expense struct {
	ID          uuid.UUID  `json:"id"`
	Description string     `json:"description"`
	Amount      float64    `json:"amount"`
	Category    string     `json:"category"`
	Date        string     `json:"date"` // YYYY-MM-DD
	BudgetID    *uuid.UUID `json:"budget_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Investment struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	Investor      string    `json:"investor"`
	InitialAmount float64   `json:"initial_amount"`
	CurrentValue  float64   `json:"current_value"`
	StartDate     string    `json:"start_date"` // YYYY-MM-DD
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}
