package statistics

import (
	"sort"

	"github.com/km/university-analytics/internal/models"
)

type KruskalWallisResult struct {
	GroupName   string                `json:"group_name"`
	HValue      float64               `json:"h_value"`
	PValue      float64               `json:"p_value"`
	Significant bool                  `json:"significant"`
	Groups      []models.AnovaGroup   `json:"groups"`
}

// KruskalWallisByDirection проверяет связь между баллами и IT-направлением
func KruskalWallisByDirection(responses []map[string]string) *KruskalWallisResult {
	groups := map[string][]float64{
		"DataScience": {},
		"Backend":     {},
		"DevOps":      {},
		"Frontend":    {},
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

	if len(groupData) < 2 {
		return &KruskalWallisResult{
			GroupName:   "Связь баллов и IT-направления",
			HValue:      0,
			PValue:      1,
			Significant: false,
			Groups:      []models.AnovaGroup{},
		}
	}

	hValue, pValue := KruskalWallis(groupData...)

	var kruskalGroups []models.AnovaGroup
	for i, data := range groupData {
		kruskalGroups = append(kruskalGroups, models.AnovaGroup{
			Name:   groupNames[i],
			Mean:   Mean(data),
			StdDev: StdDev(data),
			Count:  len(data),
		})
	}

	return &KruskalWallisResult{
		GroupName:   "Связь суммы баллов ЦТ/ЦЭ и выбранного IT-направления",
		HValue:      hValue,
		PValue:      pValue,
		Significant: pValue < 0.05,
		Groups:      kruskalGroups,
	}
}

// KruskalWallis выполняет тест Краскела-Уоллиса
func KruskalWallis(groups ...[]float64) (hValue, pValue float64) {
	if len(groups) < 2 {
		return 0, 1
	}

	type rankedValue struct {
		value float64
		group int
		rank  float64
	}

	var all []rankedValue
	for i, g := range groups {
		for _, v := range g {
			all = append(all, rankedValue{
				value: v,
				group: i,
			})
		}
	}

	sort.Slice(all, func(i, j int) bool {
		return all[i].value < all[j].value
	})

	n := len(all)
	for i := 0; i < n; {
		j := i
		for j < n && all[j].value == all[i].value {
			j++
		}
		rank := float64(i+j+1) / 2
		for k := i; k < j; k++ {
			all[k].rank = rank
		}
		i = j
	}

	rankSums := make([]float64, len(groups))
	counts := make([]int, len(groups))
	for _, v := range all {
		rankSums[v.group] += v.rank
		counts[v.group]++
	}

	totalN := float64(n)
	h := 0.0
	for i := 0; i < len(groups); i++ {
		if counts[i] > 0 {
			h += float64(rankSums[i]*rankSums[i]) / float64(counts[i])
		}
	}
	h = (12 / (totalN * (totalN + 1))) * h
	h = h - 3*(totalN+1)

	t := 0.0
	for i := 0; i < n; {
		j := i
		for j < n && all[j].value == all[i].value {
			j++
		}
		m := float64(j - i)
		t += m*m*m - m
		i = j
	}
	correction := 1 - t/(totalN*totalN*totalN-totalN)
	if correction > 0 {
		h = h / correction
	}

	df := len(groups) - 1
	pValue = chiSquareCDF(h, float64(df))

	return h, pValue
}

func chiSquareCDF(chi2, df float64) float64 {
	if chi2 > 7.81 && df == 3 {
		return 0.05
	}
	if chi2 > 5.99 && df == 2 {
		return 0.05
	}
	if chi2 > 3.84 && df == 1 {
		return 0.05
	}
	return 0.1
}