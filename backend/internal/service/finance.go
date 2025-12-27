package service

import (
	"context"
	"time"

	"github.com/dubai/platform/backend/internal/db"
	"github.com/dubai/platform/backend/internal/models"
	"github.com/google/uuid"
)

type FinanceService struct{}

func NewFinanceService() *FinanceService {
	return &FinanceService{}
}

// CAPITAL

func (s *FinanceService) ListCapital(ctx context.Context) ([]models.Capital, error) {
	rows, err := db.Pool.Query(ctx, "SELECT id, name, balance, currency, updated_at FROM financial_capital ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var caps []models.Capital
	for rows.Next() {
		var c models.Capital
		if err := rows.Scan(&c.ID, &c.Name, &c.Balance, &c.Currency, &c.UpdatedAt); err != nil {
			return nil, err
		}
		caps = append(caps, c)
	}
	return caps, nil
}

func (s *FinanceService) CreateCapital(ctx context.Context, c models.Capital) (*models.Capital, error) {
	query := `INSERT INTO financial_capital (name, balance, currency) VALUES ($1, $2, $3) RETURNING id, updated_at`
	err := db.Pool.QueryRow(ctx, query, c.Name, c.Balance, c.Currency).Scan(&c.ID, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// BUDGETS

func (s *FinanceService) ListBudgets(ctx context.Context) ([]models.Budget, error) {
	query := `
		SELECT b.id, b.name, b.total_amount, b.start_date, b.end_date, b.status, b.created_at,
		       COALESCE(SUM(e.amount), 0) as spent_amount
		FROM budgets b
		LEFT JOIN expenses e ON b.id = e.budget_id
		GROUP BY b.id
		ORDER BY b.created_at DESC
	`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var budgets []models.Budget
	for rows.Next() {
		var b models.Budget
		var startDate, endDate time.Time
		if err := rows.Scan(&b.ID, &b.Name, &b.TotalAmount, &startDate, &endDate, &b.Status, &b.CreatedAt, &b.SpentAmount); err != nil {
			return nil, err
		}
		b.StartDate = startDate.Format("2006-01-02")
		b.EndDate = endDate.Format("2006-01-02")
		budgets = append(budgets, b)
	}
	return budgets, nil
}

func (s *FinanceService) CreateBudget(ctx context.Context, b models.Budget) (*models.Budget, error) {
	query := `INSERT INTO budgets (name, total_amount, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	err := db.Pool.QueryRow(ctx, query, b.Name, b.TotalAmount, b.StartDate, b.EndDate, b.Status).Scan(&b.ID, &b.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// EXPENSES

func (s *FinanceService) ListExpenses(ctx context.Context) ([]models.Expense, error) {
	rows, err := db.Pool.Query(ctx, "SELECT id, description, amount, category, date, budget_id, created_at FROM expenses ORDER BY date DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var expenses []models.Expense
	for rows.Next() {
		var e models.Expense
		var date time.Time
		if err := rows.Scan(&e.ID, &e.Description, &e.Amount, &e.Category, &date, &e.BudgetID, &e.CreatedAt); err != nil {
			return nil, err
		}
		e.Date = date.Format("2006-01-02")
		expenses = append(expenses, e)
	}
	return expenses, nil
}

func (s *FinanceService) CreateExpense(ctx context.Context, e models.Expense) (*models.Expense, error) {
	query := `INSERT INTO expenses (description, amount, category, date, budget_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	err := db.Pool.QueryRow(ctx, query, e.Description, e.Amount, e.Category, e.Date, e.BudgetID).Scan(&e.ID, &e.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

// INVESTMENTS

func (s *FinanceService) ListInvestments(ctx context.Context) ([]models.Investment, error) {
	rows, err := db.Pool.Query(ctx, "SELECT id, name, investor, initial_amount, current_value, start_date, status, created_at FROM investments ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var investments []models.Investment
	for rows.Next() {
		var i models.Investment
		var startDate time.Time
		if err := rows.Scan(&i.ID, &i.Name, &i.Investor, &i.InitialAmount, &i.CurrentValue, &startDate, &i.Status, &i.CreatedAt); err != nil {
			return nil, err
		}
		i.StartDate = startDate.Format("2006-01-02")
		investments = append(investments, i)
	}
	return investments, nil
}

func (s *FinanceService) CreateInvestment(ctx context.Context, i models.Investment) (*models.Investment, error) {
	query := `INSERT INTO investments (name, investor, initial_amount, current_value, start_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`
	err := db.Pool.QueryRow(ctx, query, i.Name, i.Investor, i.InitialAmount, i.CurrentValue, i.StartDate, i.Status).Scan(&i.ID, &i.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func (s *FinanceService) UpdateInvestment(ctx context.Context, id uuid.UUID, i models.Investment) (*models.Investment, error) {
	query := `UPDATE investments SET current_value = $1, status = $2 WHERE id = $3 RETURNING updated_at` // Simplification
	// Ideally update all fields
	query = `UPDATE investments SET name=$1, investor=$2, initial_amount=$3, current_value=$4, start_date=$5, status=$6 WHERE id=$7`
	_, err := db.Pool.Exec(ctx, query, i.Name, i.Investor, i.InitialAmount, i.CurrentValue, i.StartDate, i.Status, id)
	if err != nil {
		return nil, err
	}
	i.ID = id
	return &i, nil
}

// Dashboard Overview Data (Optional, but useful)
// Can be composed of the above, or a dedicated struct.
