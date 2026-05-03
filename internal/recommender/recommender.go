package recommender

import (
	"log"
	"math"
	"sort"

	"github.com/km/university-analytics/internal/models"
	"github.com/km/university-analytics/internal/repository"
)

type Recommender struct {
	repo *repository.Repository
}

func NewRecommender(repo *repository.Repository) *Recommender {
	return &Recommender{repo: repo}
}

type RecommendationResult struct {
	UniversityName  string  `json:"university_name"`
	UniversityCity  string  `json:"university_city"`
	SpecialtyName   string  `json:"specialty_name"`
	Direction       string  `json:"direction"`
	MatchScore      float64 `json:"match_score"`
	DistanceKm      float64 `json:"distance_km"`
	PassScoreBudget int     `json:"pass_score_budget,omitempty"`
}

func (r *Recommender) GetRecommendationsByDirection(req models.RecommendRequest, direction string) ([]RecommendationResult, error) {
	log.Printf("=== GetRecommendationsByDirection: %s, city=%s, format=%s", direction, req.City, req.StudyFormat)

	specialties, err := r.repo.GetSpecialtiesByDirection(direction)
	if err != nil {
		log.Printf("Error getting specialties: %v", err)
		return nil, err
	}
	log.Printf("Found %d specialties for direction %s", len(specialties), direction)

	var results []RecommendationResult

	for _, spec := range specialties {
		// 1. Фильтрация по формату обучения
		if spec.StudyFormat != "" && spec.StudyFormat != req.StudyFormat {
			continue
		}

		// 2. Фильтрация по общежитию (если очень важно 8-10, но нет общежития)
		if req.DormitoryImportance >= 8 && !spec.University.HasDormitory {
			continue
		}

		// 3. Проверка прохода по баллам/льготам
		passes, _ := r.checkPassScore(req, spec)
		if !passes {
			continue
		}

		// 4. Расчёт расстояния
		distance := r.calculateDistance(req.City, spec.University.Lat, spec.University.Lon)

		// 5. Фильтрация по расстоянию
		if req.DistanceImportance >= 6 {
			if req.DistanceImportance >= 8 && distance > 150 {
				continue
			}
			if req.DistanceImportance >= 6 && distance > 300 {
				continue
			}
		}

		// Добавляем в результаты
		results = append(results, RecommendationResult{
			UniversityName:  spec.University.Name,
			UniversityCity:  spec.University.City,
			SpecialtyName:   spec.Name,
			Direction:       spec.Direction,
			MatchScore:      float64(spec.PassScoreBudget),
			DistanceKm:      distance,
			PassScoreBudget: spec.PassScoreBudget,
		})
	}

	// Сортировка по проходному баллу (от большего к меньшему) — лучшие специальности первыми
	sort.Slice(results, func(i, j int) bool {
		return results[i].PassScoreBudget > results[j].PassScoreBudget
	})

	// Топ-5
	if len(results) > 5 {
		results = results[:5]
	}

	log.Printf("Returning %d recommendations for direction %s", len(results), direction)
	return results, nil
}

func (r *Recommender) GetRecommendationsForAnswers(answers map[string]string, apiKey string, req models.RecommendRequest) ([]RecommendationResult, error) {
	directions := DetermineDirection(answers, apiKey)
	log.Printf("Determined directions: %v", directions)

	var allResults []RecommendationResult

	for _, dir := range directions {
		results, err := r.GetRecommendationsByDirection(req, dir)
		if err != nil {
			log.Printf("Error getting recommendations for direction %s: %v", dir, err)
			continue
		}
		allResults = append(allResults, results...)
	}

	// Сортировка по проходному баллу (от большего к меньшему)
	sort.Slice(allResults, func(i, j int) bool {
		return allResults[i].PassScoreBudget > allResults[j].PassScoreBudget
	})

	if len(allResults) > 5 {
		allResults = allResults[:5]
	}

	return allResults, nil
}

func (r *Recommender) checkPassScore(req models.RecommendRequest, spec models.Specialty) (bool, bool) {
	totalScore := req.AvgScore + req.AvgGrade*10

	// Республиканская олимпиада → БВИ на любую специальность
	if req.Benefits.RepublicanOlympiad {
		return true, true
	}

	// Золотая медаль
	if req.Benefits.GoldMedal {
		if totalScore >= float64(spec.PassScoreBudget) {
			return true, false
		}
		if spec.MedalAdmission {
			return true, true
		}
		return false, false
	}

	// Первый взрослый разряд → БВИ на платное
	if req.Benefits.FirstSportsRank && req.BudgetImportance < 8 {
		if spec.PassScorePaid != nil && *spec.PassScorePaid > 0 {
			return true, true
		}
	}

	// Обычная проверка баллов
	if totalScore >= float64(spec.PassScoreBudget) {
		return true, false
	}

	return false, false
}

func (r *Recommender) calculateDistance(userCity string, uniLat, uniLon float64) float64 {
	cityLat, cityLon, err := r.repo.GetCityCoordinates(userCity)
	if err != nil {
		log.Printf("    ⚠️ City not found in DB: %s, distance=0", userCity)
		return 0
	}
	return haversine(cityLat, cityLon, uniLat, uniLon)
}

func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}