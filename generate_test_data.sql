TRUNCATE TABLE form_responses RESTART IDENTITY CASCADE;

DO $$
DECLARE
    i INTEGER;
    random_age INTEGER;
    random_gender TEXT;
    random_city TEXT;
    random_score INTEGER;
    random_grade DECIMAL;
    random_budget_importance INTEGER;
    random_dormitory_importance INTEGER;
    random_distance_importance INTEGER;
    random_lang TEXT;
    random_familiar TEXT;
    random_job TEXT;
    random_project TEXT;
    random_interest TEXT;
    random_task TEXT;
    random_benefits TEXT;
    random_study_format TEXT;
    random_direction TEXT;
BEGIN
    FOR i IN 1..100 LOOP
        -- Возраст 18-25
        random_age := 18 + floor(random() * 8);
        
        -- Пол (55% женский)
        IF random() < 0.55 THEN random_gender := 'Женский'; ELSE random_gender := 'Мужской'; END IF;
        
        -- Город (60% Минск)
        IF random() < 0.6 THEN random_city := 'Минск';
        ELSE
            CASE floor(random() * 6)
                WHEN 0 THEN random_city := 'Гомель';
                WHEN 1 THEN random_city := 'Гродно';
                WHEN 2 THEN random_city := 'Витебск';
                WHEN 3 THEN random_city := 'Могилёв';
                WHEN 4 THEN random_city := 'Брест';
                ELSE random_city := 'Новополоцк';
            END CASE;
        END IF;
        
        -- Баллы (200-380)
        random_score := 200 + floor(random() * 180);
        
        -- Аттестат (6.0-10.0)
        random_grade := 6.0 + (random() * 4.0);
        
        -- Важность факторов (для ранжирования)
        random_budget_importance := 1 + floor(random() * 10);
        random_dormitory_importance := 1 + floor(random() * 10);
        random_distance_importance := 1 + floor(random() * 10);
        
        -- Направление (для Тьюки)
        CASE floor(random() * 6)
            WHEN 0 THEN random_direction := 'Backend';
            WHEN 1 THEN random_direction := 'Frontend';
            WHEN 2 THEN random_direction := 'DataScience';
            WHEN 3 THEN random_direction := 'DevOps';
            WHEN 4 THEN random_direction := 'Mobile';
            ELSE random_direction := 'Embedded';
        END CASE;
        
        -- Язык программирования
        CASE floor(random() * 6)
            WHEN 0 THEN random_lang := 'Python';
            WHEN 1 THEN random_lang := 'JavaScript/TypeScript';
            WHEN 2 THEN random_lang := 'Go / Java / C#';
            WHEN 3 THEN random_lang := 'Swift / Kotlin';
            WHEN 4 THEN random_lang := 'C / C++';
            ELSE random_lang := 'Bash / Python (автоматизация, скрипты)';
        END CASE;
        
        -- С чем уже знакомы
        CASE floor(random() * 7)
            WHEN 0 THEN random_familiar := 'Python (pandas, numpy, sklearn)';
            WHEN 1 THEN random_familiar := 'HTML/CSS, JavaScript (React/Vue)';
            WHEN 2 THEN random_familiar := 'Docker, Linux командная строка';
            WHEN 3 THEN random_familiar := 'SQL, PostgreSQL/MySQL, API';
            WHEN 4 THEN random_familiar := 'Swift/Kotlin, Android Studio/Xcode';
            ELSE random_familiar := 'C/C++, Arduino, работа с GPIO';
        END CASE;
        
        -- Должность
        IF random_direction = 'DataScience' THEN random_job := 'Data Scientist';
        ELSIF random_direction = 'Frontend' THEN random_job := 'Frontend-разработчик';
        ELSIF random_direction = 'DevOps' THEN random_job := 'DevOps / SRE инженер';
        ELSIF random_direction = 'Backend' THEN random_job := 'Backend-разработчик';
        ELSIF random_direction = 'Mobile' THEN random_job := 'Mobile-разработчик (iOS/Android)';
        ELSE random_job := 'Embedded / IoT разработчик';
        END IF;
        
        -- Проект
        CASE floor(random() * 6)
            WHEN 0 THEN random_project := 'Анализировал данные (CSV, Excel, графики)';
            WHEN 1 THEN random_project := 'Делал сайт или лендинг';
            WHEN 2 THEN random_project := 'Поднимал сервер с нуля';
            WHEN 3 THEN random_project := 'Писал Telegram бота';
            WHEN 4 THEN random_project := 'Делал мобильное приложение';
            ELSE random_project := 'Собирал робота на Arduino';
        END CASE;
        
        -- Интерес
        CASE floor(random() * 6)
            WHEN 0 THEN random_interest := 'Данные, статистика, ML-модели';
            WHEN 1 THEN random_interest := 'UI, верстка, анимация';
            WHEN 2 THEN random_interest := 'Серверы, сети, CI/CD';
            WHEN 3 THEN random_interest := 'Бизнес-логика, архитектура';
            WHEN 4 THEN random_interest := 'iOS/Android';
            ELSE random_interest := 'C++, микроконтроллеры, IoT';
        END CASE;
        
        -- Задача
        CASE floor(random() * 6)
            WHEN 0 THEN random_task := 'Обучить модель';
            WHEN 1 THEN random_task := 'Сделать адаптивный сайт с нуля';
            WHEN 2 THEN random_task := 'Настроить CI/CD, чтобы код автоматически улетал на сервер после пуша';
            WHEN 3 THEN random_task := 'Спроектировать базу данных и написать API для интернет-магазина';
            WHEN 4 THEN random_task := 'Сделать приложение для iOS/Android с картой и геолокацией';
            ELSE random_task := 'Написать прошивку для умного замка на Arduino';
        END CASE;
        
        -- Формат обучения: 70% очный, 30% заочный
        IF random() < 0.7 THEN random_study_format := 'Очный (дневной)'; ELSE random_study_format := 'Заочный'; END IF;
        
        -- Льготы (10% с льготами)
        IF random() < 0.1 THEN
            CASE floor(random() * 5)
                WHEN 0 THEN random_benefits := 'Золотая медаль (школа)';
                WHEN 1 THEN random_benefits := 'Серебряная медаль (школа)';
                WHEN 2 THEN random_benefits := 'Победитель/призёр республиканской олимпиады';
                WHEN 3 THEN random_benefits := 'Победитель(1 диплом) областной олимпиады';
                ELSE random_benefits := 'Спортивные разряды (от 1 взрослого разряда)';
            END CASE;
        ELSE
            random_benefits := 'У меня нет льгот';
        END IF;
        
        -- Вставка
        INSERT INTO form_responses (timestamp, raw_data) VALUES (
            NOW() - (random() * interval '30 days'),
            jsonb_build_object(
                'Ваш возраст?', random_age::TEXT,
                'Ваш пол?', random_gender,
                'В каком городе Вы живёте?', random_city,
                'Введите сумму баллов ЦТ и ЦЭ (0-300):', random_score::TEXT,
                'Введите средний балл аттестата:', random_grade::TEXT,
                'Насколько для Вас важно поступление на бюджетную форму обучения?', random_budget_importance::TEXT,
                'Насколько для Вас важно наличие общежития?', random_dormitory_importance::TEXT,
                'Насколько для Вас важна близость ВУЗа к дому?', random_distance_importance::TEXT,
                'Какой язык программирования Вам ближе?', random_lang,
                'С чем Вы уже знакомы?', random_familiar,
                'Кем Вы работаете или стажируетесь?', random_job,
                'Какой самый большой проект Вы уже делали?', random_project,
                'С чем Вам интереснее работать?', random_interest,
                'Какую задачу Вы бы выбрали?', random_task,
                'Какой формат обучения Вам подходит?', random_study_format,
                'Какие льготы или индивидуальные достижения у вас есть?', random_benefits,
                'Какое IT-направление вас интересует?', random_direction
            )
        );
    END LOOP;
END $$;