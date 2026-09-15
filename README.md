# Lingvar

## Локальный запуск

Нужны Docker и Docker Compose. Схема PostgreSQL подготавливается отдельной
миграционной командой до запуска backend: приложение не создаёт и не обновляет
таблицы самостоятельно. Для запуска вне Docker обязательно явно задать
`DATABASE_URL` с PostgreSQL; SQLite fallback больше нет.

Для новой пустой БД:

```bash
docker compose build backend
docker compose up -d postgres
docker compose run --rm backend python -m migrate upgrade
docker compose up -d backend frontend
```

После этого frontend доступен на `http://localhost:8087`, backend — на
`http://localhost:8000`. Проверить состояние схемы можно командой:

```bash
docker compose run --rm backend python -m migrate check
```

Если `check` не проходит, backend намеренно не запускается. Сначала исправьте
подготовку схемы явной миграционной командой; не используйте `create_all`,
`alembic stamp` или ручное создание записи в `alembic_version`.

## Интеграционные проверки backend

Проверки используют отдельный disposable-контейнер PostgreSQL 15 с БД
`lingvar_test`; они не подключают `database/data`, URL, учётные данные
или сеть штатной БД приложения. В `docker-compose.test.yml` задан отдельный
Compose-проект `lingvar-tests`, поэтому его запуск не разделяет
контейнеры со штатным окружением. Запускайте проверки из корня репозитория:

```bash
docker compose -p lingvar-tests -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from backend-tests --build backend-tests
docker compose -p lingvar-tests -f docker-compose.test.yml down
```

Контейнер `backend-tests` передаёт backend `TEST_DATABASE_URL` и такой же
`DATABASE_URL`; pytest перед любым DDL проверяет, что подключён к выделенной
тестовой БД, и очищает её схему `public` перед каждым тестом и после него.
Тест жизненного цикла начинает с пустой схемы и явно применяет текущую миграцию
командой `python -m migrate upgrade`; HTTP-сценарии также вызывают эту команду
до запуска API. Проверки отказа при недоступной БД и запрета прямого `stamp`
работают без применения схемы. Обычный backend не подготавливает схему при старте.

Набор проверяет новую пустую схему, lifecycle backend и основной HTTP-сценарий.
После завершения выполните указанную `down` только для тестового проекта; она не
затрагивает штатный Compose-проект или данные учеников. Контур оставляет место
для будущего браузерного сценария, но браузерный раннер и frontend-проверки
сейчас не настроены.
