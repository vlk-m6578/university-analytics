package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/km/university-analytics/internal/handlers"
	"github.com/km/university-analytics/internal/recommender"
	"github.com/km/university-analytics/internal/repository"
	"github.com/km/university-analytics/internal/router"
	"github.com/km/university-analytics/pkg/config"
)

func main() {
	cfg := config.Load()

	repo, err := repository.New(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer repo.Close()

	rec := recommender.NewRecommender(repo)
	h := handlers.NewHandler(repo, rec)

	r := router.NewRouter(h)

	log.Printf("Server starting on port %d", cfg.Port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", cfg.Port), r); err != nil {
		log.Fatal("Server failed:", err)
	}
}