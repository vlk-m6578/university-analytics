package statistics

import (
	"sort"

	"github.com/km/university-analytics/internal/models"
)
//ранжируются у нас всего 3 фактора, там где 10-бальная шкала
var factorNames = map[string]string{
	"Насколько для Вас важно поступление на бюджетную форму обучения?": "Бюджет",
	"Насколько для Вас важна близость ВУЗа к дому?":                    "Близость к дому",
	"Насколько для Вас важно наличие общежития?":                       "Общежитие",
}

func RankFactors(responses []map[string]string) *models.RankingResult {
	scores := make(map[string][]int)

	for _, resp := range responses {
		for question, answer := range resp {
			if _, ok := factorNames[question]; !ok {
				continue
			}

			score := parseScore(answer)
			if score == 0 {
				continue
			}

			scores[question] = append(scores[question], score)
		}
	}

	var items []models.FactorRankingItem
	for question, values := range scores {
		avg := calculateAverage(values)
		items = append(items, models.FactorRankingItem{
			FactorName: factorNames[question],
			Average:    avg,
			Count:      len(values),
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Average > items[j].Average
	})

	for i := range items {
		items[i].Rank = i + 1
	}

	return &models.RankingResult{
		Factors: items,
	}
}

func parseScore(s string) int {
	switch s {
	case "1", "2", "3", "4", "5", "6", "7", "8", "9", "10":
		return int(s[0] - '0')
	}
	return 0
}

func calculateAverage(values []int) float64 {
	if len(values) == 0 {
		return 0
	}
	sum := 0
	for _, v := range values {
		sum += v
	}
	return float64(sum) / float64(len(values))
}