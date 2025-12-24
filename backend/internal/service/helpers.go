package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// DeleteFromUploadthing removes a file from Uploadthing using its file key.
func DeleteFromUploadthing(fileKey string) error {
	apiKey := os.Getenv("UPLOADTHING_SECRET")
	if apiKey == "" {
		return fmt.Errorf("UPLOADTHING_SECRET not set")
	}

	url := "https://api.uploadthing.com/v6/deleteFiles"
	payload := map[string][]string{
		"fileKeys": {fileKey},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Uploadthing-Api-Key", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("uploadthing deletion failed with status: %d", resp.StatusCode)
	}

	return nil
}
