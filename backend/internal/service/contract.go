package service

import (
	"context"
	"fmt"

	"github.com/dubai/platform/backend/internal/db"
	"github.com/dubai/platform/backend/internal/models"
)

type ContractService struct{}

func NewContractService() *ContractService {
	return &ContractService{}
}

func (s *ContractService) List(ctx context.Context) ([]models.Contract, error) {
	query := `SELECT id, client_id, talent_id, project_id, contract_type, status, start_date, end_date, file_url, file_key, created_at FROM contracts`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contracts []models.Contract
	for rows.Next() {
		var c models.Contract
		err := rows.Scan(
			&c.ID, &c.ClientID, &c.TalentID, &c.ProjectID, &c.Type, &c.Status, &c.StartDate, &c.EndDate, &c.FileURL, &c.FileKey, &c.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		contracts = append(contracts, c)
	}
	return contracts, nil
}

func (s *ContractService) Create(ctx context.Context, c *models.Contract) error {
	query := `
		INSERT INTO contracts (client_id, talent_id, project_id, contract_type, status, start_date, end_date, notice_period_days, file_url, file_key)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at
	`
	// Status defaults to DRAFT
	if c.Status == "" {
		c.Status = "DRAFT"
	}

	return db.Pool.QueryRow(ctx, query,
		c.ClientID, c.TalentID, c.ProjectID, c.Type, c.Status, c.StartDate, c.EndDate, c.NoticePeriod, c.FileURL, c.FileKey,
	).Scan(&c.ID, &c.CreatedAt)
}

func (s *ContractService) Delete(ctx context.Context, id string) error {
	// 1. Get file_key
	var fileKey *string
	query := `SELECT file_key FROM contracts WHERE id = $1`
	err := db.Pool.QueryRow(ctx, query, id).Scan(&fileKey)
	if err != nil {
		return err
	}

	// 2. Delete from Uploadthing
	if fileKey != nil && *fileKey != "" {
		if err := DeleteFromUploadthing(*fileKey); err != nil {
			fmt.Printf("Warning: Failed to delete contract file from Uploadthing: %v\n", err)
		}
	}

	// 3. Delete from DB
	query = `DELETE FROM contracts WHERE id = $1`
	_, err = db.Pool.Exec(ctx, query, id)
	return err
}
