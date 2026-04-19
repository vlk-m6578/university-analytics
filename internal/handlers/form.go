package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/km/university-analytics/internal/repository"
)

type Handler struct {
	Repo *repository.Repository
}

func NewHandler(repo *repository.Repository) *Handler {
	return &Handler{Repo: repo}
}

// WebhookPayload структура того, что приходит от Apps Script
type WebhookPayload struct {
	Timestamp string                 `json:"timestamp"`
	RowNumber int                    `json:"rowNumber"`
	Answers   map[string]interface{} `json:"answers"`
}

// FormWebhook принимает POST-запросы от Google Apps Script
func (h *Handler) FormWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload WebhookPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		log.Printf("Failed to decode JSON: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Преобразуем все значения в строки
	answersAsStrings := make(map[string]string)
	for key, value := range payload.Answers {
		answersAsStrings[key] = convertToString(value)
	}

	// Парсим время
	timestamp, err := time.Parse(time.RFC3339, payload.Timestamp)
	if err != nil {
		timestamp = time.Now()
	}

	// Сохраняем в БД
	responseID, err := h.Repo.SaveFormResponse(answersAsStrings, timestamp)
	if err != nil {
		log.Printf("Failed to save to DB: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Printf("Received form response: row %d, saved as ID %d", payload.RowNumber, responseID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// convertToString преобразует любой тип в строку
func convertToString(v interface{}) string {
	if v == nil {
		return ""
	}
	switch val := v.(type) {
	case string:
		return val
	case float64:
		// Если число целое — не добавляем .0
		if val == float64(int64(val)) {
			return strconv.FormatInt(int64(val), 10)
		}
		return strconv.FormatFloat(val, 'f', -1, 64)
	case bool:
		if val {
			return "Да"
		}
		return "Нет"
	case time.Time:
		return val.Format(time.RFC3339)
	default:
		return fmt.Sprintf("%v", val)
	}
}