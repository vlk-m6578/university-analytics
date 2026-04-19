package onboarding

// "DevOps", "Backend", "Frontend", "DataScience", "Mobile", "Embedded"
func DetermineDirection(answers map[string]string) string {
	scores := make(map[string]int)

	for question, answer := range answers {
		switch question {
		case "С чем Вы уже знакомы?":
			addTechScores(scores, answer)
		case "Какой язык программирования Вам ближе?":
			addLanguageScores(scores, answer)
		case "Какую задачу Вы бы выбрали?":
			addTaskScores(scores, answer)
		case "С чем Вам интереснее работать?":
			addInterestScores(scores, answer)
		}
	}

	best := ""
	maxScore := 0
	for dir, score := range scores {
		if score > maxScore {
			maxScore = score
			best = dir
		}
	}

	if best == "" {
		return "Backend" 
	}
	return best
}

func addTechScores(scores map[string]int, answer string) {
	if contains(answer, "Python") {
		scores["DataScience"] += 3
	}
	if contains(answer, "JavaScript") {
		scores["Frontend"] += 3
	}
	if contains(answer, "Docker") || contains(answer, "Linux") {
		scores["DevOps"] += 3
	}
	if contains(answer, "SQL") {
		scores["Backend"] += 3
	}
	if contains(answer, "Swift") || contains(answer, "Kotlin") {
		scores["Mobile"] += 3
	}
	if contains(answer, "C++") || contains(answer, "Arduino") {
		scores["Embedded"] += 3
	}
}

func addLanguageScores(scores map[string]int, answer string) {
	switch answer {
	case "Python":
		scores["DataScience"] += 5
	case "JavaScript/TypeScript":
		scores["Frontend"] += 5
	case "Go / Java / C#":
		scores["Backend"] += 5
	case "Swift / Kotlin":
		scores["Mobile"] += 5
	case "C / C++":
		scores["Embedded"] += 5
	case "Bash / Python (автоматизация)":
		scores["DevOps"] += 5
	}
}

func addTaskScores(scores map[string]int, answer string) {
	switch answer {
	case "Обучить модель":
		scores["DataScience"] += 5
	case "Сделать адаптивный сайт":
		scores["Frontend"] += 5
	case "Настроить CI/CD":
		scores["DevOps"] += 5
	case "Спроектировать базу данных и API":
		scores["Backend"] += 5
	case "Сделать мобильное приложение":
		scores["Mobile"] += 5
	case "Написать прошивку для Arduino":
		scores["Embedded"] += 5
	}
}

func addInterestScores(scores map[string]int, answer string) {
	switch answer {
	case "Данные, статистика, ML-модели":
		scores["DataScience"] += 4
	case "UI, верстка, анимация":
		scores["Frontend"] += 4
	case "Серверы, сети, CI/CD":
		scores["DevOps"] += 4
	case "Бизнес-логика, архитектура":
		scores["Backend"] += 4
	case "iOS/Android":
		scores["Mobile"] += 4
	case "C++, микроконтроллеры, IoT":
		scores["Embedded"] += 4
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || findSubstring(s, substr)))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}