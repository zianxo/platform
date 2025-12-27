package service

import (
	"context"

	"github.com/dubai/platform/backend/internal/db"
	"github.com/dubai/platform/backend/internal/models"
)

type ClientService struct{}

func NewClientService() *ClientService {
	return &ClientService{}
}

func (s *ClientService) List(ctx context.Context) ([]models.Client, error) {
	query := `SELECT id, company_name, country, timezone, billing_currency, status::text, notes, created_at FROM clients`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clients []models.Client
	for rows.Next() {
		var c models.Client
		err := rows.Scan(
			&c.ID, &c.CompanyName, &c.Country, &c.Timezone, &c.BillingCurrency, &c.Status, &c.Notes, &c.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		clients = append(clients, c)
	}
	return clients, nil
}

func (s *ClientService) Create(ctx context.Context, c *models.Client) error {
	query := `
		INSERT INTO clients (company_name, country, timezone, billing_currency, status, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	return db.Pool.QueryRow(ctx, query,
		c.CompanyName, c.Country, c.Timezone, c.BillingCurrency, c.Status, c.Notes,
	).Scan(&c.ID, &c.CreatedAt)
}

func (s *ClientService) Update(ctx context.Context, id string, c *models.Client) error {
	query := `
		UPDATE clients 
		SET company_name = $1, country = $2, timezone = $3, billing_currency = $4, status = $5, notes = $6
		WHERE id = $7
		RETURNING created_at
	`
	return db.Pool.QueryRow(ctx, query,
		c.CompanyName, c.Country, c.Timezone, c.BillingCurrency, c.Status, c.Notes, id,
	).Scan(&c.CreatedAt)
}

func (s *ClientService) AddContact(ctx context.Context, c *models.ClientContact) error {
	query := `
		INSERT INTO client_contacts (client_id, first_name, last_name, email, role, is_primary)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	return db.Pool.QueryRow(ctx, query,
		c.ClientID, c.FirstName, c.LastName, c.Email, c.Role, c.IsPrimary,
	).Scan(&c.ID, &c.CreatedAt)
}

func (s *ClientService) ListContacts(ctx context.Context, clientID string) ([]models.ClientContact, error) {
	query := `SELECT id, client_id, first_name, last_name, email, role, is_primary, created_at FROM client_contacts WHERE client_id = $1`
	rows, err := db.Pool.Query(ctx, query, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contacts []models.ClientContact
	for rows.Next() {
		var c models.ClientContact
		err := rows.Scan(&c.ID, &c.ClientID, &c.FirstName, &c.LastName, &c.Email, &c.Role, &c.IsPrimary, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		contacts = append(contacts, c)
	}
	return contacts, nil
}
func (s *ClientService) UpdateContact(ctx context.Context, id string, c *models.ClientContact) error {
	query := `
		UPDATE client_contacts 
		SET first_name = $1, last_name = $2, email = $3, role = $4, is_primary = $5
		WHERE id = $6
		RETURNING created_at
	`
	return db.Pool.QueryRow(ctx, query,
		c.FirstName, c.LastName, c.Email, c.Role, c.IsPrimary, id,
	).Scan(&c.CreatedAt)
}

func (s *ClientService) DeleteContact(ctx context.Context, id string) error {
	query := `DELETE FROM client_contacts WHERE id = $1`
	_, err := db.Pool.Exec(ctx, query, id)
	return err
}

func (s *ClientService) Archive(ctx context.Context, id string) error {
	query := `UPDATE clients SET status = 'ARCHIVED' WHERE id = $1`
	_, err := db.Pool.Exec(ctx, query, id)
	return err
}
