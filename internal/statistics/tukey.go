package statistics

import (
	"math"
)

type TukeyPair struct {
	Group1       string  `json:"group1"`
	Group2       string  `json:"group2"`
	MeanDiff     float64 `json:"mean_diff"`
	Significant  bool    `json:"significant"`
	PValue       float64 `json:"p_value"`
}

type TukeyResult struct {
	Groups     []string     `json:"groups"`     
	GroupMeans map[string]float64 `json:"group_means"` 
	Pairs      []TukeyPair  `json:"pairs"`      
}

// попарные сравнения между направлениями
func TukeyHSDByDirection(responses []map[string]string) *TukeyResult {
	groups := map[string][]float64{
		"DataScience": {},
		"Backend":     {},
		"Frontend":    {},
		"DevOps":      {},
		"Mobile":      {},
		"Embedded":    {},
	}

	for _, resp := range responses {
		direction := resp["Какое IT-направление вас интересует?"]
		avgScore := float64(ParseAvgScore(resp["Введите сумму баллов ЦТ и ЦЭ (0-300):"]))

		if avgScore == 0 {
			continue
		}

		if _, ok := groups[direction]; ok {
			groups[direction] = append(groups[direction], avgScore)
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

	groupMeans := make(map[string]float64)
	for i, name := range groupNames {
		groupMeans[name] = Mean(groupData[i])
	}

	var pairs []TukeyPair
	for i := 0; i < len(groupData); i++ {
		for j := i + 1; j < len(groupData); j++ {
			meanDiff := math.Abs(groupMeans[groupNames[i]] - groupMeans[groupNames[j]])

			pValue := tukeyPValue(meanDiff, groupData[i], groupData[j])

			pairs = append(pairs, TukeyPair{
				Group1:      groupNames[i],
				Group2:      groupNames[j],
				MeanDiff:    meanDiff,
				Significant: pValue < 0.05,
				PValue:      pValue,
			})
		}
	}

	return &TukeyResult{
		Groups:     groupNames,
		GroupMeans: groupMeans,
		Pairs:      pairs,
	}
}

func tukeyPValue(meanDiff float64, group1, group2 []float64) float64 {
	if len(group1) < 2 || len(group2) < 2 {
		return 1
	}

	n1 := float64(len(group1))
	n2 := float64(len(group2))
	var1 := variance(group1)
	var2 := variance(group2)

	pooledSE := math.Sqrt((var1/n1 + var2/n2) / 2)

	if pooledSE == 0 {
		return 1
	}

	q := meanDiff / pooledSE

	if q < 0.5 {
		return 0.5
	}
	if q < 1.0 {
		return 0.3
	}
	if q < 1.5 {
		return 0.1
	}
	if q < 2.0 {
		return 0.05
	}
	if q < 2.5 {
		return 0.03
	}
	return 0.01
}

func variance(values []float64) float64 {
	if len(values) < 2 {
		return 0
	}
	m := Mean(values)
	sum := 0.0
	for _, v := range values {
		sum += (v - m) * (v - m)
	}
	return sum / float64(len(values)-1)
}