# Текущая архитектура Lingvar

Карта фактического кода: текстовые упражнения, API, данные и окружение.
Новая схема и backend проверены на отдельной тестовой PostgreSQL; состояние
действующей БД здесь не описывается. Продуктовая основа —
[модель обучения](LEARNING_MODEL.md), действующие ограничения —
[решения](DECISIONS.md), порядок сопровождения карты —
[процесс разработки](DEVELOPMENT_PROCESS.md).

## Компоненты и границы

```mermaid
flowchart LR
    Browser[Браузер: страницы React и AuthContext] -->|HTTP JSON / Bearer JWT| API[FastAPI: routers]
    API --> Auth[services/auth: JWT и пользователь]
    API --> DB[services/database: SQLAlchemy Session]
    Auth --> DB
    DB --> PG[(PostgreSQL)]
    CLI[Явный CLI миграций] --> Alembic[Alembic revisions]
    Alembic --> PG
    CLI --> Reference[(Отдельная PostgreSQL БД эталона)]
    AdminCLI[Явный CLI создания администратора] --> Auth
    AdminCLI --> DB
    Next[Next.js: App Router и layout] --> Browser
```

**Frontend.** [Next.js 14, React 18, TypeScript и Tailwind](../frontend/package.json).
[App Router](../frontend/src/app/) задаёт реальные маршруты; корневой
[layout](../frontend/src/app/layout.tsx) подключает `AuthProvider`, внутри которого
[RoleRouteGuard](../frontend/src/components/RoleRouteGuard.tsx) разделяет учебные
и административные экранные маршруты после восстановления пользователя.
Каталог упражнений и динамический маршрут
[`/exercises/[slug]`](../frontend/src/app/exercises/[slug]/page.tsx) получают
типизированные данные backend, а
[ExerciseRenderer](../frontend/src/components/exercises/ExerciseRenderer.tsx)
выбирает учебный компонент по `type_code`. Административные маршруты
[`/admin/exercises`](../frontend/src/app/admin/exercises/) используют общую форму
и реестр типовых редакторов из
[ExerciseEditor](../frontend/src/components/admin/ExerciseEditor.tsx); произвольного
JSON-редактора нет. Состояние старых механик хранится в React, состояние
`fill_blanks` — в краткоживущей серверной сессии.
[Компоненты](../frontend/src/components/) разделены на atoms (контролы),
molecules (формы, карточки), organisms (навигация, сетки, интерактивная таблица)
и templates (макеты). В `components/pages` есть дополнительные реализации
страниц; точкой входа маршрутов остаётся `src/app`. Административное управление
правилами находится в [маршрутах admin/rules](../frontend/src/app/admin/rules/),
а дерево, форма свойств и защита несохранённого состояния — в
[компонентах admin](../frontend/src/components/admin/).

[lib/api.ts](../frontend/src/lib/api.ts) содержит адрес backend, константы API,
хранение токена, discriminated union определений/учебного содержимого и методы
доступа. Часть учебных компонентов использует `fetch` напрямую с теми же
константами и заголовками авторизации. Адрес API задан в коде как
`http://localhost:8000`; Next.js-прокси для запросов не настроен в
[next.config.js](../frontend/next.config.js).

**Backend.** [main.py](../backend/main.py) создаёт FastAPI, CORS и подключает
роутеры. [schemas/exercises.py](../backend/schemas/exercises.py) задаёт строгие
административные definition и отдельные ученические DTO.
[services/exercises.py](../backend/services/exercises.py) содержит реестр пар
`(type_code, schema_version)`, whitelist именованных словарных источников,
подготовку содержимого и серверную механику `fill_blanks`; JSON упражнения не
задаёт таблицы, колонки или SQL. Остальные обработчики в
[routers](../backend/routers/) по-прежнему могут совмещать HTTP-контракт,
SQLAlchemy-запросы и преобразование ответа. [services/auth.py](../backend/services/auth.py) отвечает за пароли, JWT и
зависимости активного пользователя, ученика и администратора;
[services/database.py](../backend/services/database.py)
— за engine и сессии. [services/migrations.py](../backend/services/migrations.py)
и [migrate.py](../backend/migrate.py) управляют проверкой версии, явным upgrade
и регистрацией существующей схемы. Перед `yield` lifespan проверяет, что
версия БД равна head; при недоступной или неподготовленной БД
backend не стартует. [models](../backend/models/) содержат
ORM и модели запросов/ответов пользователей; часть Pydantic-моделей объявлена
непосредственно в роутерах. Синхронные SQLAlchemy-сессии используются внутри
`async`-обработчиков; `get_db` закрывает сессию после запроса, запись фиксируется
явным `commit` обработчика.

## API и основные потоки

**Вход.** [Страница login](../frontend/src/app/login/page.tsx) вызывает
[AuthContext.login](../frontend/src/contexts/AuthContext.tsx): `POST /users/token`
передаёт имя и пароль как form-urlencoded; backend проверяет bcrypt-хеш и выдаёт
JWT HS256 с `sub=username`, сроком 30 минут. Frontend сохраняет токен и его тип
в `localStorage`, затем получает `GET /users/me`. При загрузке страницы контекст
восстанавливает пользователя через этот же запрос; выход очищает локальный токен.
Refresh-токена и серверной сессии нет. Учебные API требуют активного пользователя
без `is_superuser`, административный API — активного пользователя с этим
признаком. После входа frontend направляет ученика на `/`, администратора — на
`/admin`. Общий ролевой guard направляет неаутентифицированного посетителя
защищённых страниц на вход, не показывает `/admin` ученику и возвращает
администратора с остальных экранных маршрутов в `/admin`. Это клиентская граница
навигации; окончательное разграничение учебных и административных данных выполняет
backend.

[Роутер users](../backend/routers/users.py) также предоставляет
`POST /users/register` и список пользователей для авторизованного ученика.
[Страница signup](../frontend/src/app/signup/page.tsx) отправляет
`username`, `email`, `password` через [ApiService.register](../frontend/src/lib/api.ts)
на этот endpoint. При успехе она переходит на `/login` с подтверждением,
которое показывает форма входа; автоматического входа после регистрации нет.
При ошибке регистрации форма показывает сообщение и сохраняет введённые поля.
[Frontend middleware](../frontend/middleware.ts) проверяет cookies/Authorization
для `/dashboard`, `/profile`, `/settings`; эти маршруты отсутствуют, а штатный
вход сохраняет токен только в `localStorage`. Защита учебного API осуществляется
backend, а не этим middleware.

**Каталог и типы упражнений.** [Главный роутер](../backend/routers/exercises/main.py)
выдаёт ученику опубликованный каталог `GET /api/exercises/` и подготовленное
содержимое `GET /api/exercises/{slug}/content`. Общий envelope содержит метаданные
упражнения, а `content` различается по четырём зарегистрированным типам:
`form_table`, `single_input`, `self_check`, `fill_blanks`. Административное
`definition` наружу ученику не передаётся. Для трёх словарных типов сервис
выполняет именованный запрос к каноническим `nouns`, `pronouns`, `verbs` или
`numerators`; для `fill_blanks` удаляет `accepted_answers` из учебной проекции.

[Каталог frontend](../frontend/src/app/exercises/page.tsx) строится только по
этому backend-ответу. Все упражнения открываются через единый динамический
маршрут `/exercises/[slug]`, где registry выбирает renderer. Прежние адреса
отдельных упражнений совпадают со slug и обслуживаются тем же маршрутом; рабочие
адреса `/lessons/singular-nouns`, `/lessons/pronouns`, `/lessons/verbs` делают
redirect на соответствующие slug, а `/lessons` — на общий каталог. Старые
плоские API существительных, местоимений, глаголов, числительных и падежных
упражнений сохранены как совместимые обёртки над общими загрузчиками источников.
Макет `/lessons/plural-nouns` остаётся вне модели упражнений.

**Клиентские механики прежних типов.** `form_table` преобразует нейтральные
строки обратно в формат
[InteractiveLessonTable](../frontend/src/components/organisms/InteractiveLessonTable.tsx).
Таблица сравнивает ответ в браузере, после правильного ответа или трёх ошибок
раскрывает форму и отправляет `/api/tests/attempt`, `/complete` и `/weight`.
[Роутер tests](../backend/routers/tests.py) сохраняет агрегаты `WordTestStat`;
только выборка глаголов использует их для персонального ранжирования. `single_input`
также проверяет до трёх попыток в React, а `self_check` раскрывает ответ и хранит
отметку результата локально. Единой серверной истории ответов для этих типов нет.

**Серверная проверка `fill_blanks`.** При открытии renderer создаёт
`POST /api/exercises/{slug}/sessions`; backend фиксирует UUID, пользователя,
упражнение, снимок допустимых ответов и независимое состояние каждого пропуска
на 24 часа. `POST /api/exercise-sessions/{session_id}/blanks/{blank_id}/check`
ищет только сессию текущего ученика, блокирует строку `FOR UPDATE` и сравнивает
`strip().casefold()`. Правильный пропуск закрывается; после третьей ошибки
закрывается только исчерпанный пропуск и только для него раскрываются эталоны.
Пустой ответ попытку не расходует, чужая сессия скрыта как `404`, истёкшая
удаляется с `410`. Остальные истёкшие строки лениво удаляются при создании или
проверке. UUID не сохраняется во frontend: reload создаёт новую сессию.

**Административный контур.** [Admin router](../backend/routers/admin/main.py)
требует активного администратора для всего префикса `/admin`. Он предоставляет
список зарегистрированных типов, список/деталь упражнений и `POST`/`PUT` для
создания и полной замены редактируемых полей. `slug`, `type_code` и
`schema_version` после создания неизменяемы; публикация — значение общего поля
`status`. Definition валидируется выбранной Pydantic-схемой до записи, неизвестная
пара тип/версия и ошибки структуры возвращают структурированный `422`, повторный
slug — `409`. Удаления упражнений нет. Страница `/admin` перенаправляет в
[`/admin/exercises`](../frontend/src/app/admin/exercises/page.tsx), где доступны
список, создание и редактирование метаданных и типового содержимого.

**Прочие API.** [misc](../backend/routers/misc.py) содержит публичный health check
и доступную только ученику проверку БД.

[Rules router](../backend/routers/admin/rules.py) реализует административный CRUD
дерева через `GET/POST /admin/rules` и `PUT/DELETE /admin/rules/{id}`. Чтение
возвращает весь лес вложенными узлами. Мутации сериализуются PostgreSQL-блокировкой
`SHARE ROW EXCLUSIVE`; перенос проверяется рекурсивным CTE, поэтому правило нельзя
сделать потомком самого себя. Создание и перенос добавляют узел в конец уровня.
Удаление одним commit сначала SQL-операциями переносит прямых потомков к прежнему
родителю (или в корень), затем удаляет узел; rollback отменяет обе части.
[Список правил](../frontend/src/app/admin/rules/page.tsx), отдельное создание и
двухпанельный редактор полного дерева используют один ответ с полным лесом,
фильтруют недопустимых родителей на клиенте и после каждой успешной мутации
перечитывают серверное состояние. Backend остаётся окончательной границей
валидации и доступа.

## Данные и схема

Общая [Base](../backend/services/base.py) объединяет ORM-модели.
Пользователь описан в [user.py](../backend/models/user.py), учебные сущности —
в [vocabulary.py](../backend/models/vocabulary.py), каталог и временные сессии —
в [exercise.py](../backend/models/exercise.py).

| Таблица | Содержимое и связи |
|---|---|
| `users` | Уникальные username/email, хеш пароля, активность и `is_superuser`, временные метки. |
| `nouns` | Слово и обязательные JSONB `cases_pojed`, `cases_mnoga`, `cases_menska` с формами. |
| `pronouns`, `verbs` | Слово и JSONB `cases`: падежи местоимения или лица глагола. |
| `numerators` | Польское слово и строка перевода. |
| `rules` | Название/описание, `parent_rule_id → rules.id`, порядок; self-reference задаёт дерево правил. |
| `word_test_stats` | Составной PK `(user_id, word_type, word_id)`; FK только `user_id → users.id`, агрегаты попыток, вес, последнее завершение. |
| `exercises` | Уникальный slug, тип и версия схемы, метаданные каталога, `draft`/`published` и строго валидируемый `definition` JSONB. Словарные definition хранят `source_code` и настройки, но не копии слов. |
| `exercise_sessions` | UUID, FK на упражнение и пользователя с каскадным удалением, JSONB-снимок ответов/состояния и TTL; индексы по `expires_at` и `(user_id, exercise_id)`. |

Связь статистики со словом полиморфная по типу и ID, без FK на словарные таблицы.
Упражнения и словарные строки связаны именованным обработчиком в коде, а не FK;
временная сессия `fill_blanks` не является историей прохождений. Нет связей
упражнений или слов с `rules`, таблиц уроков/блоков, долговременной истории
ответов и персонального прогресса по частям правил. Дерево `Rule` редактируется только
через административный контур; учебные роутеры его не читают. Согласованная
[модель обучения](LEARNING_MODEL.md) не реализована наличием этой таблицы:
снижение оценки запоминания, сводка родителя и подбор по частям правил отсутствуют;
их открытые продуктовые вопросы здесь не разрешаются.

**Создание и изменение схемы.** [Alembic](../backend/migrations/env.py) применяет
версионированные revisions. [Initial revision](../backend/migrations/versions/0001_initial_schema.py)
явно создаёт семь таблиц, индексы и FK в пустой PostgreSQL; её downgrade
отказывает, чтобы не удалить данные. Последующая
[revision упражнений](../backend/migrations/versions/0002_exercise_types.py)
создаёт `exercises` и `exercise_sessions` и автономно переносит семь работающих
старых упражнений в опубликованные записи, не копируя словарь. Её downgrade также
запрещён, поскольку мог бы удалить административное содержимое. [CLI](../backend/migrate.py) содержит
`upgrade`, `check`, `check-legacy`, `baseline`. Штатный порядок — явный `upgrade`
до запуска backend; `create_all` из запуска и сервиса БД удалён.

[create_admin.py](../backend/create_admin.py) — отдельная явно запускаемая команда:
проверяет актуальность миграций, валидирует переданные имя, email и пароль,
хеширует пароль и создаёт активного пользователя с `is_superuser=true` одной
транзакцией. По умолчанию пароль читается скрыто с подтверждением; режим
`--password-stdin` предназначен для управляемого неинтерактивного запуска.

Для перехода legacy [validator](../backend/services/migrations.py) выполняет
initial revision в отдельной пустой PostgreSQL `lingvar_migration_reference`
в транзакции, снимает снимок `pg_catalog` и откатывает эталон. `check-legacy`
сравнивает фактическую структуру target только чтением; при расхождении отказывает.
`baseline` повторяет сравнение под advisory-блокировкой и блокировками таблиц,
затем в той же target-транзакции регистрирует initial revision без выполнения
её DDL. Снимок сравнивает учебные таблицы/колонки/ограничения/индексы/
последовательности, параметры locale/encoding и неизвестные объекты `public`;
учитывает зависимости views из других схем. Объекты `uuid-ossp` исключаются
по принадлежности расширению. Прямой `alembic stamp` запрещён конфигурацией
миграций; пустая или неизвестная версия запрещает upgrade. Миграционные
транзакции используют локальный `search_path` `public,pg_catalog`. Сторонний
DDL на время baseline исключается эксплуатационно. Фактическая схема БД
учеников не включена в эту карту; её изменение требует отдельного указания PO.
[01-init.sql](../database/init/01-init.sql) выполняется PostgreSQL при первичной
инициализации тома и задаёт расширение/права, а не учебную схему.
[add_dopelniacz_rule.py](../backend/add_dopelniacz_rule.py) — отдельный скрипт
добавления учебных записей `Rule` в обычную БД, не миграция и не часть старта.

## Окружение и проверки

[docker-compose.yml](../docker-compose.yml) задаёт PostgreSQL 15, backend на
порту 8000 и Next.js на порту 8087. Данные PostgreSQL хранятся в bind mount
`database/data`; backend ожидает health check БД и работает с `DATABASE_URL`.
Исходники frontend/backend подключены томами; запускаются `npm run dev`
и Uvicorn с reload. [Образы](../backend/Dockerfile) используют Python 3.13;
[frontend-образ](../frontend/Dockerfile) — Node 19.
[requirements.txt](../backend/requirements.txt) задаёт Alembic и закрепляет
`bcrypt==4.0.1`, сохраняющий ожидаемые passlib 1.7.4 метаданные `__about__`.
`DATABASE_URL` обязателен и указывает PostgreSQL; SQLite fallback удалён.
Модели используют JSONB,
ранжирование — PostgreSQL-выражения. CORS разрешает указанные в `main.py`
адреса frontend.

[docker-compose.test.yml](../docker-compose.test.yml) задаёт отдельный project
`lingvar-tests` с PostgreSQL 15, БД `lingvar_test` и пользователем
`lingvar_test_user` на tmpfs, без host-порта и без
подключения `database/data`, штатной сети и учётных данных. Команды в
[README](../README.md) указывают явный `-p lingvar-tests`; cleanup
не затрагивает штатный project. [Общие фикстуры](../backend/tests/conftest.py)
требуют `TEST_DATABASE_URL` с выделенными PostgreSQL, host, пользователем и
именем БД, проверяют фактически подключённые имя/пользователя и версию 15 до
DDL, назначают backend тот же URL и очищают `public` до/после каждого теста.
[Тесты миграций](../backend/tests/test_migrations.py) вызывают CLI в subprocess,
запускают FastAPI lifespan через TestClient и проверяют пустую/обновлённую
схему, последовательное применение обеих revisions, точный backfill каталога,
отказ старта без миграции и запрет downgrade/stamp.
[HTTP-сценарии](../backend/tests/test_user_workflow.py) проверяют путь регистрация
→ вход → авторизованная выдача слова → сохранение агрегата `word_test_stats`,
отказ повторной регистрации, создание администратора через настоящий CLI и
разделение всех защищённых учебных/admin endpoints. Отдельный
[сценарий упражнений](../backend/tests/test_exercise_workflow.py) проверяет CRUD
и типовую валидацию четырёх механизмов, публикацию, безопасные DTO, совместимые
старые endpoints, серверные сессии, три попытки на пропуск, изоляцию по
пользователю, TTL и ленивую очистку. Сценарий правил в user workflow
проверяет CRUD многоуровневого леса, запрет циклов, перенос прямых потомков и
rollback удаления через отклоняющий DELETE тестовый PostgreSQL-trigger. Тесты
явно применяют Alembic перед запросами, создают только синтетические данные и
читают сохранённый результат в тестовой PostgreSQL.

Сервис `browser-tests` собирается из [отдельного Dockerfile](../tests/browser/Dockerfile),
сбрасывает только проверенную тестовую схему, поднимает backend и frontend внутри
контейнера и запускает [Playwright-сценарий](../frontend/e2e/admin-access.spec.ts)
в системном Chromium. Он проверяет вход и ролевую навигацию администратора и
ученика поверх настоящих backend и PostgreSQL, а также создание, редактирование,
перенос и удаление многоуровневого дерева правил, состояния ошибки и защиты
несохранённого ввода. Там же связанный сценарий создаёт и публикует
`fill_blanks`, проверяет независимые исходы пропусков и новую сессию после reload;
отдельный сценарий покрывает три старых renderer и переходы со старых URL.
Словарные строки для браузерного контура добавляет
[seed_exercise_vocabulary.py](../tests/browser/seed_exercise_vocabulary.py).
Конфигурация раннера находится в
[playwright.config.ts](../frontend/playwright.config.ts). В `frontend/package.json`
нет самостоятельного test-скрипта: штатная браузерная проверка запускается через
сервис compose.
