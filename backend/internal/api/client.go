package api

import (
	"encoding/json"
	"net/http"

	"github.com/dubai/platform/backend/internal/models"
	"github.com/dubai/platform/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ClientHandler struct {
	Service *service.ClientService
}

func NewClientHandler(s *service.ClientService) *ClientHandler {
	return &ClientHandler{Service: s}
}

func (h *ClientHandler) List(w http.ResponseWriter, r *http.Request) {
	clients, err := h.Service.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if clients == nil {
		clients = []models.Client{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(clients)
}

func (h *ClientHandler) Create(w http.ResponseWriter, r *http.Request) {
	var c models.Client
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Service.Create(r.Context(), &c); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

func (h *ClientHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	var c models.Client
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Service.Update(r.Context(), id, &c); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(c)
}

func (h *ClientHandler) ListContacts(w http.ResponseWriter, r *http.Request) {
	clientID := chi.URLParam(r, "id")
	contacts, err := h.Service.ListContacts(r.Context(), clientID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if contacts == nil {
		contacts = []models.ClientContact{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(contacts)
}

func (h *ClientHandler) CreateContact(w http.ResponseWriter, r *http.Request) {
	clientID := chi.URLParam(r, "id")
	// Parse UUID to ensure validity and assigning to struct
	cid, err := uuid.Parse(clientID)
	if err != nil {
		http.Error(w, "Invalid Client ID", http.StatusBadRequest)
		return
	}

	var c models.ClientContact
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	c.ClientID = cid // Force assignment from URL

	if err := h.Service.AddContact(r.Context(), &c); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}
func (h *ClientHandler) UpdateContact(w http.ResponseWriter, r *http.Request) {
	contactID := chi.URLParam(r, "contactId")
	if contactID == "" {
		http.Error(w, "Missing Contact ID", http.StatusBadRequest)
		return
	}

	var c models.ClientContact
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Service.UpdateContact(r.Context(), contactID, &c); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(c)
}

func (h *ClientHandler) DeleteContact(w http.ResponseWriter, r *http.Request) {
	contactID := chi.URLParam(r, "contactId")
	if contactID == "" {
		http.Error(w, "Missing Contact ID", http.StatusBadRequest)
		return
	}

	if err := h.Service.DeleteContact(r.Context(), contactID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ClientHandler) Archive(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Missing Client ID", http.StatusBadRequest)
		return
	}

	if err := h.Service.Archive(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
