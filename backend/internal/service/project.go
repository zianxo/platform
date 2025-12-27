package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/dubai/platform/backend/internal/db"
	"github.com/dubai/platform/backend/internal/models"
)

type ProjectService struct{}

func NewProjectService() *ProjectService {
	return &ProjectService{}
}

func (s *ProjectService) List(ctx context.Context) ([]models.Project, error) {
	// RBAC: Check role and client_id from context
	role, _ := ctx.Value("role").(string)
	clientID, _ := ctx.Value("client_id").(string)

	fmt.Printf("DEBUG: ProjectService.List - Role: %s, ClientID: %s\n", role, clientID)

	baseQuery := `
		SELECT 
			p.id, p.client_id, p.name, p.description, p.status::text, p.engagement_type, p.monthly_budget, p.target_hours_per_week, p.billable_days_per_month, p.created_at,
			(SELECT COUNT(*) FROM project_assignments pa WHERE pa.project_id = p.id AND pa.status = 'ACTIVE') as active_assignments_count,
			(SELECT COALESCE(SUM(pa.hours_per_week), 0) FROM project_assignments pa WHERE pa.project_id = p.id AND pa.status = 'ACTIVE') as current_weekly_hours,
			(SELECT COALESCE(SUM(pa.monthly_client_rate), 0) FROM project_assignments pa WHERE pa.project_id = p.id AND pa.status = 'ACTIVE') as actual_monthly_revenue,
			(SELECT COALESCE(SUM(pa.monthly_contractor_cost), 0) FROM project_assignments pa WHERE pa.project_id = p.id AND pa.status = 'ACTIVE') as actual_monthly_cost,
			(SELECT COALESCE(SUM(ppr.count * ppr.bill_rate * COALESCE(p.billable_days_per_month, 21)), 0) FROM project_planned_roles ppr WHERE ppr.project_id = p.id) as planned_monthly_revenue,
			(SELECT COALESCE(json_agg(json_build_object('id', t.id, 'first_name', t.first_name, 'last_name', t.last_name, 'role', pa.role)), '[]') 
			 FROM project_assignments pa 
			 JOIN talent t ON pa.talent_id = t.id 
			 WHERE pa.project_id = p.id AND pa.status = 'ACTIVE') as team_members
		FROM projects p 
	`

	var args []interface{}
	// Robust RBAC: If the user belongs to a client (has clientID), strictly filter by it.
	// This handles CLIENT_ADMIN, CLIENT_USER, and even mistakenly assigned ADMIN roles that have a client_id.
	if clientID != "" {
		baseQuery += " WHERE p.client_id = $1"
		args = append(args, clientID)
	}

	baseQuery += " ORDER BY p.created_at DESC"

	rows, err := db.Pool.Query(ctx, baseQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var p models.Project
		var teamMembersJSON []byte
		err := rows.Scan(
			&p.ID, &p.ClientID, &p.Name, &p.Description, &p.Status, &p.EngagementType, &p.MonthlyBudget, &p.TargetHoursPerWeek, &p.BillableDaysPerMonth, &p.CreatedAt,
			&p.ActiveAssignmentsCount, &p.CurrentWeeklyHours,
			&p.ActualMonthlyRevenue, &p.ActualMonthlyCost, &p.PlannedMonthlyRevenue,
			&teamMembersJSON,
		)
		if err != nil {
			return nil, err
		}
		if len(teamMembersJSON) > 0 {
			_ = json.Unmarshal(teamMembersJSON, &p.TeamMembers)
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (s *ProjectService) Get(ctx context.Context, id string) (*models.Project, error) {
	query := `SELECT id, client_id, name, description, status::text, engagement_type, monthly_budget, target_hours_per_week, billable_days_per_month, created_at FROM projects WHERE id = $1`
	var p models.Project
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.ClientID, &p.Name, &p.Description, &p.Status, &p.EngagementType, &p.MonthlyBudget, &p.TargetHoursPerWeek, &p.BillableDaysPerMonth, &p.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Fetch Planned Roles
	rolesQuery := `SELECT id, project_id, role_name, count, bill_rate, created_at FROM project_planned_roles WHERE project_id = $1`
	rows, err := db.Pool.Query(ctx, rolesQuery, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var pr models.PlannedRole
		if err := rows.Scan(&pr.ID, &pr.ProjectID, &pr.RoleName, &pr.Count, &pr.BillRate, &pr.CreatedAt); err != nil {
			return nil, err
		}
		p.PlannedRoles = append(p.PlannedRoles, pr)
	}

	return &p, nil
}

func (s *ProjectService) Create(ctx context.Context, p *models.Project) error {
	query := `
		INSERT INTO projects (client_id, name, description, status, engagement_type, monthly_budget, target_hours_per_week, billable_days_per_month)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`
	// Defaults if missing
	if p.EngagementType == "" {
		p.EngagementType = "TIME_AND_MATERIALS"
	}
	if p.BillableDaysPerMonth == nil {
		d := 21
		p.BillableDaysPerMonth = &d
	}

	err := db.Pool.QueryRow(ctx, query,
		p.ClientID, p.Name, p.Description, p.Status, p.EngagementType, p.MonthlyBudget, p.TargetHoursPerWeek, p.BillableDaysPerMonth,
	).Scan(&p.ID, &p.CreatedAt)
	if err != nil {
		return err
	}

	// Insert Planned Roles
	for _, pr := range p.PlannedRoles {
		roleQuery := `INSERT INTO project_planned_roles (project_id, role_name, count, bill_rate) VALUES ($1, $2, $3, $4)`
		_, err := db.Pool.Exec(ctx, roleQuery, p.ID, pr.RoleName, pr.Count, pr.BillRate)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *ProjectService) Update(ctx context.Context, id string, p *models.Project) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		UPDATE projects 
		SET name = $1, description = $2, status = $3, engagement_type = $4, monthly_budget = $5, target_hours_per_week = $6, billable_days_per_month = $7
		WHERE id = $8
		RETURNING created_at
	`
	err = tx.QueryRow(ctx, query,
		p.Name, p.Description, p.Status, p.EngagementType, p.MonthlyBudget, p.TargetHoursPerWeek, p.BillableDaysPerMonth, id,
	).Scan(&p.CreatedAt)
	if err != nil {
		return err
	}

	// Update Planned Roles (Reflect blueprint changes)
	_, err = tx.Exec(ctx, `DELETE FROM project_planned_roles WHERE project_id = $1`, id)
	if err != nil {
		return err
	}

	for _, pr := range p.PlannedRoles {
		roleQuery := `INSERT INTO project_planned_roles (project_id, role_name, count, bill_rate) VALUES ($1, $2, $3, $4)`
		_, err := tx.Exec(ctx, roleQuery, id, pr.RoleName, pr.Count, pr.BillRate)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (s *ProjectService) Delete(ctx context.Context, id string) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Check for financial records that block deletion
	var count int

	// Check invoices
	err = tx.QueryRow(ctx, "SELECT COUNT(*) FROM invoice_line_items WHERE project_id = $1", id).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("cannot delete project: it has %d invoice records. Please remove these records first to maintain financial integrity", count)
	}

	// Check payments
	err = tx.QueryRow(ctx, "SELECT COUNT(*) FROM contractor_payments WHERE project_id = $1", id).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("cannot delete project: it has %d contractor payment records. Please remove these records first", count)
	}

	// Explicitly cleanup assignments if they cause issues (though DB has ON DELETE CASCADE on project_id)
	// Some DB environments might have different constraints or trigger behaviors.
	_, err = tx.Exec(ctx, `DELETE FROM project_assignments WHERE project_id = $1`, id)
	if err != nil {
		return err
	}

	// Delete the project
	_, err = tx.Exec(ctx, `DELETE FROM projects WHERE id = $1`, id)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
