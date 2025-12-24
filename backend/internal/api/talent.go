package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/dubai/platform/backend/internal/models"
	"github.com/dubai/platform/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type TalentHandler struct {
	Service *service.TalentService
}

func NewTalentHandler(s *service.TalentService) *TalentHandler {
	return &TalentHandler{Service: s}
}

func (h *TalentHandler) List(w http.ResponseWriter, r *http.Request) {
	talents, err := h.Service.ListTalent(r.Context())
	if err != nil {
		log.Printf("TalentHandler List Error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if talents == nil {
		talents = []models.Talent{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(talents)
}

func (h *TalentHandler) Create(w http.ResponseWriter, r *http.Request) {
	var t models.Talent
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Service.Create(r.Context(), &t); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(t)
}

func (h *TalentHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	t, err := h.Service.Get(r.Context(), id)
	if err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(t)
}
func (h *TalentHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	var t models.Talent
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Service.Update(r.Context(), id, &t); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(t)
}
