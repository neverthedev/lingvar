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

## Создание администратора

После применения миграций администратор создаётся отдельной командой из корня
репозитория. Команда сама запросит пароль и подтверждение без отображения ввода:

```bash
docker compose run --rm backend python -m create_admin \
  --username admin \
  --email admin@example.com
```

Не добавляйте пароль в аргументы команды, shell history, исходный код или
`docker-compose.yml`. Команда не изменяет существующего пользователя, если имя
или email уже заняты.

## Интеграционные проверки

Проверки используют отдельный disposable-контейнер PostgreSQL 15 с БД
`lingvar_test`; они не подключают `database/data`, URL, учётные данные
или сеть штатной БД приложения. В `docker-compose.test.yml` задан отдельный
Compose-проект `lingvar-tests`, поэтому его запуск не разделяет
контейнеры со штатным окружением. Backend-проверки запускаются из корня
репозитория отдельно:

```bash
docker compose -p lingvar-tests -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from backend-tests --build backend-tests
```

Браузерный Playwright-сценарий с настоящими frontend, backend и тестовой БД
запускается отдельной командой; не запускайте оба набора одновременно, поскольку
они используют одну disposable-схему:

```bash
docker compose -p lingvar-tests -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from browser-tests --build browser-tests
```

После каждого набора очистите только тестовый Compose-проект:

```bash
docker compose -p lingvar-tests -f docker-compose.test.yml down --volumes --remove-orphans
```

Контейнер `backend-tests` передаёт backend `TEST_DATABASE_URL` и такой же
`DATABASE_URL`; pytest перед любым DDL проверяет, что подключён к выделенной
тестовой БД, и очищает её схему `public` перед каждым тестом и после него.
Тест жизненного цикла начинает с пустой схемы и явно применяет текущую миграцию
командой `python -m migrate upgrade`; HTTP-сценарии также вызывают эту команду
до запуска API. Проверки отказа при недоступной БД и запрета прямого `stamp`
работают без применения схемы. Обычный backend не подготавливает схему при старте.

Backend-набор проверяет новую пустую схему, lifecycle backend, HTTP-сценарии и
разграничение ролей. Браузерный набор проверяет вход и маршрутизацию администратора
и ученика. Указанная команда `down` благодаря явному project name не затрагивает
штатный Compose-проект или данные учеников.
