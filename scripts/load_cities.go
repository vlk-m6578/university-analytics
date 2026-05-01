package main

import (
	"bufio"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/km/university-analytics/internal/repository"
	"github.com/km/university-analytics/pkg/config"
)

func main() {
	cfg := config.Load()
	repo, err := repository.New(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer repo.Close()

	file, err := os.Open("BY.txt")
	if err != nil {
		log.Fatal("Failed to open BY.txt:", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var count int

	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Split(line, "\t")
		if len(parts) < 8 {
			continue
		}

		featureCode := parts[7]
		lat, err := strconv.ParseFloat(parts[4], 64)
		if err != nil {
			continue
		}
		lon, err := strconv.ParseFloat(parts[5], 64)
		if err != nil {
			continue
		}
		name := parts[2]
		if name == "" {
			continue
		}

		// PPLC - столица, PPLA - областные центры, PPLA2 - районные центры, PPL - города
		if featureCode == "PPLC" || featureCode == "PPLA" || featureCode == "PPLA2" || featureCode == "PPL" {
			err = repo.SaveCity(name, lat, lon)
			if err != nil {
				log.Printf("Failed to save city %s: %v", name, err)
				continue
			}
			count++
			if count%100 == 0 {
				log.Printf("Loaded %d cities...", count)
			}
		}
	}

	log.Printf("Loaded %d cities successfully", count)
}