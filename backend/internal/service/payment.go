package service

import (
	"context"

	"github.com/dubai/platform/backend/internal/db"
	"github.com/dubai/platform/backend/internal/models"
)

type PaymentService struct{}

func NewPaymentService() *PaymentService {
	return &PaymentService{}
}

func (s *PaymentService) List(ctx context.Context) ([]models.ContractorPayment, error) {
	query := `SELECT id, talent_id, project_id, billing_month, amount, status, created_at FROM contractor_payments`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []models.ContractorPayment
	for rows.Next() {
		var p models.ContractorPayment
		err := rows.Scan(
			&p.ID, &p.TalentID, &p.ProjectID, &p.BillingMonth, &p.Amount, &p.Status, &p.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		payments = append(payments, p)
	}
	return payments, nil
}

func (s *PaymentService) Create(ctx context.Context, p *models.ContractorPayment) error {
	query := `
		INSERT INTO contractor_payments (talent_id, project_id, billing_month, amount, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	status := "PENDING"
	if p.Status != "" {
		status = p.Status
	}
	return db.Pool.QueryRow(ctx, query,
		p.TalentID, p.ProjectID, p.BillingMonth, p.Amount, status,
	).Scan(&p.ID, &p.CreatedAt)
}
