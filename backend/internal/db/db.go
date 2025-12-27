package db

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func Connect(databaseURL string) error {
	var err error
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return fmt.Errorf("unable to parse database config: %w", err)
	}

	// Set reasonable defaults
	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour

	Pool, err = pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := Pool.Ping(ctx); err != nil {
		return fmt.Errorf("unable to ping database: %w", err)
	}

	return nil
}

func Close() {
	if Pool != nil {
		Pool.Close()
	}
}

func InitSchema(ctx context.Context) error {
	schemaSQL, err := os.ReadFile("internal/db/schema.sql")
	if err != nil {
		return fmt.Errorf("failed to read schema file: %w", err)
	}

	_, err = Pool.Exec(ctx, string(schemaSQL))
	if err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	// Ensure default admin user exists
	defaultUserSQL := `
		INSERT INTO users (email, username, password_hash, role)
		VALUES ('admin@example.com', 'admin', '$2a$10$bpHeIIQnJ93ra8L2h.3L3OSH4BrfK7EclDdS.t.qjDMean/uY/rWK', 'ADMIN')
		ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', username = 'admin', password_hash = '$2a$10$bpHeIIQnJ93ra8L2h.3L3OSH4BrfK7EclDdS.t.qjDMean/uY/rWK';
	`
	_, err = Pool.Exec(ctx, defaultUserSQL)
	if err != nil {
		return fmt.Errorf("failed to create default user: %w", err)
	}

	return nil
}
