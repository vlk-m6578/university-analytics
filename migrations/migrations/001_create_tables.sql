-- Таблица для ответов из формы
CREATE TABLE IF NOT EXISTS form_responses (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    raw_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица для вузов
CREATE TABLE IF NOT EXISTS universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(2) NOT NULL,
    lat FLOAT,
    lon FLOAT
);

-- Таблица для специальностей
CREATE TABLE IF NOT EXISTS specialties (
    id SERIAL PRIMARY KEY,
    university_id INT REFERENCES universities(id),
    name VARCHAR(255) NOT NULL,
    pass_score_budget INT,
    pass_score_paid INT,
    has_dormitory BOOLEAN DEFAULT FALSE,
    direction VARCHAR(50)
);

-- Таблица для результатов рекомендаций (логирование)
CREATE TABLE IF NOT EXISTS recommendations_log (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    response_id INT REFERENCES form_responses(id),
    recommended_specialties JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для скорости
CREATE INDEX idx_form_responses_timestamp ON form_responses(timestamp);
CREATE INDEX idx_specialties_university_id ON specialties(university_id);
CREATE INDEX idx_specialties_direction ON specialties(direction);