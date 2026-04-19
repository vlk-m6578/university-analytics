package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
	"github.com/km/university-analytics/internal/models"
	"github.com/km/university-analytics/pkg/config"
)

type Repository struct {
	db *sql.DB
}

func New(cfg *config.Config) (*Repository, error) {
	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		log.Printf("Warning: database not available: %v", err)
	} else {
		log.Println("Database connected successfully")
	}

	return &Repository{db: db}, nil
}

func (r *Repository) Close() error {
	return r.db.Close()
}

// SaveFormResponse сохраняет ответ из вебхука
func (r *Repository) SaveFormResponse(answers map[string]string, timestamp time.Time) (int, error) {
	jsonData, err := json.Marshal(answers)
	if err != nil {
		return 0, fmt.Errorf("failed to marshal answers: %w", err)
	}

	var id int
	query := `INSERT INTO form_responses (timestamp, raw_data) VALUES ($1, $2) RETURNING id`
	err = r.db.QueryRow(query, timestamp, jsonData).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("failed to insert response: %w", err)
	}

	log.Printf("Saved form response with ID: %d", id)
	return id, nil
}

func (r *Repository) GetAllUniversities() ([]models.University, error) {
	rows, err := r.db.Query(`SELECT id, name, city, country, lat, lon, has_dormitory FROM universities`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var universities []models.University
	for rows.Next() {
		var u models.University
		err := rows.Scan(&u.ID, &u.Name, &u.City, &u.Country, &u.Lat, &u.Lon, &u.HasDormitory)
		if err != nil {
			return nil, err
		}
		universities = append(universities, u)
	}
	return universities, nil
}

// GetSpecialtiesByDirection возвращает специальности по направлению
func (r *Repository) GetSpecialtiesByDirection(direction string) ([]models.Specialty, error) {
	rows, err := r.db.Query(`
		SELECT s.id, s.university_id, s.name, s.pass_score_budget, s.pass_score_paid, s.direction,
		       u.id, u.name, u.city, u.country, u.lat, u.lon, u.has_dormitory
		FROM specialties s
		JOIN universities u ON s.university_id = u.id
		WHERE s.direction = $1 OR $1 = ''`, direction)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var specialties []models.Specialty
	for rows.Next() {
		var s models.Specialty
		var u models.University
		err := rows.Scan(
			&s.ID, &s.UniversityID, &s.Name, &s.PassScoreBudget, &s.PassScorePaid, &s.Direction,
			&u.ID, &u.Name, &u.City, &u.Country, &u.Lat, &u.Lon, &u.HasDormitory,
		)
		if err != nil {
			return nil, err
		}
		s.University = u
		specialties = append(specialties, s)
	}
	return specialties, nil
}

func (r *Repository) SaveUniversity(univ models.University) (int, error) {
	var id int
	query := `INSERT INTO universities (name, city, country, lat, lon, has_dormitory) 
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          RETURNING id`
	err := r.db.QueryRow(query, univ.Name, univ.City, univ.Country, univ.Lat, univ.Lon, univ.HasDormitory).Scan(&id)
	return id, err
}

// GetAllFormResponses возвращает все ответы из формы для статистики
func (r *Repository) GetAllFormResponses() ([]models.FormResponseDB, error) {
    rows, err := r.db.Query(`SELECT id, timestamp, raw_data FROM form_responses ORDER BY id`)
    if err != nil {
        return nil, fmt.Errorf("failed to query form_responses: %w", err)
    }
    defer rows.Close()

    var responses []models.FormResponseDB
    for rows.Next() {
        var resp models.FormResponseDB
        if err := rows.Scan(&resp.ID, &resp.Timestamp, &resp.RawData); err != nil {
            return nil, fmt.Errorf("failed to scan row: %w", err)
        }
        responses = append(responses, resp)
    }

    if err := rows.Err(); err != nil {
        return nil, err
    }

    log.Printf("Retrieved %d form responses from database", len(responses))
    return responses, nil
}
func (r *Repository) GetFormResponsesAsMaps() ([]map[string]string, error) {
	rows, err := r.db.Query(`SELECT raw_data FROM form_responses ORDER BY id`)
	if err != nil {
		return nil, fmt.Errorf("failed to query form_responses: %w", err)
	}
	defer rows.Close()

	var results []map[string]string
	for rows.Next() {
		var rawData []byte
		if err := rows.Scan(&rawData); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		var answers map[string]string
		if err := json.Unmarshal(rawData, &answers); err != nil {
			log.Printf("Warning: failed to unmarshal raw_data: %v", err)
			continue
		}
		results = append(results, answers)
	}

	log.Printf("Retrieved %d form responses", len(results))
	return results, nil
}