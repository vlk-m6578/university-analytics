package recommender

import (
	"sort"
	"strconv"

	"github.com/km/university-analytics/internal/models"
)

type Recommender struct{}

func New() *Recommender {
	return &Recommender{}
}

func (r *Recommender) Recommend(answers map[string]string, specialties []models.Specialty) []models.Recommendation {
	var recommendations []models.Recommendation

	examSum, _ := strconv.Atoi(answers["Введите сумму баллов ЦТ и ЦЭ (0-300):"])
	avgGrade, _ := strconv.ParseFloat(answers["Введите средний балл аттестата:"], 64)
	distanceImportance, _ := strconv.Atoi(answers["Насколько для Вас важна близость ВУЗа к дому?"])

	for _, spec := range specialties {
		score := 0.0

		if examSum >= spec.PassScoreBudget {
			score += 40
		} else if examSum >= spec.PassScorePaid {
			score += 20
		}

		if avgGrade >= 8 {
			score += 10
		} else if avgGrade >= 6 {
			score += 5
		}

		// TODO: добавить реальное расстояние между городами
		if distanceImportance >= 8 {
			score += 10
		} else if distanceImportance >= 5 {
			score += 5
		}

		if score > 0 {
			recommendations = append(recommendations, models.Recommendation{
				University: spec.University,
				Specialty:  spec,
				MatchScore: score,
			})
		}
	}

	sort.Slice(recommendations, func(i, j int) bool {
		return recommendations[i].MatchScore > recommendations[j].MatchScore
	})

	if len(recommendations) > 5 {
		recommendations = recommendations[:5]
	}
	return recommendations
}