package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/km/university-analytics/internal/models"
)

func (h *Handler) RecommendHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.RecommendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Если есть answers, определяем направление автоматически
	if req.Answers != nil && len(req.Answers) > 0 {
		recommendations, err := h.Recommender.GetRecommendationsForAnswers(req.Answers, h.Cfg.DeepSeekAPIKey, req)
		if err != nil {
			http.Error(w, "Failed to get recommendations", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"recommendations": recommendations,
		})
		return
	}

	// Если нет answers, используем direction из запроса
	recommendations, err := h.Recommender.GetRecommendationsByDirection(req, req.Direction)
	if err != nil {
		http.Error(w, "Failed to get recommendations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"recommendations": recommendations,
	})
}

// GetRecommendationsBySession возвращает рекомендации по session_id
func (h *Handler) GetRecommendationsBySession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		http.Error(w, "session_id required", http.StatusBadRequest)
		return
	}

	// Получаем ответы по session_id
	answers, err := h.Repo.GetFormResponsesBySessionID(sessionID)
	if err != nil {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}

	// Конвертируем ответы в RecommendRequest
	req := convertAnswersToRecommendRequest(answers)

	// Получаем рекомендации
	recommendations, err := h.Recommender.GetRecommendationsForAnswers(answers, h.Cfg.DeepSeekAPIKey, req)
	if err != nil {
		http.Error(w, "Failed to get recommendations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"session_id":     sessionID,
		"recommendations": recommendations,
	})
}

// convertAnswersToRecommendRequest преобразует map ответов в RecommendRequest
func convertAnswersToRecommendRequest(answers map[string]string) models.RecommendRequest {
	req := models.RecommendRequest{}

	// Базовые поля
	avgScore, _ := strconv.Atoi(answers["Введите сумму баллов ЦТ и ЦЭ (0-300):"])
	req.AvgScore = float64(avgScore)
	
	avgGrade, _ := strconv.ParseFloat(answers["Введите средний балл аттестата:"], 64)
	req.AvgGrade = avgGrade
	
	req.City = answers["В каком городе Вы живёте?"]
	req.StudyFormat = answers["Какой формат обучения Вам подходит?"]
	
	budgetImp, _ := strconv.Atoi(answers["Насколько для Вас важно поступление на бюджетную форму обучения?"])
	req.BudgetImportance = budgetImp
	
	dormImp, _ := strconv.Atoi(answers["Насколько для Вас важно наличие общежития?"])
	req.DormitoryImportance = dormImp
	
	distanceImp, _ := strconv.Atoi(answers["Насколько для Вас важна близость ВУЗа к дому?"])
	req.DistanceImportance = distanceImp

	// Парсим льготы
	benefitsStr := answers["Какие льготы или индивидуальные достижения у вас есть?"]
	req.Benefits = parseBenefits(benefitsStr)

	// Направление определится позже через DetermineDirection
	req.Direction = ""

	// Answers не заполняем, чтобы не было бесконечной рекурсии
	req.Answers = nil

	return req
}

// parseBenefits парсит строку с льготами
func parseBenefits(benefitsStr string) models.Benefits {
	benefits := models.Benefits{}
	if benefitsStr == "" {
		return benefits
	}

	lower := strings.ToLower(benefitsStr)
	benefits.GoldMedal = strings.Contains(lower, "золотая медаль")
	benefits.SilverMedal = strings.Contains(lower, "серебряная медаль")
	benefits.RepublicanOlympiad = strings.Contains(lower, "республиканской олимпиады")
	benefits.RegionalOlympiad = strings.Contains(lower, "областной олимпиады")
	benefits.FirstSportsRank = strings.Contains(lower, "спортивные разряды") || strings.Contains(lower, "1 взрослый")
	benefits.UniversityDiploma = strings.Contains(lower, "универсиады")

	return benefits
}