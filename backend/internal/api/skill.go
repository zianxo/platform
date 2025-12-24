package api

import (
	"encoding/json"
	"net/http"

	"github.com/dubai/platform/backend/internal/models"
	"github.com/dubai/platform/backend/internal/service"
)

type SkillHandler struct {
	Service *service.SkillService
}

func NewSkillHandler(s *service.SkillService) *SkillHandler {
	return &SkillHandler{Service: s}
}

func (h *SkillHandler) List(w http.ResponseWriter, r *http.Request) {
	skills, err := h.Service.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if skills == nil {
		skills = []models.Skill{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(skills)
}

func (h *SkillHandler) Create(w http.ResponseWriter, r *http.Request) {
	var sk models.Skill
	if err := json.NewDecoder(r.Body).Decode(&sk); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := h.Service.Create(r.Context(), &sk); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(sk)
}

func (h *SkillHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}
	if err := h.Service.Delete(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *SkillHandler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	var body struct {
		OldName string `json:"oldName"`
		NewName string `json:"newName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := h.Service.UpdateCategory(r.Context(), body.OldName, body.NewName); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
