package main

import (
	"log"

	"github.com/km/university-analytics/internal/models"
	"github.com/km/university-analytics/internal/repository"
	"github.com/km/university-analytics/pkg/config"
)

func main() {
	cfg := config.Load()

	repo, err := repository.New(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer repo.Close()

	universities := []models.University{

		{Name: "БГУИР", City: "Минск", Country: "BY", Lat: 53.9025, Lon: 27.5618, HasDormitory: true},
		{Name: "БНТУ", City: "Минск", Country: "BY", Lat: 53.9175, Lon: 27.6000, HasDormitory: true},
		{Name: "БГУ", City: "Минск", Country: "BY", Lat: 53.8938, Lon: 27.5467, HasDormitory: true},
		{Name: "БГЭУ", City: "Минск", Country: "BY", Lat: 53.9100, Lon: 27.5700, HasDormitory: true},
		{Name: "БГАТУ", City: "Минск", Country: "BY", Lat: 53.8700, Lon: 27.6100, HasDormitory: true},
		{Name: "БГПУ", City: "Минск", Country: "BY", Lat: 53.9200, Lon: 27.5900, HasDormitory: true},
		{Name: "МИТСО", City: "Минск", Country: "BY", Lat: 53.9150, Lon: 27.5550, HasDormitory: true},
		{Name: "ИСЗ", City: "Минск", Country: "BY", Lat: 53.9050, Lon: 27.5800, HasDormitory: true},
		{Name: "Минский инновационный университет", City: "Минск", Country: "BY", Lat: 53.9000, Lon: 27.5650, HasDormitory: true},
		{Name: "ГГУ им. Скорины", City: "Гомель", Country: "BY", Lat: 52.4345, Lon: 30.9754, HasDormitory: true},
		{Name: "БелГУТ", City: "Гомель", Country: "BY", Lat: 52.4200, Lon: 31.0000, HasDormitory: true},
		{Name: "ГГТУ им. Сухого", City: "Гомель", Country: "BY", Lat: 52.4400, Lon: 31.0100, HasDormitory: true},
		{Name: "ГрГУ им. Купалы", City: "Гродно", Country: "BY", Lat: 53.6775, Lon: 23.8325, HasDormitory: true},
		{Name: "ВГУ им. Машерова", City: "Витебск", Country: "BY", Lat: 55.1900, Lon: 30.2000, HasDormitory: true},
		{Name: "ВГТУ", City: "Витебск", Country: "BY", Lat: 55.1800, Lon: 30.2100, HasDormitory: true},
		{Name: "МГУ им. Кулешова", City: "Могилёв", Country: "BY", Lat: 53.9000, Lon: 30.3300, HasDormitory: true},
		{Name: "МГТУ", City: "Могилёв", Country: "BY", Lat: 53.9100, Lon: 30.3400, HasDormitory: true},
		{Name: "БрГУ им. Пушкина", City: "Брест", Country: "BY", Lat: 52.0975, Lon: 23.6878, HasDormitory: true},
		{Name: "БрГТУ", City: "Брест", Country: "BY", Lat: 52.0900, Lon: 23.7000, HasDormitory: true},

		{Name: "ПГУ", City: "Новополоцк", Country: "BY", Lat: 55.5300, Lon: 28.6500, HasDormitory: true},

		// ========== РОССИЯ (12 вузов) ==========
		{Name: "МГУ им. Ломоносова", City: "Москва", Country: "RU", Lat: 55.7038, Lon: 37.5307, HasDormitory: true},
		{Name: "МФТИ (Физтех)", City: "Долгопрудный", Country: "RU", Lat: 55.9300, Lon: 37.5200, HasDormitory: true},
		{Name: "НИУ ВШЭ", City: "Москва", Country: "RU", Lat: 55.7560, Lon: 37.6380, HasDormitory: true},
		{Name: "МГТУ им. Баумана", City: "Москва", Country: "RU", Lat: 55.7650, Lon: 37.6850, HasDormitory: true},
		{Name: "МИСиС", City: "Москва", Country: "RU", Lat: 55.7650, Lon: 37.6250, HasDormitory: true},
		{Name: "МИФИ", City: "Москва", Country: "RU", Lat: 55.6500, Lon: 37.6800, HasDormitory: true},

		{Name: "СПбГУ", City: "Санкт-Петербург", Country: "RU", Lat: 59.9398, Lon: 30.3149, HasDormitory: true},
		{Name: "ИТМО", City: "Санкт-Петербург", Country: "RU", Lat: 59.9544, Lon: 30.3076, HasDormitory: true},
		{Name: "СПбПУ (Политех)", City: "Санкт-Петербург", Country: "RU", Lat: 60.0070, Lon: 30.3730, HasDormitory: true},

		{Name: "НГУ", City: "Новосибирск", Country: "RU", Lat: 54.8420, Lon: 83.1060, HasDormitory: true},
		{Name: "УрФУ", City: "Екатеринбург", Country: "RU", Lat: 56.8400, Lon: 60.6200, HasDormitory: true},
		{Name: "КФУ", City: "Казань", Country: "RU", Lat: 55.7900, Lon: 49.1300, HasDormitory: true},
	}

	for _, u := range universities {
		id, err := repo.SaveUniversity(u)
		if err != nil {
			log.Printf("Failed to save %s: %v", u.Name, err)
			continue
		}
		log.Printf("Saved %s (ID: %d) [%.4f, %.4f]", u.Name, id, u.Lat, u.Lon)
	}

	log.Printf("Done! %d universities added (20 BY + 12 RU)", len(universities))
}