package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/dubai/platform/backend/internal/db"
	"github.com/dubai/platform/backend/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// JWT Secret Key - In production, this should be an env var
var jwtKey = []byte("super-secret-jwt-key")

type AuthService struct{}

func NewAuthService() *AuthService {
	return &AuthService{}
}

func (s *AuthService) Register(ctx context.Context, req models.RegisterRequest) (*models.User, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Username:     &req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         string(req.Role),
	}

	query := `
		INSERT INTO users (username, email, password_hash, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`
	err = db.Pool.QueryRow(ctx, query, user.Username, user.Email, user.PasswordHash, user.Role).Scan(&user.ID, &user.CreatedAt)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.LoginResponse, error) {
	query := `SELECT id, username, email, password_hash, role::text, company_name, created_at FROM users WHERE username = $1`
	// Middleware
	var user models.User
	err := db.Pool.QueryRow(ctx, query, req.Username).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.Role, &user.CompanyName, &user.CreatedAt,
	)
	if err != nil {
		log.Printf("Login DB Scan Error for %s: %v", req.Username, err)
		return nil, errors.New("invalid credentials")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		log.Printf("Login Password Error for %s: %v", req.Username, err)
		return nil, errors.New("invalid credentials")
	}

	// Generate JWT
	tokenString, err := GenerateJWT(&user)
	if err != nil {
		return nil, err
	}

	return &models.LoginResponse{
		Token: tokenString,
		User:  user,
	}, nil
}

func (s *AuthService) GetProfile(ctx context.Context, userID string) (*models.User, error) {
	query := `SELECT id, username, email, role, company_name, created_at FROM users WHERE id = $1`
	var user models.User
	err := db.Pool.QueryRow(ctx, query, userID).Scan(
		&user.ID, &user.Username, &user.Email, &user.Role, &user.CompanyName, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthService) UpdateProfile(ctx context.Context, userID string, updatePayload map[string]interface{}) (*models.User, error) {
	// Build dynamic query
	query := "UPDATE users SET "
	var args []interface{}
	argID := 1

	if val, ok := updatePayload["company_name"].(string); ok {
		query += fmt.Sprintf("company_name = $%d, ", argID)
		args = append(args, val)
		argID++
	}

	if val, ok := updatePayload["email"].(string); ok && val != "" {
		query += fmt.Sprintf("email = $%d, ", argID)
		args = append(args, val)
		argID++
	}

	// Also allow updating username? (Not requested but good practice)
	if val, ok := updatePayload["username"].(string); ok && val != "" {
		query += fmt.Sprintf("username = $%d, ", argID)
		args = append(args, val)
		argID++
	}

	if val, ok := updatePayload["password"].(string); ok && val != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(val), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		query += fmt.Sprintf("password_hash = $%d, ", argID)
		args = append(args, string(hashedPassword))
		argID++
	}

	// Remove trailing comma and space
	query = strings.TrimSuffix(query, ", ")
	query += fmt.Sprintf(" WHERE id = $%d RETURNING id, username, email, role, company_name, created_at", argID)
	args = append(args, userID)

	var user models.User
	err := db.Pool.QueryRow(ctx, query, args...).Scan(
		&user.ID, &user.Username, &user.Email, &user.Role, &user.CompanyName, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GenerateJWT(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}
