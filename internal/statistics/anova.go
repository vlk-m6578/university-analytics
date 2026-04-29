package statistics

import (
	"math"

	"github.com/km/university-analytics/internal/models"
)

type AnovaResult struct {
	GroupName   string               `json:"group_name"`
	FValue      float64              `json:"f_value"`
	PValue      float64              `json:"p_value"`
	Significant bool                 `json:"significant"`
	Groups      []models.AnovaGroup  `json:"groups"`
}

func ParseScore(s string) int {
	switch s {
	case "1", "2", "3", "4", "5", "6", "7", "8", "9", "10":
		return int(s[0] - '0')
	}
	return 0
}

func ParseAvgScore(s string) int {
	val := 0
	for _, c := range s {
		if c >= '0' && c <= '9' {
			val = val*10 + int(c-'0')
		}
	}
	return val
}

func Mean(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range values {
		sum += v
	}
	return sum / float64(len(values))
}

func StdDev(values []float64) float64 {
	if len(values) < 2 {
		return 0
	}
	m := Mean(values)
	sum := 0.0
	for _, v := range values {
		sum += (v - m) * (v - m)
	}
	variance := sum / float64(len(values)-1)
	return math.Sqrt(variance)
}

func AnovaOnBudgetImportance(responses []map[string]string) *AnovaResult {
	groups := map[string][]float64{
		"Бюджетники (8-10)": {},
		"Гибкие (4-7)":      {},
		"Платники (1-3)":    {},
	}

	for _, resp := range responses {
		importance := ParseScore(resp["Насколько для Вас важно поступление на бюджетную форму обучения?"])
		avgScore := float64(ParseAvgScore(resp["Введите сумму баллов ЦТ и ЦЭ (0-300):"]))
		if avgScore == 0 {
			continue
		}
		if importance >= 8 {
			groups["Бюджетники (8-10)"] = append(groups["Бюджетники (8-10)"], avgScore)
		} else if importance >= 4 {
			groups["Гибкие (4-7)"] = append(groups["Гибкие (4-7)"], avgScore)
		} else if importance >= 1 {
			groups["Платники (1-3)"] = append(groups["Платники (1-3)"], avgScore)
		}
	}

	var groupNames []string
	var groupData [][]float64
	for name, data := range groups {
		if len(data) > 0 {
			groupNames = append(groupNames, name)
			groupData = append(groupData, data)
		}
	}

	fValue, pValue := ANOVA(groupData...)

	var anovaGroups []models.AnovaGroup
	for i, data := range groupData {
		anovaGroups = append(anovaGroups, models.AnovaGroup{
			Name:   groupNames[i],
			Mean:   Mean(data),
			StdDev: StdDev(data),
			Count:  len(data),
		})
	}

	return &AnovaResult{
		GroupName:   "Средний балл в зависимости от важности бюджета",
		FValue:      fValue,
		PValue:      pValue,
		Significant: pValue < 0.05,
		Groups:      anovaGroups,
	}
}

func AnovaOnDistanceImportance(responses []map[string]string) *AnovaResult {
	groups := map[string][]float64{
		"Близость важна (8-10)":   {},
		"Средне (4-7)":           {},
		"Близость не важна (1-3)": {},
	}

	for _, resp := range responses {
		importance := ParseScore(resp["Насколько для Вас важна близость ВУЗа к дому?"])
		avgScore := float64(ParseAvgScore(resp["Введите сумму баллов ЦТ и ЦЭ (0-300):"]))
		if avgScore == 0 {
			continue
		}
		if importance >= 8 {
			groups["Близость важна (8-10)"] = append(groups["Близость важна (8-10)"], avgScore)
		} else if importance >= 4 {
			groups["Средне (4-7)"] = append(groups["Средне (4-7)"], avgScore)
		} else if importance >= 1 {
			groups["Близость не важна (1-3)"] = append(groups["Близость не важна (1-3)"], avgScore)
		}
	}

	var groupNames []string
	var groupData [][]float64
	for name, data := range groups {
		if len(data) > 0 {
			groupNames = append(groupNames, name)
			groupData = append(groupData, data)
		}
	}

	fValue, pValue := ANOVA(groupData...)

	var anovaGroups []models.AnovaGroup
	for i, data := range groupData {
		anovaGroups = append(anovaGroups, models.AnovaGroup{
			Name:   groupNames[i],
			Mean:   Mean(data),
			StdDev: StdDev(data),
			Count:  len(data),
		})
	}

	return &AnovaResult{
		GroupName:   "Средний балл в зависимости от важности близости к дому",
		FValue:      fValue,
		PValue:      pValue,
		Significant: pValue < 0.05,
		Groups:      anovaGroups,
	}
}

func AnovaOnDormitoryImportance(responses []map[string]string) *AnovaResult {
	groups := map[string][]float64{
		"Общежитие важно (8-10)":   {},
		"Средне (4-7)":            {},
		"Общежитие не важно (1-3)": {},
	}

	for _, resp := range responses {
		importance := ParseScore(resp["Насколько для Вас важно наличие общежития?"])
		avgScore := float64(ParseAvgScore(resp["Введите сумму баллов ЦТ и ЦЭ (0-300):"]))
		if avgScore == 0 {
			continue
		}
		if importance >= 8 {
			groups["Общежитие важно (8-10)"] = append(groups["Общежитие важно (8-10)"], avgScore)
		} else if importance >= 4 {
			groups["Средне (4-7)"] = append(groups["Средне (4-7)"], avgScore)
		} else if importance >= 1 {
			groups["Общежитие не важно (1-3)"] = append(groups["Общежитие не важно (1-3)"], avgScore)
		}
	}

	var groupNames []string
	var groupData [][]float64
	for name, data := range groups {
		if len(data) > 0 {
			groupNames = append(groupNames, name)
			groupData = append(groupData, data)
		}
	}

	fValue, pValue := ANOVA(groupData...)

	var anovaGroups []models.AnovaGroup
	for i, data := range groupData {
		anovaGroups = append(anovaGroups, models.AnovaGroup{
			Name:   groupNames[i],
			Mean:   Mean(data),
			StdDev: StdDev(data),
			Count:  len(data),
		})
	}

	return &AnovaResult{
		GroupName:   "Средний балл в зависимости от важности общежития",
		FValue:      fValue,
		PValue:      pValue,
		Significant: pValue < 0.05,
		Groups:      anovaGroups,
	}
}

func ANOVA(groups ...[]float64) (fValue, pValue float64) {
	if len(groups) < 2 {
		return 0, 1
	}

	totalN := 0
	allValues := []float64{}
	for _, g := range groups {
		totalN += len(g)
		allValues = append(allValues, g...)
	}

	grandMean := Mean(allValues)

	ssb := 0.0
	for _, g := range groups {
		if len(g) > 0 {
			ssb += float64(len(g)) * math.Pow(Mean(g)-grandMean, 2)
		}
	}

	ssw := 0.0
	for _, g := range groups {
		if len(g) > 0 {
			groupMean := Mean(g)
			for _, v := range g {
				ssw += math.Pow(v-groupMean, 2)
			}
		}
	}

	dfBetween := len(groups) - 1
	dfWithin := totalN - len(groups)

	if dfWithin == 0 {
		return 0, 1
	}

	msb := ssb / float64(dfBetween)
	msw := ssw / float64(dfWithin)

	if msw == 0 {
		return 0, 1
	}

	fValue = msb / msw
	pValue = 1 - fDistributionCDF(fValue, float64(dfBetween), float64(dfWithin))

	return fValue, pValue
}

func fDistributionCDF(f, df1, df2 float64) float64 {
	if f > 4 {
		return 0.95
	} else if f > 2.5 {
		return 0.9
	} else if f > 1.5 {
		return 0.8
	}
	return 0.5
}