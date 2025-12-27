package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/dubai/platform/backend/internal/db"
	"github.com/dubai/platform/backend/internal/models"
)

type DocumentService struct{}

func NewDocumentService() *DocumentService {
	return &DocumentService{}
}

func (s *DocumentService) List(ctx context.Context, entityType string, entityID string) ([]models.Document, error) {
	query := `
		SELECT id, entity_type, entity_id, file_name, file_type, file_size, status, file_url, file_key, ocr_status, content, uploaded_at 
		FROM documents
		WHERE 1=1
	`
	args := []interface{}{}
	argId := 1

	if entityType != "" {
		query += fmt.Sprintf(" AND entity_type = $%d", argId)
		args = append(args, entityType)
		argId++
	}
	if entityID != "" {
		query += fmt.Sprintf(" AND entity_id = $%d", argId)
		args = append(args, entityID)
		argId++
	}

	query += " ORDER BY uploaded_at DESC"

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		fmt.Printf("DocumentService List Query Error: %v\n", err)
		return nil, err
	}
	defer rows.Close()

	var docs []models.Document
	for rows.Next() {
		var d models.Document
		err := rows.Scan(
			&d.ID, &d.EntityType, &d.EntityID, &d.FileName, &d.FileType, &d.FileSize, &d.Status, &d.FileURL, &d.FileKey, &d.OCRStatus, &d.Content, &d.UploadedAt,
		)
		if err != nil {
			fmt.Printf("DocumentService List Scan Error: %v\n", err)
			return nil, err
		}
		docs = append(docs, d)
	}
	return docs, nil
}

func (s *DocumentService) Create(ctx context.Context, d *models.Document) error {
	if d.Status == "" {
		d.Status = "DRAFT"
	}
	ocrStatus := "PENDING"
	d.OCRStatus = &ocrStatus

	query := `
		INSERT INTO documents (entity_type, entity_id, file_name, file_type, file_size, status, file_url, file_key, ocr_status, content)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, uploaded_at
	`
	err := db.Pool.QueryRow(ctx, query,
		d.EntityType, d.EntityID, d.FileName, d.FileType, d.FileSize, d.Status, d.FileURL, d.FileKey, d.OCRStatus, d.Content,
	).Scan(&d.ID, &d.UploadedAt)

	if err == nil {
		// Trigger Async OCR
		// go func(docID string, fileURL string, fileName string) {
		// 	// Basic retry logic could be added here
		// 	if err := processOCR(docID, fileURL, fileName); err != nil {
		// 		fmt.Printf("OCR Processing Failed for %s: %v\n", docID, err)
		// 		// Update status to FAILED
		// 		db.Pool.Exec(context.Background(), "UPDATE documents SET ocr_status = 'FAILED' WHERE id = $1", docID)
		// 	}
		// }(d.ID.String(), d.FileURL, d.FileName)
	}

	return err
}

func (s *DocumentService) Delete(ctx context.Context, id string) error {
	// 1. Get file_key
	var fileKey string
	query := `SELECT file_key FROM documents WHERE id = $1`
	err := db.Pool.QueryRow(ctx, query, id).Scan(&fileKey)
	if err != nil {
		return err
	}

	// 2. Delete from Uploadthing
	if fileKey != "" {
		if err := DeleteFromUploadthing(fileKey); err != nil {
			// Log error but continue to delete from DB to keep it clean
			fmt.Printf("Warning: Failed to delete from Uploadthing: %v\n", err)
		}
	}

	// 3. Delete from DB
	query = `DELETE FROM documents WHERE id = $1`
	_, err = db.Pool.Exec(ctx, query, id)
	return err
}

type DocumentUpdateInput struct {
	FileName   *string
	Status     *string
	EntityType *string
	EntityID   *string
}

func (s *DocumentService) Update(ctx context.Context, id string, input DocumentUpdateInput) error {
	// Build dynamic query
	query := "UPDATE documents SET "
	args := []interface{}{}
	argId := 1

	if input.FileName != nil {
		query += fmt.Sprintf("file_name = $%d, ", argId)
		args = append(args, *input.FileName)
		argId++
	}
	if input.Status != nil {
		query += fmt.Sprintf("status = $%d, ", argId)
		args = append(args, *input.Status)
		argId++
	}
	if input.EntityType != nil {
		query += fmt.Sprintf("entity_type = $%d, ", argId)
		args = append(args, *input.EntityType)
		argId++
	}
	if input.EntityID != nil {
		query += fmt.Sprintf("entity_id = $%d, ", argId)
		args = append(args, *input.EntityID)
		argId++
	}

	// Remove trailing comma and space
	if len(args) == 0 {
		return nil // No updates
	}
	query = query[:len(query)-2]

	query += fmt.Sprintf(" WHERE id = $%d", argId)
	args = append(args, id)

	_, err := db.Pool.Exec(ctx, query, args...)
	return err
}

func processOCR(docID string, fileURL string, fileName string) error {
	fmt.Printf("Starting OCR for document %s (%s)\n", docID, fileName)

	// 1. Download file
	resp, err := http.Get(fileURL)
	if err != nil {
		return fmt.Errorf("failed to download file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status code downloading file: %d", resp.StatusCode)
	}

	// 2. Prepare multipart request to OCR service
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", fileName)
	if err != nil {
		return fmt.Errorf("failed to create form file: %w", err)
	}

	_, err = io.Copy(part, resp.Body)
	if err != nil {
		return fmt.Errorf("failed to copy file content: %w", err)
	}
	writer.Close()

	// 3. Send to OCR service
	ocrURL := "http://localhost:8000/ocr" // Assuming running locally or reachable
	// In Docker, you might need "http://ocr-service:8000/ocr"

	req, err := http.NewRequest("POST", ocrURL, body)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 300 * time.Second} // Long timeout for OCR (PDFs can take time)
	ocrResp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request to OCR service: %w", err)
	}
	defer ocrResp.Body.Close()

	if ocrResp.StatusCode != http.StatusOK {
		return fmt.Errorf("OCR service returned bad status: %d", ocrResp.StatusCode)
	}

	// 4. Parse Response
	var result struct {
		Markdown       string  `json:"markdown"`
		ProcessingTime float64 `json:"processing_time"`
	}
	if err := json.NewDecoder(ocrResp.Body).Decode(&result); err != nil {
		return fmt.Errorf("failed to decode OCR response: %w", err)
	}

	fmt.Printf("OCR Completed in %.2fs. Saving results...\n", result.ProcessingTime)

	// 5. Update DB
	_, err = db.Pool.Exec(context.Background(),
		"UPDATE documents SET ocr_status = 'COMPLETED', content = $1 WHERE id = $2",
		result.Markdown, docID)

	return err
}
