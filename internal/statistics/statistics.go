package statistics

type FullStatistics struct {
	Ranking             interface{} `json:"ranking"`
	AnovaBudget         *AnovaResult `json:"anova_budget"`
	AnovaDistance       *AnovaResult `json:"anova_distance"`
	AnovaDormitory      *AnovaResult `json:"anova_dormitory"`
	KruskalWallis       interface{} `json:"kruskal_wallis"`
	Spearman            interface{} `json:"spearman"`
	Tukey               interface{} `json:"tukey"`
	ConfidenceIntervals interface{} `json:"confidence_intervals"`
}

func CalculateAll(responses []map[string]string) *FullStatistics {
	return &FullStatistics{
		Ranking:             RankFactors(responses),
		AnovaBudget:         AnovaOnBudgetImportance(responses),
		AnovaDistance:       AnovaOnDistanceImportance(responses),
		AnovaDormitory:      AnovaOnDormitoryImportance(responses),
		KruskalWallis:       KruskalWallisByDirectionAndCountry(responses),
		Spearman:            SpearmanBudgetImportance(responses),
		Tukey:               TukeyHSDByDirection(responses),
		ConfidenceIntervals: ConfidenceIntervalsForFactors(responses),
	}
}