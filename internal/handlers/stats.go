package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/km/university-analytics/internal/statistics"
)

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	responses, err := h.Repo.GetFormResponsesAsMaps()
	if err != nil {
		log.Printf("Error reading responses: %v", err)
		http.Error(w, "Failed to get data", http.StatusInternalServerError)
		return
	}

	if len(responses) == 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "no data yet"})
		return
	}

	fullStats := statistics.CalculateAll(responses)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fullStats)
}