package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/dubai/platform/backend/internal/api"
	"github.com/dubai/platform/backend/internal/db"
	appMiddleware "github.com/dubai/platform/backend/internal/middleware"
	"github.com/dubai/platform/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	_ = godotenv.Load()

	// Connect to Database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	if err := db.Connect(dbURL); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Init Schema
	ctx := context.Background()
	if err := db.InitSchema(ctx); err != nil {
		log.Fatalf("Failed to initialize schema: %v", err)
	}

	// Setup Router
	r := chi.NewRouter()

	// Middleware
	// Middleware
	allowedOrigins := []string{"http://localhost:3000", "http://localhost:3001"}
	if envOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); envOrigins != "" {
		importOrigins := strings.Split(envOrigins, ",")
		allowedOrigins = append(allowedOrigins, importOrigins...)
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// SERVICES & HANDLERS

	// Auth
	authService := service.NewAuthService()
	authHandler := api.NewAuthHandler(authService)
	// r.Post("/api/auth/register", authHandler.Register) // MOVED TO PROTECTED /api/users
	r.Post("/api/auth/login", authHandler.Login)

	// Protected Routes
	r.Group(func(r chi.Router) {
		r.Use(appMiddleware.AuthMiddleware)

		// Auth (Profile)
		r.Get("/api/auth/me", authHandler.GetProfile)
		r.Put("/api/auth/me", authHandler.UpdateProfile)

		// USERS (Admin Only - Enforced in Handler)
		// USERS (Admin Only - Enforced in Handler)
		r.Route("/api/users", func(r chi.Router) {
			r.Post("/", authHandler.Register)
			r.Get("/", authHandler.ListUsers)

			r.Route("/{id}", func(r chi.Router) {
				r.Put("/", func(w http.ResponseWriter, r *http.Request) {
					// Extract ID from URL
					id := chi.URLParam(r, "id")
					ctx := context.WithValue(r.Context(), "target_user_id", id)
					authHandler.UpdateUser(w, r.WithContext(ctx))
				})
				r.Delete("/", authHandler.DeleteUser)
			})
		})

		// Talent
		talentService := service.NewTalentService()
		talentHandler := api.NewTalentHandler(talentService)
		r.Route("/api/talent", func(r chi.Router) {
			r.Get("/", talentHandler.List)
			r.Get("/{id}", talentHandler.Get)
			r.Post("/", talentHandler.Create)
			r.Put("/{id}", talentHandler.Update)
		})

		// Clients
		clientService := service.NewClientService()
		clientHandler := api.NewClientHandler(clientService)
		r.Route("/api/clients", func(r chi.Router) {
			r.Get("/", clientHandler.List)
			r.Post("/", clientHandler.Create)
			r.Put("/{id}", clientHandler.Update)
			r.Put("/{id}/archive", clientHandler.Archive)
			r.Get("/{id}/contacts", clientHandler.ListContacts)
			r.Post("/{id}/contacts", clientHandler.CreateContact)
			r.Put("/{id}/contacts/{contactId}", clientHandler.UpdateContact)
			r.Delete("/{id}/contacts/{contactId}", clientHandler.DeleteContact)
		})

		// Projects
		projectService := service.NewProjectService()
		projectHandler := api.NewProjectHandler(projectService)

		assignmentService := service.NewAssignmentService()
		assignmentHandler := api.NewAssignmentHandler(assignmentService)

		r.Route("/api/projects", func(r chi.Router) {
			r.Get("/", projectHandler.List)
			r.Get("/{id}", projectHandler.Get)
			r.Post("/", projectHandler.Create)
			r.Put("/{id}", projectHandler.Update)
			r.Delete("/{id}", projectHandler.Delete)
			r.Route("/{id}/assignments", func(r chi.Router) {
				r.Get("/", assignmentHandler.ListByProject)
				r.Post("/", assignmentHandler.Create)
			})
		})

		r.Route("/api/assignments", func(r chi.Router) {
			r.Get("/", assignmentHandler.List)
			r.Post("/", assignmentHandler.Create)
			r.Get("/{id}", assignmentHandler.Get)
			r.Put("/{id}", assignmentHandler.Update)
			r.Delete("/{id}", assignmentHandler.Delete)
		})

		// Invoices
		invoiceService := service.NewInvoiceService()
		invoiceHandler := api.NewInvoiceHandler(invoiceService)
		r.Route("/api/invoices", func(r chi.Router) {
			r.Get("/", invoiceHandler.List)
			r.Post("/", invoiceHandler.Create)
		})

		// Contracts
		contractService := service.NewContractService()
		contractHandler := api.NewContractHandler(contractService)
		r.Route("/api/contracts", func(r chi.Router) {
			r.Get("/", contractHandler.List)
			r.Post("/", contractHandler.Create)
			r.Delete("/{id}", contractHandler.Delete)
		})

		// Skills
		skillService := service.NewSkillService()
		skillHandler := api.NewSkillHandler(skillService)
		r.Route("/api/skills", func(r chi.Router) {
			r.Get("/", skillHandler.List)
			r.Post("/", skillHandler.Create)
			r.Delete("/", skillHandler.Delete)
			r.Put("/category", skillHandler.UpdateCategory)
		})

		// Payments
		paymentService := service.NewPaymentService()
		paymentHandler := api.NewPaymentHandler(paymentService)
		r.Route("/api/payments", func(r chi.Router) {
			r.Get("/", paymentHandler.List)
			r.Post("/", paymentHandler.Create)
		})

		// Documents
		documentService := service.NewDocumentService()
		documentHandler := api.NewDocumentHandler(documentService)
		r.Route("/api/documents", func(r chi.Router) {
			r.Get("/", documentHandler.List)
			r.Post("/", documentHandler.Create)
			r.Delete("/{id}", documentHandler.Delete)
			r.Put("/{id}", documentHandler.Update)
		})

		// Finance
		financeService := service.NewFinanceService()
		financeHandler := api.NewFinanceHandler(financeService)
		r.Route("/api/finance", func(r chi.Router) {
			r.Get("/capital", financeHandler.ListCapital)
			r.Post("/capital", financeHandler.CreateCapital)
			r.Get("/budgets", financeHandler.ListBudgets)
			r.Post("/budgets", financeHandler.CreateBudget)
			r.Get("/expenses", financeHandler.ListExpenses)
			r.Post("/expenses", financeHandler.CreateExpense)
			r.Get("/investments", financeHandler.ListInvestments)
			r.Post("/investments", financeHandler.CreateInvestment)
		})
	})

	// Server config
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// Graceful shutdown
	go func() {
		log.Printf("Starting server on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}
