package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/km/university-analytics/internal/handlers"
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

	h := handlers.NewHandler(repo)

	r := router.NewRouter(h)

	// временная проверка
	responses, err := repo.GetFormResponsesAsMaps()
	if err != nil {
		log.Printf("Error reading responses: %v", err)
	} else {
		log.Printf("Total responses in DB: %d", len(responses))
		if len(responses) > 0 {
			log.Printf("Sample response: %+v", responses[0])
		}
	}

	log.Printf("Server starting on port %d", cfg.Port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", cfg.Port), r); err != nil {
		log.Fatal("Server failed:", err)
	}
}