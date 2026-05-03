package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"
	"strings"

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

// SaveFormResponse сохраняет ответ из вебхука и возвращает ID
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

    // Генерируем session_id
    sessionID := fmt.Sprintf("session_%d_%d", id, time.Now().Unix())
    
    // Обновляем запись с session_id
    updateQuery := `UPDATE form_responses SET session_id = $1 WHERE id = $2`
    _, err = r.db.Exec(updateQuery, sessionID, id)
    if err != nil {
        log.Printf("Warning: failed to update session_id: %v", err)
    }

    log.Printf("Saved form response with ID: %d, SessionID: %s", id, sessionID)
    return id, nil
}

// GetSessionIDByResponseID возвращает session_id по id ответа
func (r *Repository) GetSessionIDByResponseID(responseID int) (string, error) {
    var sessionID string
    query := `SELECT session_id FROM form_responses WHERE id = $1`
    err := r.db.QueryRow(query, responseID).Scan(&sessionID)
    if err != nil {
        return "", err
    }
    return sessionID, nil
}

// GetFormResponsesBySessionID получает ответы по session_id
func (r *Repository) GetFormResponsesBySessionID(sessionID string) (map[string]string, error) {
    var rawData []byte
    query := `SELECT raw_data FROM form_responses WHERE session_id = $1`
    err := r.db.QueryRow(query, sessionID).Scan(&rawData)
    if err != nil {
        return nil, err
    }
    
    var answers map[string]string
    if err := json.Unmarshal(rawData, &answers); err != nil {
        return nil, err
    }
    return answers, nil
}

func (r *Repository) GetAllUniversities() ([]models.University, error) {
	rows, err := r.db.Query(`SELECT id, name, city, lat, lon, has_dormitory FROM universities`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var universities []models.University
	for rows.Next() {
		var u models.University
		err := rows.Scan(&u.ID, &u.Name, &u.City, &u.Lat, &u.Lon, &u.HasDormitory)
		if err != nil {
			return nil, err
		}
		universities = append(universities, u)
	}
	return universities, nil
}

func (r *Repository) GetSpecialtiesByDirection(direction string) ([]models.Specialty, error) {
    rows, err := r.db.Query(`
        SELECT s.id, s.university_id, s.name, s.pass_score_budget, s.pass_score_paid, s.direction,
               u.id, u.name, u.city, u.lat, u.lon, u.has_dormitory
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
            &u.ID, &u.Name, &u.City, &u.Lat, &u.Lon, &u.HasDormitory,
        )
        if err != nil {
            return nil, err
        }
        s.University = u
        specialties = append(specialties, s)
    }
    return specialties, nil
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

// GetCityCoordinates возвращает координаты города по названию
func (r *Repository) GetCityCoordinates(cityName string) (float64, float64, error) {
    var lat, lon float64
    query := `SELECT lat, lon FROM cities WHERE name = $1`
    err := r.db.QueryRow(query, cityName).Scan(&lat, &lon)
    if err != nil {
        return 0, 0, err
    }
    return lat, lon, nil
}

func normalizeCityName(city string) string {
    if city == "" {
        return ""
    }
    return strings.ToUpper(city[:1]) + strings.ToLower(city[1:])
}

// SaveCity сохраняет город в таблицу cities
func (r *Repository) SaveCity(name string, lat, lon float64) error {
    query := `INSERT INTO cities (name, lat, lon) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET lat = $2, lon = $3`
    _, err := r.db.Exec(query, name, lat, lon)
    return err
}