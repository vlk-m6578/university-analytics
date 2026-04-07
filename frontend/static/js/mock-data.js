// Имитация данных из базы данных

const MOCK_DATA = {
    // ========== 1. ОПИСАТЕЛЬНАЯ СТАТИСТИКА (общая по всем опросам) ==========
    descriptive_stats: {
        total_respondents: 347,
        mean_age: 19.8,
        gender_distribution: {
            female: 198,
            male: 142,
            other: 7
        },
        course_distribution: {
            course_1: 112,
            course_2: 98,
            course_3: 87,
            course_4: 42,
            master: 8
        },
        education_form_distribution: {
            budget: 231,
            contract: 116
        },
        age_distribution: {
            min: 17,
            max: 28,
            median: 19,
            mode: 18
        }
    },

    // ========== 2. ПОЛЬЗОВАТЕЛИ И ИХ ОТВЕТЫ ==========
    users: [
        {
            id: 1,
            nickname: "ivan_student",
            age: 19,
            gender: "male",
            course: 2,
            education_form: "budget",
            factor_scores: {
                teaching_quality: 9,
                prestige: 8,
                employment_rate: 9,
                budget_slots: 10,
                location: 7,
                dormitory: 6,
                extracurricular: 5,
                equipment: 8
            }
        },
        {
            id: 2,
            nickname: "anna_2025",
            age: 18,
            gender: "female",
            course: 1,
            education_form: "budget",
            factor_scores: {
                teaching_quality: 10,
                prestige: 9,
                employment_rate: 8,
                budget_slots: 9,
                location: 8,
                dormitory: 7,
                extracurricular: 9,
                equipment: 9
            }
        },
        {
            id: 3,
            nickname: "petr_mgu",
            age: 20,
            gender: "male",
            course: 3,
            education_form: "contract",
            factor_scores: {
                teaching_quality: 8,
                prestige: 10,
                employment_rate: 10,
                budget_slots: 5,
                location: 6,
                dormitory: 5,
                extracurricular: 6,
                equipment: 9
            }
        },
        {
            id: 4,
            nickname: "elena_spb",
            age: 19,
            gender: "female",
            course: 2,
            education_form: "budget",
            factor_scores: {
                teaching_quality: 9,
                prestige: 9,
                employment_rate: 9,
                budget_slots: 8,
                location: 10,
                dormitory: 8,
                extracurricular: 8,
                equipment: 7
            }
        },
        {
            id: 5,
            nickname: "dmitry_phys",
            age: 21,
            gender: "male",
            course: 4,
            education_form: "budget",
            factor_scores: {
                teaching_quality: 10,
                prestige: 9,
                employment_rate: 10,
                budget_slots: 7,
                location: 5,
                dormitory: 6,
                extracurricular: 4,
                equipment: 10
            }
        },
        {
            id: 6,
            nickname: "maria_hse",
            age: 18,
            gender: "female",
            course: 1,
            education_form: "contract",
            factor_scores: {
                teaching_quality: 9,
                prestige: 10,
                employment_rate: 10,
                budget_slots: 6,
                location: 8,
                dormitory: 5,
                extracurricular: 10,
                equipment: 9
            }
        },
        {
            id: 7,
            nickname: "alex_econom",
            age: 20,
            gender: "male",
            course: 3,
            education_form: "budget",
            factor_scores: {
                teaching_quality: 7,
                prestige: 8,
                employment_rate: 9,
                budget_slots: 9,
                location: 7,
                dormitory: 7,
                extracurricular: 6,
                equipment: 6
            }
        },
        {
            id: 8,
            nickname: "olga_design",
            age: 19,
            gender: "female",
            course: 2,
            education_form: "contract",
            factor_scores: {
                teaching_quality: 8,
                prestige: 7,
                employment_rate: 8,
                budget_slots: 7,
                location: 9,
                dormitory: 9,
                extracurricular: 10,
                equipment: 8
            }
        }
    ],

    // ========== 3. РЕКОМЕНДАЦИИ ДЛЯ КАЖДОГО ПОЛЬЗОВАТЕЛЯ ==========
    recommendations_by_user: {
        "ivan_student": {
            user_id: 1,
            nickname: "ivan_student",
            recommendations: [
                { university_id: 1, name: "МГУ им. Ломоносова", city: "Москва", match_percentage: 94, reasons: ["Высокое качество преподавания", "Много бюджетных мест", "Хорошее трудоустройство"] },
                { university_id: 4, name: "МФТИ", city: "Москва", match_percentage: 89, reasons: ["Высокое качество преподавания", "Престижный диплом", "Сильная наука"] },
                { university_id: 5, name: "МИФИ", city: "Москва", match_percentage: 85, reasons: ["Хорошее трудоустройство", "Современное оборудование", "Бюджетные места"] }
            ]
        },
        "anna_2025": {
            user_id: 2,
            nickname: "anna_2025",
            recommendations: [
                { university_id: 1, name: "МГУ им. Ломоносова", city: "Москва", match_percentage: 96, reasons: ["Качество преподавания", "Престиж", "Внеучебная жизнь"] },
                { university_id: 3, name: "НИУ ВШЭ", city: "Москва", match_percentage: 92, reasons: ["Современные программы", "Внеучебная жизнь", "Трудоустройство"] },
                { university_id: 2, name: "СПбГУ", city: "Санкт-Петербург", match_percentage: 88, reasons: ["Классическое образование", "Культурная столица", "Престиж"] }
            ]
        },
        "petr_mgu": {
            user_id: 3,
            nickname: "petr_mgu",
            recommendations: [
                { university_id: 1, name: "МГУ им. Ломоносова", city: "Москва", match_percentage: 95, reasons: ["Престижный диплом", "Трудоустройство", "Качество преподавания"] },
                { university_id: 3, name: "НИУ ВШЭ", city: "Москва", match_percentage: 91, reasons: ["Трудоустройство", "Престиж", "Связи с работодателями"] },
                { university_id: 2, name: "СПбГУ", city: "Санкт-Петербург", match_percentage: 87, reasons: ["Престиж", "Классическое образование", "История"] }
            ]
        },
        "elena_spb": {
            user_id: 4,
            nickname: "elena_spb",
            recommendations: [
                { university_id: 2, name: "СПбГУ", city: "Санкт-Петербург", match_percentage: 97, reasons: ["Расположение в СПб", "Престиж", "Качество образования"] },
                { university_id: 1, name: "МГУ им. Ломоносова", city: "Москва", match_percentage: 85, reasons: ["Престиж", "Качество преподавания"] },
                { university_id: 3, name: "НИУ ВШЭ", city: "Москва", match_percentage: 82, reasons: ["Современные программы", "Трудоустройство"] }
            ]
        },
        "dmitry_phys": {
            user_id: 5,
            nickname: "dmitry_phys",
            recommendations: [
                { university_id: 4, name: "МФТИ", city: "Москва", match_percentage: 98, reasons: ["Физико-математическая школа", "Современное оборудование", "Качество преподавания"] },
                { university_id: 1, name: "МГУ им. Ломоносова", city: "Москва", match_percentage: 90, reasons: ["Фундаментальное образование", "Наука", "Престиж"] },
                { university_id: 5, name: "МИФИ", city: "Москва", match_percentage: 88, reasons: ["Техническое образование", "Лаборатории", "Трудоустройство"] }
            ]
        },
        "maria_hse": {
            user_id: 6,
            nickname: "maria_hse",
            recommendations: [
                { university_id: 3, name: "НИУ ВШЭ", city: "Москва", match_percentage: 96, reasons: ["Внеучебная жизнь", "Современные программы", "Престиж"] },
                { university_id: 1, name: "МГУ им. Ломоносова", city: "Москва", match_percentage: 89, reasons: ["Престиж", "Качество образования"] },
                { university_id: 2, name: "СПбГУ", city: "Санкт-Петербург", match_percentage: 85, reasons: ["Культурная столица", "Классическое образование"] }
            ]
        },
        "alex_econom": {
            user_id: 7,
            nickname: "alex_econom",
            recommendations: [
                { university_id: 1, name: "МГУ им. Ломоносова", city: "Москва", match_percentage: 88, reasons: ["Бюджетные места", "Экономический факультет", "Престиж"] },
                { university_id: 3, name: "НИУ ВШЭ", city: "Москва", match_percentage: 92, reasons: ["Экономика и бизнес", "Трудоустройство", "Бюджетные места"] },
                { university_id: 2, name: "СПбГУ", city: "Санкт-Петербург", match_percentage: 84, reasons: ["Экономическое образование", "Бюджет"] }
            ]
        },
        "olga_design": {
            user_id: 8,
            nickname: "olga_design",
            recommendations: [
                { university_id: 3, name: "НИУ ВШЭ", city: "Москва", match_percentage: 94, reasons: ["Дизайн-образование", "Внеучебная жизнь", "Современный подход"] },
                { university_id: 2, name: "СПбГУ", city: "Санкт-Петербург", match_percentage: 88, reasons: ["Творческая атмосфера", "Расположение", "Культура"] },
                { university_id: 1, name: "МГУ им. Ломоносова", city: "Москва", match_percentage: 82, reasons: ["Фундаментальное образование", "Престиж"] }
            ]
        }
    },

    // ========== 4. РЕЗУЛЬТАТЫ СТАТИСТИЧЕСКИХ РАСЧЕТОВ (общие по всем опросам) ==========
    factor_ranking: {
        all: [
            { id: 1, name: "Качество преподавания", mean: 9.2, median: 9.0, std: 1.2, rank: 1 },
            { id: 2, name: "Престиж диплома", mean: 8.8, median: 9.0, std: 1.4, rank: 2 },
            { id: 3, name: "Трудоустройство после выпуска", mean: 8.5, median: 9.0, std: 1.5, rank: 3 },
            { id: 4, name: "Наличие бюджетных мест", mean: 7.9, median: 8.0, std: 1.8, rank: 4 },
            { id: 5, name: "Расположение вуза", mean: 7.4, median: 8.0, std: 2.0, rank: 5 },
            { id: 6, name: "Наличие общежития", mean: 6.8, median: 7.0, std: 2.1, rank: 6 },
            { id: 7, name: "Стоимость обучения", mean: 6.5, median: 7.0, std: 2.2, rank: 7 },
            { id: 8, name: "Современное оборудование", mean: 6.3, median: 6.0, std: 2.0, rank: 8 },
            { id: 9, name: "Внеучебная жизнь", mean: 6.2, median: 6.0, std: 2.3, rank: 9 }
        ]
    },

    anova_results: [
        { factor_name: "Качество преподавания", group_by: "course", f_statistic: 4.23, p_value: 0.012, significant: true },
        { factor_name: "Престиж диплома", group_by: "course", f_statistic: 3.87, p_value: 0.021, significant: true },
        { factor_name: "Трудоустройство", group_by: "course", f_statistic: 2.15, p_value: 0.089, significant: false },
        { factor_name: "Бюджетные места", group_by: "education_form", f_statistic: 6.12, p_value: 0.001, significant: true }
    ],

    kruskal_results: [
        { factor_name: "Качество преподавания", group_by: "course", h_statistic: 15.34, p_value: 0.008, significant: true },
        { factor_name: "Престиж диплома", group_by: "course", h_statistic: 12.56, p_value: 0.014, significant: true },
        { factor_name: "Бюджетные места", group_by: "education_form", h_statistic: 18.91, p_value: 0.002, significant: true }
    ],

    spearman_correlation: {
        significant_pairs: [
            { factor1: "Качество преподавания", factor2: "Престиж диплома", rho: 0.72, p_value: 0.001 },
            { factor1: "Престиж диплома", factor2: "Трудоустройство", rho: 0.68, p_value: 0.002 },
            { factor1: "Расположение", factor2: "Общежитие", rho: 0.61, p_value: 0.004 }
        ]
    },

    confidence_intervals: {
        "Качество преподавания_by_course": [
            { group: "1 курс", mean: 8.7, ci_lower: 8.2, ci_upper: 9.2, n: 112 },
            { group: "2 курс", mean: 9.1, ci_lower: 8.7, ci_upper: 9.5, n: 98 },
            { group: "3 курс", mean: 9.4, ci_lower: 9.0, ci_upper: 9.8, n: 87 },
            { group: "4 курс", mean: 9.5, ci_lower: 9.1, ci_upper: 9.9, n: 42 }
        ]
    },

    tukey_results: {
        "Качество преподавания": [
            { group1: "1 курс", group2: "2 курс", mean_diff: 0.4, p_value: 0.312, significant: false },
            { group1: "1 курс", group2: "3 курс", mean_diff: 0.7, p_value: 0.028, significant: true },
            { group1: "1 курс", group2: "4 курс", mean_diff: 0.8, p_value: 0.015, significant: true }
        ]
    },

    charts_data: {
        course_bar: {
            labels: ["1 курс", "2 курс", "3 курс", "4 курс", "Магистратура"],
            values: [112, 98, 87, 42, 8]
        }
    },

    system_settings: {
        last_parse_date: "2024-03-15T14:32:00",
        total_respondents: 8,
        api_version: "1.0.0"
    }
};

// Функция для имитации API-запроса
async function mockAPI(endpoint, data = null) {
    return new Promise((resolve) => {
        setTimeout(() => {
            let response = {};
            
            switch(endpoint) {
                case '/api/statistics':
                    response = {
                        descriptive_stats: MOCK_DATA.descriptive_stats,
                        factor_ranking: MOCK_DATA.factor_ranking,
                        anova_results: MOCK_DATA.anova_results,
                        kruskal_results: MOCK_DATA.kruskal_results,
                        spearman_correlation: MOCK_DATA.spearman_correlation,
                        confidence_intervals: MOCK_DATA.confidence_intervals,
                        tukey_results: MOCK_DATA.tukey_results,
                        charts_data: MOCK_DATA.charts_data,
                        system_settings: MOCK_DATA.system_settings
                    };
                    break;
                    
                case '/api/users':
                    response = { users: MOCK_DATA.users };
                    break;
                    
                case '/api/recommendations':
                    if (data && data.nickname) {
                        const recs = MOCK_DATA.recommendations_by_user[data.nickname];
                        if (recs) {
                            response = { success: true, recommendations: recs };
                        } else {
                            response = { success: false, error: "Пользователь не найден", recommendations: null };
                        }
                    } else {
                        response = { success: false, error: "Никнейм не указан", recommendations: null };
                    }
                    break;
                    
                default:
                    response = { error: "Unknown endpoint" };
            }
            
            resolve(response);
        }, 300);
    });
}