1. Race condition в fill-blanks проверке


# services/exercises.py:219-238
def _check_fill_blank(_db: Session, session: ExerciseSession, blank_id: str, answer: str):
    # ПРОБЛЕМА: между проверкой статуса и обновлением может быть race condition
    blank = blanks.get(blank_id)
    if blank["status"] != "open":  # ← Проверка
        raise HTTPException(...)
    blank["status"] = "correct" if correct else ...  # ← Обновление (не атомарно)
    session.state = state
    db.commit()
Риск: Если два запроса придут одновременно, оба могут пройти проверку и обновить blank.

Решение: Используйте db.get(ExerciseSession, session_id, with_for_update=True) или версионирование состояния.

2. Нет проверки прав доступа на сессию


# routers/exercises/main.py:52
@session_router.post("/{session_id}/blanks/{blank_id}/check")
async def check_session_blank(session_id: UUID, blank_id: str, ...):
    # Проверяется ли что session принадлежит current_user?
    return {"blanks": check_blank(db, session_id, current_user.id, ...)}
Риск: Потенциально студент может угадать чужую session_id и проверять её ответы.

Проверка: Убедитесь, что check_blank валидирует current_user.id против session.user_id.

3. Ошибка в обработке экспирированной сессии


# services/exercises.py:305-310 (предполагаю)
db.execute(delete(ExerciseSession).where(...))  # Lazy delete
При большом количестве пользователей может быть накопление мёртвых сессий между операциями. Нужен явный scheduler (celery/APScheduler).

⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ
1. Производительность load_verbs_present_cases (★★★)


# services/exercises.py:93-122
# 10 SQL функций в одном query, outer join с WordTestStat
Этот query может быть медленным на больших таблицах. Рекомендую:

Протестировать на 10k+ глаголов
Рассмотреть материализованное представление для весов
Добавить EXPLAIN для анализа
2. Дублирование serialize в админ роутере


# routers/admin/main.py:17-18
def serialize(exercise: Exercise) -> dict:
    return {"id": exercise.id, "slug": ..., ...}  # 15 полей вручную
Лучше использовать Pydantic serializer или создать метод в модели.

3. Нет версионирования контента упражнений
Требования говорят "неизменяемые ревизии", но в коде только одна версия в definition. Как администратор будет управлять версиями?

4. Missing обработка в validate_definition


# services/exercises.py:259-286
try:
    parsed = handler.definition_model.model_validate(definition)
except ValidationError as error:
    # Обработка только валидации Pydantic
    # Но source_code проверяется после - может быть не связана с ValidationError
💡 МОЖНО УЛУЧШИТЬ (не критично)
Область	Замечание	Приоритет
Frontend	ExerciseEditor.tsx - дублирование логики для каждого типа	Среднее
Backend	Нет логирования операций админа (audit log)	Среднее
API	Content-Type не явно указан в ответах	Низкое
Tests	Нет e2e теста для fill-blanks сессии	Среднее
Docs	Нет docstring для ExerciseTypeHandler	Низкое
📋 ВЫВОДЫ
