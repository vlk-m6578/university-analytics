package recommender

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
)

type DirectionScores struct {
	DataScience int
	Frontend    int
	DevOps      int
	Backend     int
	Mobile      int
	Embedded    int
}

type DeepSeekRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type DeepSeekResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// DetermineDirection определяет IT-направление на основе ответов
// Возвращает массив направлений (может быть несколько, если баллы одинаковые)
func DetermineDirection(answers map[string]string, apiKey string) []string {
	scores := DirectionScores{}

	// 1. Вопрос: "С чем Вы уже знакомы?" (мультивыбор)
	familiar := parseMultipleChoice(answers["С чем Вы уже знакомы?"])
	for _, item := range familiar {
		switch {
		case contains(item, "Python"):
			scores.DataScience += 2
		case contains(item, "HTML"), contains(item, "CSS"), contains(item, "JavaScript"), contains(item, "React"), contains(item, "Vue"):
			scores.Frontend += 2
		case contains(item, "Docker"), contains(item, "Linux"), contains(item, "командная строка"):
			scores.DevOps += 2
		case contains(item, "SQL"), contains(item, "PostgreSQL"), contains(item, "MySQL"), contains(item, "API"):
			scores.Backend += 2
		case contains(item, "Swift"), contains(item, "Kotlin"), contains(item, "Android"), contains(item, "Xcode"):
			scores.Mobile += 2
		case contains(item, "C/C++"), contains(item, "Arduino"), contains(item, "GPIO"):
			scores.Embedded += 2
		case isOtherOption(item):
			customText := extractCustomText(item)
			if customText != "" && apiKey != "" {
				direction := getDirectionFromAI(customText, apiKey)
				addScoreByDirection(&scores, direction, 2)
			}
		}
	}

	// 2. Вопрос: "Кем Вы работаете или стажируетесь?" (один выбор)
	job := answers["Кем Вы работаете или стажируетесь?"]
	switch {
	case contains(job, "Data Scientist"):
		scores.DataScience += 5
	case contains(job, "Frontend"):
		scores.Frontend += 5
	case contains(job, "DevOps"), contains(job, "SRE"):
		scores.DevOps += 5
	case contains(job, "Backend"):
		scores.Backend += 5
	case contains(job, "Mobile"):
		scores.Mobile += 5
	case contains(job, "Embedded"), contains(job, "IoT"):
		scores.Embedded += 5
	case contains(job, "Fullstack"):
		scores.Frontend += 3
		scores.Backend += 3
	}

	// 3. Вопрос: "Какой самый большой проект Вы уже делали?" (один выбор)
	project := answers["Какой самый большой проект Вы уже делали?"]
	if isOtherOption(project) {
		customText := extractCustomText(project)
		if customText != "" && apiKey != "" {
			direction := getDirectionFromAI(customText, apiKey)
			addScoreByDirection(&scores, direction, 4)
		}
	} else {
		switch {
		case contains(project, "Анализировал данные"), contains(project, "CSV"), contains(project, "Excel"), contains(project, "графики"):
			scores.DataScience += 4
		case contains(project, "сайт"), contains(project, "лендинг"):
			scores.Frontend += 4
		case contains(project, "сервер"):
			scores.DevOps += 4
		case contains(project, "Telegram бота"):
			scores.Backend += 4
		case contains(project, "мобильное приложение"):
			scores.Mobile += 4
		case contains(project, "робот"), contains(project, "Arduino"):
			scores.Embedded += 4
		}
	}

	// 4. Вопрос: "С чем Вам интереснее работать?" (один выбор)
	interest := answers["С чем Вам интереснее работать?"]
	switch {
	case contains(interest, "Данные"), contains(interest, "статистика"), contains(interest, "ML"), contains(interest, "модели"):
		scores.DataScience += 5
	case contains(interest, "UI"), contains(interest, "верстка"), contains(interest, "анимация"):
		scores.Frontend += 5
	case contains(interest, "Серверы"), contains(interest, "сети"), contains(interest, "CI/CD"):
		scores.DevOps += 5
	case contains(interest, "Бизнес-логика"), contains(interest, "архитектура"):
		scores.Backend += 5
	case contains(interest, "iOS"), contains(interest, "Android"):
		scores.Mobile += 5
	case contains(interest, "C++"), contains(interest, "микроконтроллеры"), contains(interest, "IoT"):
		scores.Embedded += 5
	}

	// 5. Вопрос: "Какую задачу Вы бы выбрали?" (один выбор)
	task := answers["Какую задачу Вы бы выбрали?"]
	switch {
	case contains(task, "Обучить модель"):
		scores.DataScience += 5
	case contains(task, "адаптивный сайт"):
		scores.Frontend += 5
	case contains(task, "CI/CD"), contains(task, "автоматически улетал на сервер"):
		scores.DevOps += 5
	case contains(task, "базу данных"), contains(task, "API"), contains(task, "интернет-магазина"):
		scores.Backend += 5
	case contains(task, "iOS/Android"), contains(task, "мобильное приложение"):
		scores.Mobile += 5
	case contains(task, "прошивку"), contains(task, "Arduino"), contains(task, "умного замка"):
		scores.Embedded += 5
	}

	// 6. Вопрос: "Какой язык программирования Вам ближе?" (один выбор)
	lang := answers["Какой язык программирования Вам ближе?"]
	switch {
	case contains(lang, "Python"):
		scores.DataScience += 4
	case contains(lang, "JavaScript"), contains(lang, "TypeScript"):
		scores.Frontend += 4
	case contains(lang, "Go"), contains(lang, "Java"), contains(lang, "C#"):
		scores.Backend += 4
	case contains(lang, "Swift"), contains(lang, "Kotlin"):
		scores.Mobile += 4
	case contains(lang, "C/C++"):
		scores.Embedded += 4
	case contains(lang, "Bash"), contains(lang, "автоматизация"):
		scores.DevOps += 4
	}

	return getBestDirections(scores)
}

func parseMultipleChoice(s string) []string {
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}
	return parts
}

func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

func isOtherOption(s string) bool {
	return contains(s, "Другое:") || contains(s, "Другое :")
}

func extractCustomText(s string) string {
	parts := strings.Split(s, "Другое")
	if len(parts) < 2 {
		return ""
	}
	text := strings.TrimPrefix(parts[1], ":")
	text = strings.TrimPrefix(text, " :")
	return strings.TrimSpace(text)
}

func getDirectionFromAI(text, apiKey string) string {
	url := "https://api.deepseek.com/v1/chat/completions"

	prompt := `Определи, к какому IT-направлению из списка относится следующий проект или описание: 
"` + text + `"
Варианты: DataScience, Frontend, DevOps, Backend, Mobile, Embedded.
Ответь только одним словом. Ничего другого не пиши.`

	reqBody := DeepSeekRequest{
		Model: "deepseek-chat",
		Messages: []Message{
			{Role: "system", Content: "Ты эксперт. Отвечай только одним словом: DataScience, Frontend, DevOps, Backend, Mobile, Embedded."},
			{Role: "user", Content: prompt},
		},
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "Backend"
	}
	defer resp.Body.Close()

	var deepResp DeepSeekResponse
	json.NewDecoder(resp.Body).Decode(&deepResp)

	if len(deepResp.Choices) > 0 {
		direction := strings.TrimSpace(deepResp.Choices[0].Message.Content)
		if isValidDirection(direction) {
			return direction
		}
	}
	return "Backend"
}

func isValidDirection(direction string) bool {
	switch direction {
	case "DataScience", "Frontend", "DevOps", "Backend", "Mobile", "Embedded":
		return true
	}
	return false
}

func addScoreByDirection(scores *DirectionScores, direction string, points int) {
	switch direction {
	case "DataScience":
		scores.DataScience += points
	case "Frontend":
		scores.Frontend += points
	case "DevOps":
		scores.DevOps += points
	case "Backend":
		scores.Backend += points
	case "Mobile":
		scores.Mobile += points
	case "Embedded":
		scores.Embedded += points
	}
}

// getBestDirections возвращает все направления с максимальным баллом
func getBestDirections(scores DirectionScores) []string {
	// Находим максимальный балл
	maxScore := scores.DataScience
	if scores.Frontend > maxScore {
		maxScore = scores.Frontend
	}
	if scores.DevOps > maxScore {
		maxScore = scores.DevOps
	}
	if scores.Backend > maxScore {
		maxScore = scores.Backend
	}
	if scores.Mobile > maxScore {
		maxScore = scores.Mobile
	}
	if scores.Embedded > maxScore {
		maxScore = scores.Embedded
	}

	// Собираем все направления с максимальным баллом
	var bestDirections []string
	if scores.DataScience == maxScore {
		bestDirections = append(bestDirections, "DataScience")
	}
	if scores.Frontend == maxScore {
		bestDirections = append(bestDirections, "Frontend")
	}
	if scores.DevOps == maxScore {
		bestDirections = append(bestDirections, "DevOps")
	}
	if scores.Backend == maxScore {
		bestDirections = append(bestDirections, "Backend")
	}
	if scores.Mobile == maxScore {
		bestDirections = append(bestDirections, "Mobile")
	}
	if scores.Embedded == maxScore {
		bestDirections = append(bestDirections, "Embedded")
	}

	return bestDirections
}