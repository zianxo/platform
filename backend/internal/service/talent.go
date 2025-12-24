package service

import (
	"context"
	"log"

	"github.com/dubai/platform/backend/internal/db"
	"github.com/dubai/platform/backend/internal/models"
)

type TalentService struct{}

func NewTalentService() *TalentService {
	return &TalentService{}
}

func (s *TalentService) ListTalent(ctx context.Context) ([]models.Talent, error) {
	query := `SELECT id, first_name, last_name, email, role, seniority, source, notes, country, status::text, created_at FROM talent`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		log.Printf("ListTalent Query Error: %v", err)
		return nil, err
	}
	defer rows.Close()

	var talents []models.Talent
	for rows.Next() {
		var t models.Talent
		err := rows.Scan(
			&t.ID, &t.FirstName, &t.LastName, &t.Email, &t.Role, &t.Seniority, &t.Source, &t.Notes, &t.Country, &t.Status, &t.CreatedAt,
		)
		if err != nil {
			log.Printf("ListTalent Scan Error: %v", err)
			return nil, err
		}
		talents = append(talents, t)
	}
	return talents, nil
}

func (s *TalentService) Get(ctx context.Context, id string) (*models.Talent, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Fetch Basic Info
	query := `SELECT id, first_name, last_name, email, role, seniority, source, notes, country, status::text, created_at FROM talent WHERE id = $1`
	var t models.Talent
	err = tx.QueryRow(ctx, query, id).Scan(
		&t.ID, &t.FirstName, &t.LastName, &t.Email, &t.Role, &t.Seniority, &t.Source, &t.Notes, &t.Country, &t.Status, &t.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	// 2. Fetch Skills
	skillQuery := `
        SELECT s.name 
        FROM skills s 
        JOIN talent_skills ts ON s.id = ts.skill_id 
        WHERE ts.talent_id = $1
    `
	rows, err := tx.Query(ctx, skillQuery, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		skills = append(skills, name)
	}
	t.Skills = skills

	// 3. Fetch History
	historyQuery := `
		SELECT status::text, notes, changed_at 
		FROM talent_status_history 
		WHERE talent_id = $1 
		ORDER BY changed_at DESC
	`
	hRows, err := tx.Query(ctx, historyQuery, id)
	if err != nil {
		return nil, err
	}
	defer hRows.Close()

	var history []models.StatusHistory
	for hRows.Next() {
		var h models.StatusHistory
		var statusStr string
		// Postgres ENUM might read as string?
		if err := hRows.Scan(&statusStr, &h.Notes, &h.ChangedAt); err != nil {
			return nil, err
		}
		h.Status = statusStr
		history = append(history, h)
	}
	t.History = history

	return &t, tx.Commit(ctx)
}

func (s *TalentService) Create(ctx context.Context, t *models.Talent) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO talent (first_name, last_name, email, role, seniority, source, notes, country, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at
	`
	status := "SOURCED"
	if t.Status != nil && *t.Status != "" {
		status = *t.Status
	}

	err = tx.QueryRow(ctx, query,
		t.FirstName, t.LastName, t.Email, t.Role, t.Seniority, t.Source, t.Notes, t.Country, status,
	).Scan(&t.ID, &t.CreatedAt)
	t.Status = &status
	if err != nil {
		return err
	}

	// 1. Log Status History (Initial Status: SOURCED)
	statusQuery := `
		INSERT INTO talent_status_history (talent_id, status, notes)
		VALUES ($1, $2::talent_status, $3)
	`
	_, err = tx.Exec(ctx, statusQuery, t.ID, "SOURCED", "Initial creation")
	if err != nil {
		return err
	}

	// 2. Link Skills
	if len(t.Skills) > 0 {
		skillQuery := `INSERT INTO talent_skills (talent_id, skill_id) VALUES ($1, $2)`
		for _, skillID := range t.Skills {
			_, err = tx.Exec(ctx, skillQuery, t.ID, skillID)
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit(ctx)
}

func (s *TalentService) Update(ctx context.Context, id string, t *models.Talent) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 0. Get current status for history check
	var oldStatus string
	err = tx.QueryRow(ctx, "SELECT status FROM talent WHERE id = $1", id).Scan(&oldStatus)
	if err != nil {
		return err
	}

	query := `
		UPDATE talent 
		SET first_name = $1, last_name = $2, email = $3, role = $4, seniority = $5, source = $6, notes = $7, country = $8, status = $9
		WHERE id = $10
		RETURNING created_at
	`
	newStatus := oldStatus
	if t.Status != nil && *t.Status != "" {
		newStatus = *t.Status
	}

	err = tx.QueryRow(ctx, query,
		t.FirstName, t.LastName, t.Email, t.Role, t.Seniority, t.Source, t.Notes, t.Country, newStatus, id,
	).Scan(&t.CreatedAt)
	if err != nil {
		return err
	}

	// 0a. Log history if status changed
	if newStatus != oldStatus {
		statusQuery := `
			INSERT INTO talent_status_history (talent_id, status, notes)
			VALUES ($1, $2::talent_status, $3)
		`
		_, err = tx.Exec(ctx, statusQuery, id, newStatus, "Status updated via Talent Edit")
		if err != nil {
			return err
		}
	}

	// Update Skills: Simple approach -> Delete all and re-insert
	// A better approach would be checking diffs, but this is MVP.
	_, err = tx.Exec(ctx, "DELETE FROM talent_skills WHERE talent_id = $1", id)
	if err != nil {
		return err
	}

	if len(t.Skills) > 0 {
		skillQuery := `INSERT INTO talent_skills (talent_id, skill_id) VALUES ($1, $2)`
		for _, skillNameOrID := range t.Skills {
			// Basic handling assuming IDs are passed.
			// If Names are passed in UI, we need to lookup IDs or Insert them if they don't exist.
			// For now, assuming UI passes IDs from the available list.
			// Wait, the UI uses names for badges?
			// Checking TalentForm... it toggles skill.id. So we get IDs.
			_, err = tx.Exec(ctx, skillQuery, id, skillNameOrID)
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit(ctx)
}
