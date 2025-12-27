package models

import (
	"time"

	"github.com/google/uuid"
)

type Talent struct {
	ID           uuid.UUID       `json:"id"`
	FirstName    string          `json:"first_name"`
	LastName     string          `json:"last_name"`
	Email        string          `json:"email"`
	LinkedinURL  *string         `json:"linkedin_url"`
	Country      *string         `json:"country"`
	Timezone     *string         `json:"timezone"`
	Role         string          `json:"role"`
	Seniority    *string         `json:"seniority"`
	EnglishLevel *string         `json:"english_level"`
	Source       *string         `json:"source"`
	Notes        *string         `json:"notes"`
	Skills       []string        `json:"skills"`
	Status       *string         `json:"status"`
	History      []StatusHistory `json:"history"`
	CreatedAt    time.Time       `json:"created_at"`
}

type StatusHistory struct {
	Status    string    `json:"status"`
	Notes     string    `json:"notes"`
	ChangedAt time.Time `json:"changed_at"`
}

type Skill struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Category string `json:"category"`
}

type TalentCommercial struct {
	TalentID            uuid.UUID  `json:"talent_id"`
	ExpectedMonthlyRate *float64   `json:"expected_monthly_rate_usd"`
	AvailabilityStatus  *string    `json:"availability_status"`
	AvailableFromDate   *time.Time `json:"available_from_date"`
	PaymentMethod       *string    `json:"payment_method"`
}

type Client struct {
	ID              uuid.UUID `json:"id"`
	CompanyName     string    `json:"company_name"`
	Country         *string   `json:"country"`
	Timezone        *string   `json:"timezone"`
	BillingCurrency *string   `json:"billing_currency"`
	Status          string    `json:"status"`
	Notes           *string   `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
}

type ClientContact struct {
	ID        uuid.UUID `json:"id"`
	ClientID  uuid.UUID `json:"client_id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	IsPrimary bool      `json:"is_primary"`
	CreatedAt time.Time `json:"created_at"`
}

type Contract struct {
	ID           uuid.UUID  `json:"id"`
	ClientID     uuid.UUID  `json:"client_id"`
	TalentID     uuid.UUID  `json:"talent_id"`
	ProjectID    uuid.UUID  `json:"project_id"`
	Type         string     `json:"type"`   // MSA, SOW, NDA
	Status       string     `json:"status"` // DRAFT, SENT, SIGNED
	StartDate    time.Time  `json:"start_date"`
	EndDate      *time.Time `json:"end_date"`
	NoticePeriod int        `json:"notice_period_days"`
	FileURL      *string    `json:"file_url"`
	FileKey      *string    `json:"file_key"`
	SignedAt     *time.Time `json:"signed_at"`
	CreatedAt    time.Time  `json:"created_at"`
}

type Project struct {
	ID                     uuid.UUID     `json:"id"`
	ClientID               uuid.UUID     `json:"client_id"`
	Name                   string        `json:"name"`
	Description            *string       `json:"description"`
	Status                 string        `json:"status"`
	EngagementType         string        `json:"engagement_type"`
	MonthlyBudget          *float64      `json:"monthly_budget"`
	TargetHoursPerWeek     *int          `json:"target_hours_per_week"`
	BillableDaysPerMonth   *int          `json:"billable_days_per_month"`
	ActiveAssignmentsCount int           `json:"active_assignments_count"`
	CurrentWeeklyHours     *float64      `json:"current_weekly_hours"`
	ActualMonthlyRevenue   *float64      `json:"actual_monthly_revenue"`
	ActualMonthlyCost      *float64      `json:"actual_monthly_cost"`
	PlannedMonthlyRevenue  *float64      `json:"planned_monthly_revenue"`
	TeamMembers            []TeamMember  `json:"team_members"`
	PlannedRoles           []PlannedRole `json:"planned_roles"`
	CreatedAt              time.Time     `json:"created_at"`
}

type TeamMember struct {
	ID        uuid.UUID `json:"id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Role      string    `json:"role"`
}

type PlannedRole struct {
	ID        uuid.UUID `json:"id"`
	ProjectID uuid.UUID `json:"project_id"`
	RoleName  string    `json:"role_name"`
	Count     int       `json:"count"`
	BillRate  float64   `json:"bill_rate"`
	CreatedAt time.Time `json:"created_at"`
}

type ProjectAssignment struct {
	ID                    uuid.UUID  `json:"id"`
	ProjectID             uuid.UUID  `json:"project_id"`
	ClientID              uuid.UUID  `json:"client_id"` // Legacy/Redundant but kept for now
	TalentID              uuid.UUID  `json:"talent_id"`
	Role                  string     `json:"role"`
	StartDate             time.Time  `json:"start_date"`
	TrialEndDate          *time.Time `json:"trial_end_date"`
	MonthlyClientRate     *float64   `json:"monthly_client_rate"`
	MonthlyContractorCost float64    `json:"monthly_contractor_cost"`
	DailyPayoutRate       *float64   `json:"daily_payout_rate"`
	DailyBillRate         *float64   `json:"daily_bill_rate"`
	HoursPerWeek          *int       `json:"hours_per_week"`
	Status                string     `json:"status"`
	CreatedAt             time.Time  `json:"created_at"`
}

type Invoice struct {
	ID            uuid.UUID         `json:"id"`
	ClientID      uuid.UUID         `json:"client_id"`
	BillingMonth  string            `json:"billing_month"`
	TotalAmount   float64           `json:"total_amount"`
	Currency      string            `json:"currency"`
	Status        string            `json:"status"`
	XeroInvoiceID *string           `json:"xero_invoice_id"`
	LineItems     []InvoiceLineItem `json:"line_items"`
	CreatedAt     time.Time         `json:"created_at"`
}

type InvoiceLineItem struct {
	ID        uuid.UUID  `json:"id"`
	InvoiceID uuid.UUID  `json:"invoice_id"`
	ProjectID *uuid.UUID `json:"project_id"` // Optional if item isn't project specific? Schema says REFERENCES projects, likely nullable?
	// Schema: project_id UUID REFERENCES projects(id) ON DELETE RESTRICT
	// It is nullable in SQL (default).
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
}

type ContractorPayment struct {
	ID           uuid.UUID `json:"id"`
	TalentID     uuid.UUID `json:"talent_id"`
	ProjectID    uuid.UUID `json:"project_id"`
	BillingMonth string    `json:"billing_month"`
	Amount       float64   `json:"amount"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

type Document struct {
	ID         uuid.UUID `json:"id"`
	EntityType string    `json:"entity_type"`
	EntityID   uuid.UUID `json:"entity_id"`
	FileName   string    `json:"file_name"`
	FileType   string    `json:"file_type"`
	FileSize   int64     `json:"file_size"`
	Status     string    `json:"status"`
	FileURL    string    `json:"file_url"`
	FileKey    string    `json:"file_key"`
	OCRStatus  *string   `json:"ocr_status"`
	Content    *string   `json:"content"`
	UploadedAt time.Time `json:"uploaded_at"`
}
