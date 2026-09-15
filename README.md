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

## Переход существующей БД

Изменять БД с данными учеников можно только в согласованное окно обслуживания
и после отдельного разрешения владельца продукта. До любых DDL подготовьте и
проверьте резервную копию. Нужна отдельная пустая PostgreSQL 15 с именем БД
`lingvar_migration_reference`; это disposable-эталон, не копия ученических
данных. Перед командами перейдите в `backend` и передайте оба URL в окружение
текущей сессии через защищённое секрет-хранилище или механизм окружения CI, не
записывая пароль в историю команд:

```bash
cd backend
test -n "$DATABASE_URL" && test -n "$MIGRATION_REFERENCE_URL"
python -m migrate check-legacy
```

`check-legacy` выполняет только чтение target и сравнивает её с эталоном,
полученным начальной migration в транзакции reference с rollback. При любом
расхождении команда завершится ошибкой без stamp и без изменения target.
Подготовьте отдельное сохраняющее данные исправление, согласуйте его, повторите
проверку. Только при успехе, с остановленным backend и другими писателями, без
стороннего DDL, выполните:

```bash
python -m migrate baseline
python -m migrate upgrade
python -m migrate check
```

`baseline` повторяет сравнение под миграционной advisory-блокировкой и
`ACCESS EXCLUSIVE`-блокировками таблиц, затем в той же транзакции регистрирует
только начальную revision. Он не исправляет неизвестную схему и не может быть
повторён для управляемой БД. Advisory-блокировка не заменяет запрет стороннего
DDL на время перехода.

При Docker target по умолчанию берётся из `DATABASE_URL` сервиса `backend`.
Reference должна быть доступна из сети запускаемого контейнера и уже передана
в окружение оператора. Выполните из корня проекта:

```bash
docker compose run --rm -e MIGRATION_REFERENCE_URL backend python -m migrate check-legacy
docker compose run --rm -e MIGRATION_REFERENCE_URL backend python -m migrate baseline
docker compose run --rm backend python -m migrate upgrade
docker compose run --rm backend python -m migrate check
```

Параметр `-e MIGRATION_REFERENCE_URL` передаёт уже установленную переменную, а
не добавляет секрет в командную историю. Reference не может быть той же БД, что
target, и обязана иметь имя `lingvar_migration_reference`.

## Следующие миграции и откат

Начальная revision неизменяема. Для изменения схемы подготовьте отдельную
dev-БД на текущем `head`, измените ORM и создайте новую revision:

```bash
cd backend
alembic revision --autogenerate -m "short description"
# либо создайте revision вручную
```

Autogenerate требует ручной проверки: особенно переименования, defaults,
ограничения и изменения таблиц с данными. До применения проверьте предлагаемый
DDL, upgrade/downgrade и интеграционные сценарии на отдельной PostgreSQL.
Применяйте только явным `python -m migrate upgrade` до старта backend.

Откат initial revision запрещён: он мог бы удалить учебные данные. Каждая
следующая revision должна иметь явно реализованный и проверенный downgrade,
сохраняющий данные, либо безопасно отказывать. `stamp` не меняет структуру или
данные и не является процедурой отката. При риске отката остановите приложение
и используйте заранее проверенную резервную копию только по согласованной
процедуре.

## Интеграционные проверки миграций

Проверки используют отдельный disposable-контейнер PostgreSQL 15 с БД
`lingvar_task001_test`; они не подключают `database/data` и не используют
обычную БД приложения. В `docker-compose.test.yml` задан отдельный Compose
project `lingvar-migration-tests`, поэтому его запуск не разделяет сеть или
контейнеры со штатным окружением. Запуск из корня репозитория:

```bash
docker compose -p lingvar-migration-tests -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from backend-tests --build backend-tests
docker compose -p lingvar-migration-tests -f docker-compose.test.yml down
```

Контейнер `backend-tests` передаёт backend `TEST_DATABASE_URL` и такой же
`DATABASE_URL`; pytest
перед любым DDL проверяет, что подключён к выделенной тестовой БД. Набор
проверяет новую пустую схему, lifecycle backend и совместимость основного API.
Переход legacy-схемы `create_all` в автоматизацию намеренно не входит: он
проверен вручную на отдельной PostgreSQL с синтетическими данными.
