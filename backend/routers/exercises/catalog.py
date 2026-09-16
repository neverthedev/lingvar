"""The fixed exercise catalog shared by learner and administrator endpoints."""
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class ExerciseCatalogEntry:
    id: str
    title: str
    description: str
    api: str
    difficulty: str
    duration: str


EXERCISE_CATALOG = (
    ExerciseCatalogEntry(
        id="dopelniacz-pojed",
        title="Dopełniacz (Genitive Case) Liczby Pojedynczej",
        description="Practice identifying and using singular nouns in different contexts. Learn the basics of noun usage.",
        api="/api/exercises/dopelniacz/pojed",
        difficulty="Beginner",
        duration="15 min",
    ),
    ExerciseCatalogEntry(
        id="dopelniacz-mnoga",
        title="Dopełniacz (Genitive Case) Liczby Mnogiej",
        description="Practice identifying and using plural nouns in different contexts. Learn the basics of noun usage.",
        api="/api/exercises/dopelniacz/mnoga",
        difficulty="Beginner",
        duration="15 min",
    ),
    ExerciseCatalogEntry(
        id="numerators",
        title="Liczebniki (Numerals)",
        description="Practice Polish numerals and their Russian translations. Learn different forms of numbers.",
        api="/api/exercises/numerators",
        difficulty="Beginner",
        duration="10 min",
    ),
    ExerciseCatalogEntry(
        id="mianowniki-mnoga",
        title="Mianownik Liczny Mnogej",
        description="Practice Polish nouns in nominative plural case with their Russian translations. Learn different forms of plural nouns.",
        api="/api/exercises/mianowniki/mnoga",
        difficulty="Beginner",
        duration="10 min",
    ),
)


def full_exercise_catalog() -> list[dict[str, str]]:
    return [asdict(exercise) for exercise in EXERCISE_CATALOG]
