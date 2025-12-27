package api

import (
	"encoding/json"
	"net/http"

	"github.com/dubai/platform/backend/internal/models"
	"github.com/dubai/platform/backend/internal/service"
)

type FinanceHandler struct {
	Service *service.FinanceService
}

func NewFinanceHandler(s *service.FinanceService) *FinanceHandler {
	return &FinanceHandler{Service: s}
}

// Capital
func (h *FinanceHandler) ListCapital(w http.ResponseWriter, r *http.Request) {
	caps, err := h.Service.ListCapital(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(caps)
}

func (h *FinanceHandler) CreateCapital(w http.ResponseWriter, r *http.Request) {
	var c models.Capital
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	created, err := h.Service.CreateCapital(r.Context(), c)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(created)
}

// Budgets
func (h *FinanceHandler) ListBudgets(w http.ResponseWriter, r *http.Request) {
	budgets, err := h.Service.ListBudgets(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(budgets)
}

func (h *FinanceHandler) CreateBudget(w http.ResponseWriter, r *http.Request) {
	var b models.Budget
	if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	created, err := h.Service.CreateBudget(r.Context(), b)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(created)
}

// Expenses
func (h *FinanceHandler) ListExpenses(w http.ResponseWriter, r *http.Request) {
	expenses, err := h.Service.ListExpenses(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(expenses)
}

func (h *FinanceHandler) CreateExpense(w http.ResponseWriter, r *http.Request) {
	var e models.Expense
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	created, err := h.Service.CreateExpense(r.Context(), e)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(created)
}

// Investments
func (h *FinanceHandler) ListInvestments(w http.ResponseWriter, r *http.Request) {
	invs, err := h.Service.ListInvestments(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(invs)
}

func (h *FinanceHandler) CreateInvestment(w http.ResponseWriter, r *http.Request) {
	var i models.Investment
	if err := json.NewDecoder(r.Body).Decode(&i); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	created, err := h.Service.CreateInvestment(r.Context(), i)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(created)
}
