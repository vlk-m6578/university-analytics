package recommender

import (
	"math"
	"sort"
	"strings"

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
	UniversityName string  `json:"university_name"`
	UniversityCity string  `json:"university_city"`
	SpecialtyName  string  `json:"specialty_name"`
	Direction      string  `json:"direction"`
	MatchScore     float64 `json:"match_score"`
	DistanceKm     float64 `json:"distance_km"`
}

func (r *Recommender) GetRecommendations(req models.RecommendRequest) ([]RecommendationResult, error) {
	specialties, err := r.repo.GetSpecialtiesByDirection(req.Direction)
	if err != nil {
		return nil, err
	}

	var results []RecommendationResult

	for _, spec := range specialties {
		// 1. Фильтрация по формату обучения
		if req.StudyFormat != "any" && spec.StudyFormat != req.StudyFormat && spec.StudyFormat != "" {
			continue
		}

		// 2. Фильтрация по бюджету
		if req.BudgetNeeded && spec.PassScoreBudget == 0 {
			continue
		}

		// 3. Фильтрация по общежитию
		if req.DormitoryNeeded && !spec.University.HasDormitory {
			continue
		}

		// 4. Проверка баллов с учётом льгот
		if !r.checkPassScore(req, spec) {
			continue
		}

		// 5. Расчёт расстояния
		distance := calculateDistance(req.City, spec.University.Lat, spec.University.Lon)

		// 6. Расчёт MatchScore
		matchScore := r.calculateMatchScore(req, spec, distance)

		if matchScore > 0 {
			results = append(results, RecommendationResult{
				UniversityName: spec.University.Name,
				UniversityCity: spec.University.City,
				SpecialtyName:  spec.Name,
				Direction:      spec.Direction,
				MatchScore:     matchScore,
				DistanceKm:     distance,
			})
		}
	}

	// Сортировка по убыванию MatchScore
	sort.Slice(results, func(i, j int) bool {
		return results[i].MatchScore > results[j].MatchScore
	})

	// Топ-5
	if len(results) > 5 {
		results = results[:5]
	}

	return results, nil
}

// checkPassScore проверяет, проходит ли абитуриент по баллам с учётом льгот
func (r *Recommender) checkPassScore(req models.RecommendRequest, spec models.Specialty) bool {
	// БВИ от олимпиад (республиканская или областная)
	hasBVI := req.Benefits.RepublicanOlympiad || req.Benefits.RegionalOlympiad
	if hasBVI {
		return true
	}

	// БВИ от золотой медали на специальности из "медального списка"
	if req.Benefits.GoldMedal && spec.MedalAdmission {
		return true
	}

	// Обычная проверка баллов
	requiredScore := spec.PassScoreBudget
	if !req.BudgetNeeded {
		requiredScore = spec.PassScorePaid
	}

	return req.AvgScore >= requiredScore
}

// calculateMatchScore вычисляет итоговую оценку соответствия (0-100)
func (r *Recommender) calculateMatchScore(req models.RecommendRequest, spec models.Specialty, distanceKm float64) float64 {
	var score float64 = 0

	// 1. Баллы (40%)
	if r.checkPassScore(req, spec) {
		score += 40
	} else {
		return 0
	}

	// 2. Близость к дому (30%)
	distanceScore := calculateDistanceScore(distanceKm, req.DistanceImportance)
	score += distanceScore

	// 3. Бюджет (20%)
	if req.BudgetNeeded {
		if spec.PassScoreBudget > 0 {
			score += 20
		}
	} else {
		score += 20
	}

	// 4. Общежитие (10%)
	if req.DormitoryNeeded {
		if spec.University.HasDormitory {
			score += 10
		}
	} else {
		score += 10
	}

	return score
}

func calculateDistance(userCity string, uniLat, uniLon float64) float64 {
	cityCoords := map[string]struct{ lat, lon float64 }{
		"Минск":      {53.9025, 27.5618},
		"Гомель":     {52.4345, 30.9754},
		"Гродно":     {53.6775, 23.8325},
		"Витебск":    {55.1900, 30.2000},
		"Могилёв":    {53.9000, 30.3300},
		"Брест":      {52.0975, 23.6878},
		"Новополоцк": {55.5300, 28.6500},
	}

	normalizedCity := normalizeCityName(userCity)

	userCoord, ok := cityCoords[normalizedCity]
	if !ok {
		return 0
	}

	return haversine(userCoord.lat, userCoord.lon, uniLat, uniLon)
}

// normalizeCityName приводит название города к стандартному виду
func normalizeCityName(city string) string {
	if city == "" {
		return ""
	}
	return strings.ToUpper(city[:1]) + strings.ToLower(city[1:])
}

// haversine формула для расчёта расстояния между двумя точками на сфере
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

// calculateDistanceScore вычисляет балл за близость (макс 30)
func calculateDistanceScore(distanceKm float64, importance int) float64 {
	if importance <= 3 {
		return 30
	}

	if importance <= 7 {
		if distanceKm < 50 {
			return 25
		} else if distanceKm < 150 {
			return 15
		}
		return 5
	}

	if distanceKm < 50 {
		return 30
	} else if distanceKm < 150 {
		return 20
	} else if distanceKm < 300 {
		return 10
	}
	return 0
}