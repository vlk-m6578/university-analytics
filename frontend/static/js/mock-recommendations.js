const MOCK_RECOMMENDATIONS = {
  "recommendations": [
    {
      "university_name": "БГУИР",
      "university_city": "Минск",
      "specialty_name": "Программная инженерия",
      "direction": "Embedded",
      "match_score": 92.5,
      "distance_km": 5.2,
      "images": [
        "./static/img/bsuir1.jpeg",
        "./static/img/bsuir2.jpg",
        "./static/img/bsuir3.jpg"
      ]
    },
    {
      "university_name": "БНТУ",
      "university_city": "Минск",
      "specialty_name": "Робототехника",
      "direction": "Embedded",
      "match_score": 87.0,
      "distance_km": 8.1,
      "images": [
        "./static/img/bntu1.jpg",
        "./static/img/bntu2.jpg",
        "./static/img/bntu3.jpg"
      ]
    },
    {
      "university_name": "БГУ",
      "university_city": "Минск",
      "specialty_name": "Физика и информатика",
      "direction": "DataScience",
      "match_score": 78.5,
      "distance_km": 12.3,
      "images": [
        "./static/img/bsu1.jpg",
        "./static/img/bsu2.jpg",
        "./static/img/bsu3.jpg"
      ]
    }
  ]
};

async function mockRecommendationsAPI(endpoint, data = null) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (endpoint === '/api/recommend') {
        resolve(MOCK_RECOMMENDATIONS);
      } else {
        resolve({ error: "Unknown endpoint" });
      }
    }, 300);
  });
}