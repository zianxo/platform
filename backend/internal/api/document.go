package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/dubai/platform/backend/internal/models"
	"github.com/dubai/platform/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type DocumentHandler struct {
	Service *service.DocumentService
}

func NewDocumentHandler(s *service.DocumentService) *DocumentHandler {
	return &DocumentHandler{Service: s}
}

func (h *DocumentHandler) List(w http.ResponseWriter, r *http.Request) {
	docs, err := h.Service.List(r.Context())
	if err != nil {
		fmt.Printf("DocumentHandler List Error: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if docs == nil {
		docs = []models.Document{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docs)
}

func (h *DocumentHandler) Create(w http.ResponseWriter, r *http.Request) {
	var d models.Document
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Service.Create(r.Context(), &d); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(d)
}

func (h *DocumentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "ID is required", http.StatusBadRequest)
		return
	}

	if err := h.Service.Delete(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *DocumentHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "ID is required", http.StatusBadRequest)
		return
	}

	var input struct {
		FileName   *string `json:"file_name"`
		Status     *string `json:"status"`
		EntityType *string `json:"entity_type"`
		EntityID   *string `json:"entity_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	updateInput := service.DocumentUpdateInput{
		FileName:   input.FileName,
		Status:     input.Status,
		EntityType: input.EntityType,
		EntityID:   input.EntityID,
	}

	if err := h.Service.Update(r.Context(), id, updateInput); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
