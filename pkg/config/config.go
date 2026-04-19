package config  // ← исправлено: было "package pkg"

import (
	"os"
	"strconv"
)

type Config struct {
	Port int
	DBHost     string
	DBPort     int
	DBUser     string
	DBPassword string
	DBName     string

	GoogleAPIKey      string
	GoogleSpreadsheetID string
}

func Load() *Config {
	return &Config{
		Port: getEnvInt("PORT", 8080),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvInt("DB_PORT", 5432),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "mysecretpassword"),
		DBName:     getEnv("DB_NAME", "university_db"),

		GoogleAPIKey:        getEnv("GOOGLE_API_KEY", ""),
		GoogleSpreadsheetID: getEnv("GOOGLE_SPREADSHEET_ID", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}