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
	UniversityName string  `json:"university_name"`
	UniversityCity string  `json:"university_city"`
	SpecialtyName  string  `json:"specialty_name"`
	Direction      string  `json:"direction"`
	MatchScore     float64 `json:"match_score"`
	DistanceKm     float64 `json:"distance_km"`
}

func (r *Recommender) GetRecommendationsByDirection(req models.RecommendRequest, direction string) ([]RecommendationResult, error) {
	specialties, err := r.repo.GetSpecialtiesByDirection(direction)
	if err != nil {
		log.Printf("Error getting specialties: %v", err)
		return nil, err
	}
	log.Printf("Found %d specialties for direction %s", len(specialties), direction)

	var results []RecommendationResult

	for _, spec := range specialties {
		if spec.StudyFormat != "" && spec.StudyFormat != req.StudyFormat {
			continue
		}

		if req.DormitoryImportance >= 8 && !spec.University.HasDormitory {
			continue
		}

		passes, usedLuckyPass := r.checkPassScore(req, spec)
		if !passes {
			continue
		}

		distance := r.calculateDistance(req.City, spec.University.Lat, spec.University.Lon)
		matchScore := r.calculateMatchScore(req, spec, distance, usedLuckyPass)

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

	sort.Slice(results, func(i, j int) bool {
		return results[i].MatchScore > results[j].MatchScore
	})

	if len(results) > 5 {
		results = results[:5]
	}

	return results, nil
}

func (r *Recommender) GetRecommendationsForAnswers(answers map[string]string, apiKey string, req models.RecommendRequest) ([]RecommendationResult, error) {
	directions := DetermineDirection(answers, apiKey)

	var allResults []RecommendationResult

	for _, dir := range directions {
		results, err := r.GetRecommendationsByDirection(req, dir)
		if err != nil {
			log.Printf("Error getting recommendations for direction %s: %v", dir, err)
			continue
		}
		allResults = append(allResults, results...)
	}

	sort.Slice(allResults, func(i, j int) bool {
		return allResults[i].MatchScore > allResults[j].MatchScore
	})

	if len(allResults) > 5 {
		allResults = allResults[:5]
	}

	return allResults, nil
}

func (r *Recommender) checkPassScore(req models.RecommendRequest, spec models.Specialty) (bool, bool) {
	if req.Benefits.RepublicanOlympiad {
		return true, true
	}

	if req.Benefits.FirstSportsRank && spec.PassScorePaid != nil && *spec.PassScorePaid > 0 {
		return true, true
	}

	if req.Benefits.GoldMedal && spec.MedalAdmission {
		return true, true
	}

	if req.Benefits.RegionalOlympiad && spec.MedalAdmission {
		return true, true
	}

	if req.Benefits.UniversityDiploma && spec.University.City != "Минск" {
		return true, true
	}

	// Общая сумма баллов: ЦТ/ЦЭ (0-300) + средний балл аттестата × 10 (0-100)
	totalScore := req.AvgScore + req.AvgGrade*10

	var requiredScore float64
	if req.BudgetImportance >= 6 {
		requiredScore = float64(spec.PassScoreBudget)
	} else {
		if spec.PassScorePaid != nil && *spec.PassScorePaid > 0 {
			requiredScore = float64(*spec.PassScorePaid)
		} else {
			requiredScore = float64(spec.PassScoreBudget)
		}
	}

	if totalScore >= requiredScore {
		return true, false
	}

	return false, false
}

func (r *Recommender) calculateBonus(req models.RecommendRequest) float64 {
	bonus := 0.0

	if req.Benefits.RepublicanOlympiad {
		bonus += 20
	}
	if req.Benefits.RegionalOlympiad {
		bonus += 12
	}
	if req.Benefits.GoldMedal {
		bonus += 10
	}
	if req.Benefits.FirstSportsRank {
		bonus += 8
	}
	if req.Benefits.UniversityDiploma {
		bonus += 5
	}
	if req.Benefits.SilverMedal {
		bonus += 5
	}

	return bonus
}

func (r *Recommender) calculateMatchScore(req models.RecommendRequest, spec models.Specialty, distanceKm float64, usedLuckyPass bool) float64 {
	var score float64 = 0

	if usedLuckyPass {
		score += 40
	} else {
		totalScore := req.AvgScore + req.AvgGrade*10

		var requiredScore float64
		if req.BudgetImportance >= 6 {
			requiredScore = float64(spec.PassScoreBudget)
		} else {
			if spec.PassScorePaid != nil && *spec.PassScorePaid > 0 {
				requiredScore = float64(*spec.PassScorePaid)
			} else {
				requiredScore = float64(spec.PassScoreBudget)
			}
		}

		if totalScore >= requiredScore {
			score += 40
		} else {
			return 0
		}
	}

	bonus := r.calculateBonus(req)
	score += math.Min(bonus, 20)

	score += calculateDistanceScore(distanceKm, req.DistanceImportance)

	if req.BudgetImportance >= 6 {
		if spec.PassScoreBudget > 0 {
			score += 20
		}
	} else {
		score += 20
	}

	if req.DormitoryImportance >= 6 {
		if spec.University.HasDormitory {
			score += 10
		}
	} else {
		score += 10
	}

	return score
}

func (r *Recommender) calculateDistance(userCity string, uniLat, uniLon float64) float64 {
	cityLat, cityLon, err := r.repo.GetCityCoordinates(userCity)
	if err != nil {
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