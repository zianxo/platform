package service

import (
	"context"

	"github.com/dubai/platform/backend/internal/db"
	"github.com/dubai/platform/backend/internal/models"
)

type InvoiceService struct{}

func NewInvoiceService() *InvoiceService {
	return &InvoiceService{}
}

func (s *InvoiceService) List(ctx context.Context) ([]models.Invoice, error) {
	query := `SELECT id, client_id, billing_month, total_amount, currency, status::text, xero_invoice_id, created_at FROM invoices`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invoices []models.Invoice
	for rows.Next() {
		var i models.Invoice
		err := rows.Scan(
			&i.ID, &i.ClientID, &i.BillingMonth, &i.TotalAmount, &i.Currency, &i.Status, &i.XeroInvoiceID, &i.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		invoices = append(invoices, i)
	}
	// MVP: Not fetching line items in list for performance/simplicity
	// Could implement Get method for details
	return invoices, nil
}

func (s *InvoiceService) Create(ctx context.Context, i *models.Invoice) error {
	// Start transaction
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO invoices (client_id, billing_month, total_amount, currency, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	// defaults
	if i.Status == "" {
		i.Status = "DRAFT"
	}

	err = tx.QueryRow(ctx, query,
		i.ClientID, i.BillingMonth, i.TotalAmount, i.Currency, i.Status,
	).Scan(&i.ID, &i.CreatedAt)
	if err != nil {
		return err
	}

	// Insert line items
	for idx := range i.LineItems {
		item := &i.LineItems[idx]
		itemQuery := `
			INSERT INTO invoice_line_items (invoice_id, project_id, description, amount)
			VALUES ($1, $2, $3, $4)
            RETURNING id
		`
		// Ensure invoice_id is set
		item.InvoiceID = i.ID
		// Use QueryRow to get ID
		err = tx.QueryRow(ctx, itemQuery, item.InvoiceID, item.ProjectID, item.Description, item.Amount).Scan(&item.ID)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
