package router

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/km/university-analytics/internal/handlers"
)

func NewRouter(h *handlers.Handler) *mux.Router {
	r := mux.NewRouter()

	r.HandleFunc("/api/form-webhook", h.FormWebhook).Methods("POST")
	r.HandleFunc("/api/stats", h.GetStats).Methods("GET")
	r.HandleFunc("/api/recommend", h.RecommendHandler).Methods("POST")

	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods("GET")

	return r
}