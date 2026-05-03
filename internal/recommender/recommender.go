package recommender

import (
	"log"
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
	return r.getFilteredRecommendations(req, direction, true, true)
}

func (r *Recommender) GetRecommendationsForAnswers(answers map[string]string, apiKey string, req models.RecommendRequest) ([]RecommendationResult, error) {
	directions := DetermineDirection(answers, apiKey)
	log.Printf("Determined directions: %v", directions)

	if len(directions) == 0 {
		directions = []string{"Backend"}
	}

	return r.getRecommendationsWithFallback(req, directions)
}

func (r *Recommender) getRecommendationsWithFallback(req models.RecommendRequest, directions []string) ([]RecommendationResult, error) {
	fallbackLevels := []struct {
		name        string
		useDistance bool
		useDorm     bool
		expandDir   bool
	}{
		{"Жёсткие фильтры", true, true, false},
		{"Отключаем расстояние", false, true, false},
		{"Отключаем общежитие", false, false, false},
		{"Расширяем направления", false, false, true},
		{"Только направление (без фильтров)", false, false, true},
	}

	var lastError error

	for _, level := range fallbackLevels {
		var allResults []RecommendationResult

		searchDirs := directions
		if level.expandDir && len(directions) == 1 {
			searchDirs = r.expandDirections(directions[0])
		}

		for _, dir := range searchDirs {
			results, err := r.getFilteredRecommendations(req, dir, level.useDistance, level.useDorm)
			if err != nil {
				lastError = err
				continue
			}
			allResults = append(allResults, results...)
		}

		if len(allResults) > 0 {
			finalResults := r.SortResults(allResults, req.City, req.AvgScore+req.AvgGrade*10)
			if len(finalResults) > 0 {
				log.Printf("Found %d recommendations at level: %s", len(finalResults), level.name)
				return finalResults, nil
			}
		}
	}

	return nil, lastError
}

func (r *Recommender) getFilteredRecommendations(req models.RecommendRequest, direction string, useDistanceFilter, useDormFilter bool) ([]RecommendationResult, error) {
	specialties, err := r.repo.GetSpecialtiesByDirection(direction)
	if err != nil {
		return nil, err
	}

	var results []RecommendationResult

	for _, spec := range specialties {
		if spec.StudyFormat != "" && spec.StudyFormat != req.StudyFormat {
			continue
		}

		if useDormFilter && req.DormitoryImportance >= 8 && !spec.University.HasDormitory {
			continue
		}

		passes, _ := r.checkPassScore(req, spec)
		if !passes {
			continue
		}

		distance := r.calculateDistance(req.City, spec.University.Lat, spec.University.Lon)

		if useDistanceFilter && req.DistanceImportance >= 6 {
			if req.DistanceImportance >= 8 && distance > 150 {
				continue
			}
			if req.DistanceImportance >= 6 && distance > 300 {
				continue
			}
		}

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

	sort.Slice(results, func(i, j int) bool {
		return results[i].PassScoreBudget > results[j].PassScoreBudget
	})

	return results, nil
}

func (r *Recommender) SortResults(results []RecommendationResult, userCity string, totalScore float64) []RecommendationResult {
	var minskResults, regionalResults []RecommendationResult

	for _, res := range results {
		if res.UniversityCity == "Минск" {
			minskResults = append(minskResults, res)
		} else {
			regionalResults = append(regionalResults, res)
		}
	}

	sort.Slice(minskResults, func(i, j int) bool {
		return minskResults[i].PassScoreBudget > minskResults[j].PassScoreBudget
	})

	sort.Slice(regionalResults, func(i, j int) bool {
		return regionalResults[i].PassScoreBudget > regionalResults[j].PassScoreBudget
	})

	var finalResults []RecommendationResult

	if userCity == "Минск" && totalScore >= 330 {
		finalResults = append(finalResults, minskResults...)
		finalResults = append(finalResults, regionalResults...)
	} else {
		finalResults = append(finalResults, minskResults...)
		finalResults = append(finalResults, regionalResults...)
	}

	if len(finalResults) > 5 {
		finalResults = finalResults[:5]
	}

	return finalResults
}

func (r *Recommender) expandDirections(direction string) []string {
	expansionMap := map[string][]string{
		"Mobile":      {"Frontend", "Backend"},
		"Frontend":    {"Mobile", "Backend"},
		"Backend":     {"DevOps", "DataScience"},
		"DevOps":      {"Backend", "Embedded"},
		"DataScience": {"Backend", "Embedded"},
		"Embedded":    {"DevOps", "Backend"},
	}

	if expanded, ok := expansionMap[direction]; ok {
		return append([]string{direction}, expanded...)
	}
	return []string{direction}
}

func (r *Recommender) checkPassScore(req models.RecommendRequest, spec models.Specialty) (bool, bool) {
	totalScore := req.AvgScore + req.AvgGrade*10

	if req.Benefits.RepublicanOlympiad {
		return true, true
	}

	if req.Benefits.GoldMedal {
		if totalScore >= float64(spec.PassScoreBudget) {
			return true, false
		}
		if spec.MedalAdmission {
			return true, true
		}
		return false, false
	}

	if req.Benefits.FirstSportsRank && req.BudgetImportance < 8 {
		if spec.PassScorePaid != nil && *spec.PassScorePaid > 0 {
			return true, true
		}
	}

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
	const R = 6371.0
	lat1Rad := lat1 * 3.141592653589793 / 180
	lon1Rad := lon1 * 3.141592653589793 / 180
	lat2Rad := lat2 * 3.141592653589793 / 180
	lon2Rad := lon2 * 3.141592653589793 / 180

	dLat := lat2Rad - lat1Rad
	dLon := lon2Rad - lon1Rad

	a := sin(dLat/2)*sin(dLat/2) + cos(lat1Rad)*cos(lat2Rad)*sin(dLon/2)*sin(dLon/2)
	c := 2 * atan2(sqrt(a), sqrt(1-a))

	return R * c
}

// Вспомогательные математические функции
func sin(x float64) float64 {
	return sinImpl(x)
}

func cos(x float64) float64 {
	return cosImpl(x)
}

func atan2(y, x float64) float64 {
	return atan2Impl(y, x)
}

func sqrt(x float64) float64 {
	return sqrtImpl(x)
}

func sinImpl(x float64) float64 {
	return sinApprox(x)
}

func cosImpl(x float64) float64 {
	return cosApprox(x)
}

func atan2Impl(y, x float64) float64 {
	return atan2Approx(y, x)
}

func sqrtImpl(x float64) float64 {
	return sqrtApprox(x)
}

func sinApprox(x float64) float64 {
	for x > 3.141592653589793*2 {
		x -= 3.141592653589793 * 2
	}
	for x < 0 {
		x += 3.141592653589793 * 2
	}
	result := x
	term := x
	for i := 1; i < 10; i++ {
		term *= -x * x / float64((2*i)*(2*i+1))
		result += term
	}
	return result
}

func cosApprox(x float64) float64 {
	for x > 3.141592653589793*2 {
		x -= 3.141592653589793 * 2
	}
	for x < 0 {
		x += 3.141592653589793 * 2
	}
	result := 1.0
	term := 1.0
	for i := 1; i < 10; i++ {
		term *= -x * x / float64((2*i-1)*2*i)
		result += term
	}
	return result
}

func atan2Approx(y, x float64) float64 {
	if x == 0 {
		if y > 0 {
			return 3.141592653589793 / 2
		}
		if y < 0 {
			return -3.141592653589793 / 2
		}
		return 0
	}
	angle := atanApprox(y / x)
	if x < 0 {
		if y >= 0 {
			angle += 3.141592653589793
		} else {
			angle -= 3.141592653589793
		}
	}
	return angle
}

func atanApprox(x float64) float64 {
	return x - x*x*x/3 + x*x*x*x*x/5 - x*x*x*x*x*x*x/7
}

func sqrtApprox(x float64) float64 {
	if x <= 0 {
		return 0
	}
	guess := x / 2
	for i := 0; i < 10; i++ {
		guess = (guess + x/guess) / 2
	}
	return guess
}