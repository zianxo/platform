package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/dubai/platform/backend/internal/models"
	"github.com/dubai/platform/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type AuthHandler struct {
	Service *service.AuthService
}

func NewAuthHandler(s *service.AuthService) *AuthHandler {
	return &AuthHandler{Service: s}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	log.Println("DEBUG: Register handler hit")
	roleVal := r.Context().Value("role")
	if roleVal == nil {
		log.Println("ERROR: Role context is nil")
		http.Error(w, "Internal Server Error: Missing Context", http.StatusInternalServerError)
		return
	}
	role := roleVal.(string)
	log.Printf("DEBUG: Register caller role: %s", role)

	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("ERROR: JSON decode failed: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("DEBUG: Register request payload for user: %s (Client: %v)", req.Email, req.ClientID)

	// SECURITY: Access Control
	if role == "ADMIN" {
		// Admin can do anything
	} else if role == "CLIENT_ADMIN" {
		// Client Admin can only create users for their own client
		clientID, ok := r.Context().Value("client_id").(string)
		if !ok || clientID == "" {
			log.Println("ERROR: Client Admin missing client_id context")
			http.Error(w, "Forbidden: No client context", http.StatusForbidden)
			return
		}

		// Enforce client_id match
		if req.ClientID == nil || *req.ClientID != uuid.MustParse(clientID) {
			log.Println("ERROR: Client Admin tried to create user for different client or no client")
			http.Error(w, "Forbidden: Can only create users for your own client", http.StatusForbidden)
			return
		}

		// Enforce allowed roles (Client User or Client Admin)
		if req.Role != models.RoleClientUser && req.Role != models.RoleClientAdmin {
			log.Printf("ERROR: Client Admin tried to assign invalid role: %s", req.Role)
			http.Error(w, "Forbidden: Invalid role assignment", http.StatusForbidden)
			return
		}
	} else {
		log.Printf("ERROR: Access denied for role: %s", role)
		http.Error(w, "Forbidden: Insufficient permissions", http.StatusForbidden)
		return
	}

	user, err := h.Service.Register(r.Context(), req)
	if err != nil {
		log.Printf("ERROR: Service.Register failed: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("DEBUG: Register success for user: %s", user.Email)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp, err := h.Service.Login(r.Context(), req)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by middleware)
	userID := r.Context().Value("user_id").(string)

	user, err := h.Service.GetProfile(r.Context(), userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	var req map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.Service.UpdateProfile(r.Context(), userID, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	requestedClientID := r.URL.Query().Get("client_id")
	log.Printf("DEBUG: ListUsers hit (requested_client_id: %s)", requestedClientID)

	roleVal := r.Context().Value("role")
	if roleVal == nil {
		log.Println("ERROR: Role context is nil")
		http.Error(w, "Internal Server Error: Missing Context", http.StatusInternalServerError)
		return
	}
	role := roleVal.(string)
	log.Printf("DEBUG: ListUsers caller role: %s", role)

	// Default: No access
	targetClientID := ""

	if role == "ADMIN" {
		// Admin can filter by any client or see all (if implemented in service)
		targetClientID = requestedClientID
	} else if role == "CLIENT_ADMIN" || role == "CLIENT_USER" {
		// Client Admin AND Client User can see their own client's users
		ownClientID, ok := r.Context().Value("client_id").(string)
		if !ok || ownClientID == "" {
			log.Printf("ERROR: Client User/Admin (role=%s) missing client_id context. Context Dump: %v", role, r.Context())
			http.Error(w, fmt.Sprintf("Forbidden: User has role %s but no client_id associated. Please contact support.", role), http.StatusForbidden)
			return
		}
		targetClientID = ownClientID
	} else {
		log.Printf("ERROR: Access denied for role: %s. ClientID Context: %v", role, r.Context().Value("client_id"))
		http.Error(w, fmt.Sprintf("Forbidden: Insufficient permissions for role %s", role), http.StatusForbidden)
		return
	}

	users, err := h.Service.ListUsers(r.Context(), targetClientID)
	if err != nil {
		log.Printf("ERROR: Service.ListUsers failed: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("DEBUG: ListUsers returning %d users", len(users))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *AuthHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	targetUserID := r.Context().Value("target_user_id").(string) // from URL param path

	roleVal := r.Context().Value("role")
	if roleVal == nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	role := roleVal.(string)

	var req map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// SECURITY: Access Control
	if role == "ADMIN" {
		// Admin can update anyone
	} else if role == "CLIENT_ADMIN" {
		// Client Admin can only update users of their own client
		// 1. We need to fetch the target user first to check their client_id
		targetUser, err := h.Service.GetProfile(r.Context(), targetUserID)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		ownClientID := r.Context().Value("client_id").(string)

		// Check invalid access
		if targetUser.ClientID == nil || *targetUser.ClientID != uuid.MustParse(ownClientID) {
			http.Error(w, "Forbidden: Can only update your own team members", http.StatusForbidden)
			return
		}

		// Prevent changing their own role to ADMIN or changing others to ADMIN
		if roleUpdate, ok := req["role"].(string); ok {
			if roleUpdate != string(models.RoleClientUser) && roleUpdate != string(models.RoleClientAdmin) {
				http.Error(w, "Forbidden: Invalid role assignment", http.StatusForbidden)
				return
			}
		}

		// Prevent changing client_id
		if _, ok := req["client_id"]; ok {
			http.Error(w, "Forbidden: Cannot move users between clients", http.StatusForbidden)
			return
		}

	} else {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	user, err := h.Service.UpdateProfile(r.Context(), targetUserID, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	targetUserID := chi.URLParam(r, "id")

	// RBAC: Only ADMIN can delete users (for now, or Client Admin for their own users)
	roleVal := r.Context().Value("role")
	if roleVal == nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	role := roleVal.(string)

	if role == "ADMIN" {
		// Admin can delete anyone
	} else if role == "CLIENT_ADMIN" {
		// Client Admin can only delete users of their own client
		ownClientID, ok := r.Context().Value("client_id").(string)
		if !ok || ownClientID == "" {
			http.Error(w, "Forbidden: No client context", http.StatusForbidden)
			return
		}

		targetUser, err := h.Service.GetProfile(r.Context(), targetUserID)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		if targetUser.ClientID == nil || *targetUser.ClientID != uuid.MustParse(ownClientID) {
			http.Error(w, "Forbidden: Can only delete your own team members", http.StatusForbidden)
			return
		}
	} else {
		http.Error(w, "Forbidden: Insufficient permissions", http.StatusForbidden)
		return
	}

	if err := h.Service.DeleteUser(r.Context(), targetUserID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
