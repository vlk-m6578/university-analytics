package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/km/university-analytics/internal/models"
)

func (h *Handler) RecommendHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.RecommendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Если есть answers, определяем направление автоматически
	if req.Answers != nil && len(req.Answers) > 0 {
		recommendations, err := h.Recommender.GetRecommendationsForAnswers(req.Answers, h.Cfg.DeepSeekAPIKey, req)
		if err != nil {
			http.Error(w, "Failed to get recommendations", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"recommendations": recommendations,
		})
		return
	}

	// Если нет answers, используем direction из запроса
	recommendations, err := h.Recommender.GetRecommendationsByDirection(req, req.Direction)
	if err != nil {
		http.Error(w, "Failed to get recommendations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"recommendations": recommendations,
	})
}