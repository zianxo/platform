package service

import (
	"context"

	"github.com/dubai/platform/backend/internal/db"
	"github.com/dubai/platform/backend/internal/models"
)

type AssignmentService struct{}

func NewAssignmentService() *AssignmentService {
	return &AssignmentService{}
}

func (s *AssignmentService) List(ctx context.Context) ([]models.ProjectAssignment, error) {
	query := `SELECT id, project_id, client_id, talent_id, role, start_date, trial_end_date, monthly_client_rate, monthly_contractor_cost, daily_payout_rate, daily_bill_rate, hours_per_week, status, created_at FROM project_assignments`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assignments []models.ProjectAssignment
	for rows.Next() {
		var a models.ProjectAssignment
		err := rows.Scan(
			&a.ID, &a.ProjectID, &a.ClientID, &a.TalentID, &a.Role, &a.StartDate, &a.TrialEndDate,
			&a.MonthlyClientRate, &a.MonthlyContractorCost, &a.DailyPayoutRate, &a.DailyBillRate, &a.HoursPerWeek, &a.Status, &a.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		assignments = append(assignments, a)
	}
	return assignments, nil
}

func (s *AssignmentService) Get(ctx context.Context, id string) (*models.ProjectAssignment, error) {
	query := `SELECT id, project_id, client_id, talent_id, role, start_date, trial_end_date, monthly_client_rate, monthly_contractor_cost, daily_payout_rate, daily_bill_rate, hours_per_week, status, created_at FROM project_assignments WHERE id = $1`
	var a models.ProjectAssignment
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&a.ID, &a.ProjectID, &a.ClientID, &a.TalentID, &a.Role, &a.StartDate, &a.TrialEndDate,
		&a.MonthlyClientRate, &a.MonthlyContractorCost, &a.DailyPayoutRate, &a.DailyBillRate, &a.HoursPerWeek, &a.Status, &a.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (s *AssignmentService) ListByProject(ctx context.Context, projectID string) ([]models.ProjectAssignment, error) {
	query := `SELECT id, project_id, client_id, talent_id, role, start_date, trial_end_date, monthly_client_rate, monthly_contractor_cost, daily_payout_rate, daily_bill_rate, hours_per_week, status, created_at FROM project_assignments WHERE project_id = $1`
	rows, err := db.Pool.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assignments []models.ProjectAssignment
	for rows.Next() {
		var a models.ProjectAssignment
		err := rows.Scan(
			&a.ID, &a.ProjectID, &a.ClientID, &a.TalentID, &a.Role, &a.StartDate, &a.TrialEndDate,
			&a.MonthlyClientRate, &a.MonthlyContractorCost, &a.DailyPayoutRate, &a.DailyBillRate, &a.HoursPerWeek, &a.Status, &a.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		assignments = append(assignments, a)
	}
	return assignments, nil
}

func (s *AssignmentService) Create(ctx context.Context, a *models.ProjectAssignment) error {
	// 1. Fetch Client ID from the parent Project
	var clientID string
	err := db.Pool.QueryRow(ctx, "SELECT client_id FROM projects WHERE id = $1", a.ProjectID).Scan(&clientID)
	if err != nil {
		return err // Handle if project doesn't exist
	}

	// Calculate Monthly values from Daily if provided (21.73 days avg)
	avgDays := 21.73
	if a.DailyPayoutRate != nil && *a.DailyPayoutRate > 0 {
		a.MonthlyContractorCost = *a.DailyPayoutRate * avgDays
	}
	if a.DailyBillRate != nil && *a.DailyBillRate > 0 {
		monthly := *a.DailyBillRate * avgDays
		a.MonthlyClientRate = &monthly
	}

	query := `
		INSERT INTO project_assignments (project_id, client_id, talent_id, role, start_date, trial_end_date, monthly_client_rate, monthly_contractor_cost, daily_payout_rate, daily_bill_rate, hours_per_week, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at
	`
	status := "TRIAL"
	if a.Status != "" {
		status = a.Status
	}
	// Use the fetched clientID
	return db.Pool.QueryRow(ctx, query,
		a.ProjectID, clientID, a.TalentID, a.Role, a.StartDate, a.TrialEndDate,
		a.MonthlyClientRate, a.MonthlyContractorCost, a.DailyPayoutRate, a.DailyBillRate, a.HoursPerWeek, status,
	).Scan(&a.ID, &a.CreatedAt)
}

func (s *AssignmentService) Update(ctx context.Context, id string, a *models.ProjectAssignment) error {
	// Calculate Monthly values from Daily if provided (21.73 days avg)
	avgDays := 21.73
	if a.DailyPayoutRate != nil && *a.DailyPayoutRate > 0 {
		a.MonthlyContractorCost = *a.DailyPayoutRate * avgDays
	}
	if a.DailyBillRate != nil && *a.DailyBillRate > 0 {
		monthly := *a.DailyBillRate * avgDays
		a.MonthlyClientRate = &monthly
	}

	query := `
		UPDATE project_assignments 
		SET role = $1, start_date = $2, monthly_client_rate = $3, monthly_contractor_cost = $4, daily_payout_rate = $5, daily_bill_rate = $6, hours_per_week = $7, status = $8, talent_id = $9
		WHERE id = $10
		RETURNING created_at
	`
	status := "TRIAL"
	if a.Status != "" {
		status = a.Status
	}
	return db.Pool.QueryRow(ctx, query,
		a.Role, a.StartDate, a.MonthlyClientRate, a.MonthlyContractorCost, a.DailyPayoutRate, a.DailyBillRate, a.HoursPerWeek, status, a.TalentID, id,
	).Scan(&a.CreatedAt)
}
func (s *AssignmentService) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM project_assignments WHERE id = $1`
	_, err := db.Pool.Exec(ctx, query, id)
	return err
}
