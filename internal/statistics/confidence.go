package statistics

import (
	"math"
)

type ConfidenceInterval struct {
	FactorName string  `json:"factor_name"`
	Mean       float64 `json:"mean"`
	Lower      float64 `json:"lower"`
	Upper      float64 `json:"upper"`
	Level      float64 `json:"level"`
	Count      int     `json:"count"`
}

type ConfidenceResult struct {
	Intervals []ConfidenceInterval `json:"intervals"`
}

func ConfidenceIntervalsForFactors(responses []map[string]string) *ConfidenceResult {
	factors := []string{
		"Насколько для Вас важно поступление на бюджетную форму обучения?",
		"Насколько для Вас важна близость ВУЗа к дому?",
		"Насколько для Вас важно наличие общежития?",
	}

	factorNames := map[string]string{
		"Насколько для Вас важно поступление на бюджетную форму обучения?": "Бюджет",
		"Насколько для Вас важна близость ВУЗа к дому?":                    "Близость к дому",
		"Насколько для Вас важно наличие общежития?":                       "Общежитие",
	}

	var intervals []ConfidenceInterval

	for _, factor := range factors {
		var values []float64

		for _, resp := range responses {
			score := float64(ParseScore(resp[factor]))
			if score > 0 {
				values = append(values, score)
			}
		}

		if len(values) == 0 {
			continue
		}

		mean := Mean(values)
		stdDev := StdDev(values)
		n := float64(len(values))

		z := 1.96

		margin := z * (stdDev / math.Sqrt(n))

		intervals = append(intervals, ConfidenceInterval{
			FactorName: factorNames[factor],
			Mean:       mean,
			Lower:      mean - margin,
			Upper:      mean + margin,
			Level:      0.95,
			Count:      len(values),
		})
	}

	return &ConfidenceResult{
		Intervals: intervals,
	}
}