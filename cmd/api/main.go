package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/km/university-analytics/internal/handlers"
	"github.com/km/university-analytics/internal/repository"
	"github.com/km/university-analytics/internal/router"
	"github.com/km/university-analytics/internal/statistics"
	"github.com/km/university-analytics/pkg/config"
)

func main() {
	cfg := config.Load()

	repo, err := repository.New(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer repo.Close()


	//временное говно

	responses, err := repo.GetFormResponsesAsMaps()
	if err != nil {
    log.Printf("Error reading responses: %v", err)
} else if len(responses) > 0 {
    anovaResult := statistics.AnovaOnBudgetImportance(responses)
    log.Printf("=== ANOVA РЕЗУЛЬТАТ ===")
    log.Printf("  Группа: %s", anovaResult.GroupName)
    log.Printf("  F = %.4f", anovaResult.FValue)
    log.Printf("  p = %.4f", anovaResult.PValue)
    log.Printf("  Статистически значимо: %v", anovaResult.Significant)
    for _, g := range anovaResult.Groups {
        log.Printf("  %s: средний балл = %.1f (±%.1f), n=%d", g.Name, g.Mean, g.StdDev, g.Count)
    }
}


if err != nil {
    log.Printf("Error reading responses: %v", err)
} else if len(responses) > 0 {
    spearman := statistics.SpearmanBudgetImportance(responses)
    log.Printf("=== КОРРЕЛЯЦИЯ СПИРМЕНА ===")
    log.Printf("  %s ↔ %s", spearman.VariableX, spearman.VariableY)
    log.Printf("  ρ = %.4f", spearman.Rho)
    log.Printf("  p = %.4f", spearman.PValue)
    log.Printf("  Статистически значимо: %v", spearman.Significant)
    log.Printf("  Сила связи: %s", spearman.Strength)
    log.Printf("  Направление: %s", spearman.Direction)
    log.Printf("  Количество наблюдений: %d", spearman.Count)
}

tukey := statistics.TukeyHSDByDirection(responses)
log.Printf("=== КРИТЕРИЙ ТЬЮКИ ===")
log.Printf("Группы: %v", tukey.Groups)
log.Printf("Средние: %+v", tukey.GroupMeans)
for _, p := range tukey.Pairs {
    log.Printf("%s vs %s: разница = %.1f, значимо = %v, p = %.4f", p.Group1, p.Group2, p.MeanDiff, p.Significant, p.PValue)
}




confidence := statistics.ConfidenceIntervalsForFactors(responses)
log.Printf("=== ДОВЕРИТЕЛЬНЫЕ ИНТЕРВАЛЫ (95%) ===")
for _, ci := range confidence.Intervals {
    log.Printf("  %s: среднее = %.2f, 95%% ДИ = [%.2f, %.2f], n=%d", ci.FactorName, ci.Mean, ci.Lower, ci.Upper, ci.Count)
}



//конец говна
	h := handlers.NewHandler(repo)

	r := router.NewRouter(h)

	log.Printf("Server starting on port %d", cfg.Port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", cfg.Port), r); err != nil {
		log.Fatal("Server failed:", err)
	}
}