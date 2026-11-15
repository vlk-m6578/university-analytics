package statistics

import "math"

const (
	budgetImportanceKey = "Насколько для Вас важно поступление на бюджетную форму обучения?"
	scoreKey            = "Введите сумму баллов ЦТ и ЦЭ (0-300):"
)

type SimulationGroup struct {
	Name  string  `json:"name"`
	Count int     `json:"count"`
	Mean  float64 `json:"mean"`
}

type BootstrapSummary struct {
	Diff         float64 `json:"diff"`
	CILow        float64 `json:"ci_low"`
	CIHigh       float64 `json:"ci_high"`
	ProbPositive float64 `json:"prob_positive"`
	Stable       bool    `json:"stable"`
}

type PermutationSummary struct {
	FValue      float64 `json:"f_value"`
	PValue      float64 `json:"p_value"`
	Significant bool    `json:"significant"`
}

type JackknifeSummary struct {
	BaseDiff       float64   `json:"base_diff"`
	PMin           float64   `json:"p_min"`
	PMax           float64   `json:"p_max"`
	PMean          float64   `json:"p_mean"`
	PStdDev        float64   `json:"p_std_dev"`
	SignificantCnt int       `json:"significant_count"`
	Total          int       `json:"total"`
	Robust         bool      `json:"robust"`
	PValues        []float64 `json:"p_values"`
}

type SimulationResult struct {
	Title       string             `json:"title"`
	Groups      []SimulationGroup  `json:"groups"`
	Bootstrap   BootstrapSummary   `json:"bootstrap"`
	Permutation PermutationSummary `json:"permutation"`
	Jackknife   JackknifeSummary   `json:"jackknife"`
}

func SimulateBudgetImportance(responses []map[string]string) *SimulationResult {
	names := []string{"Бюджетники (8-10)", "Гибкие (4-7)", "Платники (1-3)"}
	data := make([][]float64, len(names))

	for _, resp := range responses {
		importance := ParseScore(resp[budgetImportanceKey])
		score := float64(ParseAvgScore(resp[scoreKey]))
		if score == 0 {
			continue
		}
		switch {
		case importance >= 8:
			data[0] = append(data[0], score)
		case importance >= 4:
			data[1] = append(data[1], score)
		case importance >= 1:
			data[2] = append(data[2], score)
		}
	}

	if len(data[0]) < 2 || len(data[2]) < 2 {
		return nil
	}

	var groups []SimulationGroup
	var nonEmpty [][]float64
	for i, g := range data {
		if len(g) == 0 {
			continue
		}
		groups = append(groups, SimulationGroup{Name: names[i], Count: len(g), Mean: Mean(g)})
		nonEmpty = append(nonEmpty, g)
	}

	boot := BootstrapDiffMeans(data[0], data[2])
	f, p := PermutationANOVA(nonEmpty)
	jk := JackknifeDiffMeans(data[0], data[2])

	pMin, pMax := jk.PValues[0], jk.PValues[0]
	significant := 0
	for _, v := range jk.PValues {
		pMin = math.Min(pMin, v)
		pMax = math.Max(pMax, v)
		if v < 0.05 {
			significant++
		}
	}

	return &SimulationResult{
		Title:  "Средний балл в зависимости от важности бюджета",
		Groups: groups,
		Bootstrap: BootstrapSummary{
			Diff:         Mean(data[0]) - Mean(data[2]),
			CILow:        boot.CILow,
			CIHigh:       boot.CIHigh,
			ProbPositive: boot.ProbPositive,
			Stable:       boot.CILow > 0 || boot.CIHigh < 0,
		},
		Permutation: PermutationSummary{FValue: f, PValue: p, Significant: p < 0.05},
		Jackknife: JackknifeSummary{
			BaseDiff:       jk.BaseDiff,
			PMin:           pMin,
			PMax:           pMax,
			PMean:          Mean(jk.PValues),
			PStdDev:        StdDev(jk.PValues),
			SignificantCnt: significant,
			Total:          len(jk.PValues),
			Robust:         (pMax < 0.05) == (pMin < 0.05),
			PValues:        jk.PValues,
		},
	}
}
