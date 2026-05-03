package router

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/km/university-analytics/internal/handlers"
)

func NewRouter(h *handlers.Handler) *mux.Router {
	r := mux.NewRouter()

	// Вебхук от Google Forms
	r.HandleFunc("/api/form-webhook", h.FormWebhook).Methods("POST")

	// Статистика
	r.HandleFunc("/api/stats", h.GetStats).Methods("GET")

	// Рекомендации (POST с answers или direction)
	r.HandleFunc("/api/recommend", h.RecommendHandler).Methods("POST")

	// Рекомендации по session_id (GET)
	r.HandleFunc("/api/recommend/session", h.GetRecommendationsBySession).Methods("GET")

	// Ответы формы (для админки)
	r.HandleFunc("/api/responses", h.GetResponses).Methods("GET")

	// Health check
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods("GET")

	return r
}