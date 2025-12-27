package models

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleAdmin       UserRole = "ADMIN"
	RoleHR          UserRole = "HR"
	RoleSales       UserRole = "SALES"
	RoleFinance     UserRole = "FINANCE"
	RoleClientAdmin UserRole = "CLIENT_ADMIN"
	RoleClientUser  UserRole = "CLIENT_USER"
)

type User struct {
	ID           uuid.UUID  `json:"id"`
	Username     *string    `json:"username"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"` // Never return password hash
	Role         string     `json:"role"`
	CompanyName  *string    `json:"company_name"`
	ClientID     *uuid.UUID `json:"client_id"`
	CreatedAt    time.Time  `json:"created_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type RegisterRequest struct {
	Username string     `json:"username"`
	Email    string     `json:"email"`
	Password string     `json:"password"`
	Role     UserRole   `json:"role"`
	ClientID *uuid.UUID `json:"client_id"`
}
