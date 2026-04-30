package models

import(
	"time"
)

type University struct {
    ID            int     `json:"id" db:"id"`
    Name          string  `json:"name" db:"name"`
    City          string  `json:"city" db:"city"`
    Lat           float64 `json:"lat" db:"lat"`
    Lon           float64 `json:"lon" db:"lon"`
    HasDormitory  bool    `json:"has_dormitory" db:"has_dormitory"` 
}

type Specialty struct {
    ID              int        `json:"id" db:"id"`
    UniversityID    int        `json:"university_id" db:"university_id"`
    University      University `json:"university"`
    Name            string     `json:"name" db:"name"`
    PassScoreBudget int        `json:"pass_score_budget" db:"pass_score_budget"`
    PassScorePaid   int        `json:"pass_score_paid" db:"pass_score_paid"`
    Direction       string     `json:"direction" db:"direction"`
    StudyFormat     string     `json:"study_format" db:"study_format"`
    MedalAdmission  bool       `json:"medal_admission" db:"medal_admission"`
}


type FormResponse struct {
    ID        int       `json:"id" db:"id"`
    SessionID string    `json:"session_id" db:"session_id"`
    Timestamp time.Time `json:"timestamp" db:"timestamp"`

    Age                string   `json:"age"`
    Gender             string   `json:"gender"`
    AvgScore           int      `json:"avg_score"`
    City               string   `json:"city"`
    Direction          string   `json:"direction"`
    StudyFormat        string   `json:"study_format"`
    BudgetNeeded       bool     `json:"budget_needed"`
    DormitoryNeeded    bool     `json:"dormitory_needed"`
    DistanceImportance int      `json:"distance_importance"`
    Benefits           Benefits `json:"benefits"`
}
//для крутых
type Benefits struct {
    GoldMedal          bool `json:"gold_medal"`
    SilverMedal        bool `json:"silver_medal"`
    RepublicanOlympiad bool `json:"republican_olympiad"`
    RegionalOlympiad   bool `json:"regional_olympiad"`
    SportsRank         bool `json:"sports_rank"`
    UniversityDiploma  bool `json:"university_diploma"`
}

type TopRecommendationsResponse struct {
	Recommendations []Recommendation `json:"recommendations"`
}


type Recommendation struct {
    UniversityName string  `json:"university_name"`
    UniversityCity string  `json:"university_city"`
    SpecialtyName  string  `json:"specialty_name"`
    Direction      string  `json:"direction"`
    MatchScore     float64 `json:"match_score"`
    DistanceKm     float64 `json:"distance_km"`
}
type RecommendRequest struct {
    Age                string   `json:"age"`
    Gender             string   `json:"gender"`
    AvgScore           int      `json:"avg_score"`
    City               string   `json:"city"`
    Direction          string   `json:"direction"`
    StudyFormat        string   `json:"study_format"`
    BudgetNeeded       bool     `json:"budget_needed"`
    DormitoryNeeded    bool     `json:"dormitory_needed"`
    DistanceImportance int      `json:"distance_importance"`
    Benefits           Benefits `json:"benefits"`
}

type OnboardingQuestion struct {
	ID       int      `json:"id"`
	Text     string   `json:"text"`      
	Options  []Option `json:"options"`   
}

type Option struct {
	Text      string `json:"text"`     
	Direction string `json:"direction"` 
	Weight    int    `json:"weight"`   
}

type OnboardingResult struct {
	Direction     string            `json:"direction"`     
	Confidence    float64           `json:"confidence"`    
	Scores        map[string]int    `json:"scores"`        
}

type WebhookPayload struct {
	Timestamp string            `json:"timestamp"`
	RowNumber int               `json:"rowNumber"`
	Answers   map[string]string `json:"answers"`
}
type FormResponseDB struct {
	ID        int       `json:"id" db:"id"`
	Timestamp time.Time `json:"timestamp" db:"timestamp"`
	RawData   []byte    `json:"raw_data" db:"raw_data"` 
}

type FactorRankingItem struct {
    FactorName string  `json:"factor_name"` 
    Average    float64 `json:"average"`     
    Count      int     `json:"count"`     
    Rank       int     `json:"rank"`       
}

type RankingResult struct {
    Factors []FactorRankingItem `json:"factors"` 
}


type AnovaResult struct {
    GroupName    string  `json:"group_name"`   
    FValue       float64 `json:"f_value"`       
    PValue       float64 `json:"p_value"`      
    Significant  bool    `json:"significant"`  
    Groups       []AnovaGroup `json:"groups"`  
}

type AnovaGroup struct {
    Name   string  `json:"name"`
    Mean   float64 `json:"mean"`
    StdDev float64 `json:"std_dev"`
    Count  int     `json:"count"`
}


