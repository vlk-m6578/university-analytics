package statistics

import (
	"math"
	"sort"
)

type SpearmanResult struct {
	VariableX   string  `json:"variable_x"`
	VariableY   string  `json:"variable_y"`
	Rho         float64 `json:"rho"`
	PValue      float64 `json:"p_value"`
	Significant bool    `json:"significant"`
	Strength    string  `json:"strength"`
	Direction   string  `json:"direction"`
	Count       int     `json:"count"`
}

func SpearmanBudgetImportance(responses []map[string]string) *SpearmanResult {
	var x, y []float64

	for _, resp := range responses {
		avgScore := float64(ParseAvgScore(resp["Введите сумму баллов ЦТ и ЦЭ (0-300):"]))
		importance := float64(ParseScore(resp["Насколько для Вас важно поступление на бюджетную форму обучения?"]))

		if avgScore > 0 && importance > 0 {
			x = append(x, avgScore)
			y = append(y, importance)
		}
	}

	if len(x) < 3 {
		return &SpearmanResult{
			VariableX:   "Сумма баллов (ЦТ/ЦЭ)",
			VariableY:   "Важность бюджетного места",
			Rho:         0,
			PValue:      1,
			Significant: false,
			Strength:    "недостаточно данных",
			Direction:   "нет",
			Count:       len(x),
		}
	}

	rho := spearmanCorrelation(x, y)
	pValue := spearmanPValue(rho, len(x))

	absRho := math.Abs(rho)
	var strength string
	switch {
	case absRho >= 0.7:
		strength = "strong"
	case absRho >= 0.3:
		strength = "moderate"
	default:
		strength = "weak"
	}

	direction := "neutral"
	if rho > 0.1 {
		direction = "positive"
	} else if rho < -0.1 {
		direction = "negative"
	}

	return &SpearmanResult{
		VariableX:   "Сумма баллов (ЦТ/ЦЭ)",
		VariableY:   "Важность бюджетного места",
		Rho:         rho,
		PValue:      pValue,
		Significant: pValue < 0.05,
		Strength:    strength,
		Direction:   direction,
		Count:       len(x),
	}
}

func spearmanCorrelation(x, y []float64) float64 {
	n := len(x)
	if n != len(y) || n < 2 {
		return 0
	}

	rankX := ranks(x)
	rankY := ranks(y)

	var dSum float64
	for i := 0; i < n; i++ {
		d := rankX[i] - rankY[i]
		dSum += d * d
	}

	rho := 1 - (6*dSum)/(float64(n)*(float64(n)*float64(n)-1))

	if rho > 1 {
		rho = 1
	}
	if rho < -1 {
		rho = -1
	}
	return rho
}

func ranks(values []float64) []float64 {
	n := len(values)
	ranks := make([]float64, n)

	type pair struct {
		value float64
		index int
	}
	pairs := make([]pair, n)
	for i, v := range values {
		pairs[i] = pair{value: v, index: i}
	}

	sort.Slice(pairs, func(i, j int) bool {
		return pairs[i].value < pairs[j].value
	})

	i := 0
	for i < n {
		j := i
		for j < n && pairs[j].value == pairs[i].value {
			j++
		}
		avgRank := float64(i+j+1) / 2
		for k := i; k < j; k++ {
			ranks[pairs[k].index] = avgRank
		}
		i = j
	}
	return ranks
}

func spearmanPValue(rho float64, n int) float64 {
	if n < 3 {
		return 1
	}
	t := rho * math.Sqrt(float64(n-2)) / math.Sqrt(1-rho*rho)
	pValue := 2 * (1 - tDistributionCDF(t, float64(n-2)))
	if pValue > 1 {
		pValue = 1
	}
	if pValue < 0 {
		pValue = 0
	}
	return pValue
}

func tDistributionCDF(t, df float64) float64 {
	absT := math.Abs(t)
	if absT > 2.5 {
		return 0.99
	}
	if absT > 2.0 {
		return 0.95
	}
	if absT > 1.5 {
		return 0.9
	}
	return 0.7
}