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
	roleVal := r.Context().Value("role")
	role := ""
	if roleVal != nil {
		role = roleVal.(string)
	}

	entityType := r.URL.Query().Get("entity_type")
	entityID := r.URL.Query().Get("entity_id")

	// RBAC
	if role == "CLIENT_ADMIN" || role == "CLIENT_USER" {
		ownClientID, ok := r.Context().Value("client_id").(string)
		if !ok || ownClientID == "" {
			http.Error(w, "Forbidden: No client context", http.StatusForbidden)
			return
		}
		// Force filter to their client
		// Note: Clients might also need to see Project documents related to them?
		// For now, strict: entity_type='client' AND entity_id=ownClientID
		// OR we could allow them to see documents if we implemented complex logic.
		// Let's start with strict Client Documents.
		// TODO: Expand to "Projects belonging to this client"

		// Actually, if we want them to see project docs, we'd need more logic.
		// For this specific 'Documents' page request, let's assume Client Documents.
		// DB stores as CLIENT (uppercase) based on inspection
		entityType = "CLIENT"
		entityID = ownClientID
	}

	docs, err := h.Service.List(r.Context(), entityType, entityID)
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
