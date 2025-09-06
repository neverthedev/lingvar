from fastapi import APIRouter, Depends

from services.auth import get_current_active_user
from database import User as DBUser

router = APIRouter(
    prefix="/api/pronouns",
    tags=["pronouns"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def get_pronouns(
    current_user: DBUser = Depends(get_current_active_user)
):
    """Get Polish pronouns"""
    all_cases = ["mianownik", "dopełniacz", "celownik", "biernik", "narzędnik", "miejscownik", "wołacz"]

    # Polish pronouns with their declensions
    pronouns_data = [
        {
            "id": 1,
            "word": "ja",
            "mianownik": "ja",
            "dopełniacz": "mnie",
            "celownik": "mi",
            "biernik": "mnie",
            "narzędnik": "mną",
            "miejscownik": "mnie",
            "wołacz": ""
        },
        {
            "id": 2,
            "word": "ty",
            "mianownik": "ty",
            "dopełniacz": "ciebie",
            "celownik": "ci",
            "biernik": "ciebie",
            "narzędnik": "tobą",
            "miejscownik": "tobie",
            "wołacz": "ty"
        },
        {
            "id": 3,
            "word": "on",
            "mianownik": "on",
            "dopełniacz": "jego",
            "celownik": "jemu",
            "biernik": "jego",
            "narzędnik": "nim",
            "miejscownik": "nim",
            "wołacz": ""
        },
        {
            "id": 4,
            "word": "ona",
            "mianownik": "ona",
            "dopełniacz": "jej",
            "celownik": "jej",
            "biernik": "ją",
            "narzędnik": "nią",
            "miejscownik": "niej",
            "wołacz": ""
        },
        {
            "id": 5,
            "word": "ono",
            "mianownik": "ono",
            "dopełniacz": "jego",
            "celownik": "jemu",
            "biernik": "je",
            "narzędnik": "nim",
            "miejscownik": "nim",
            "wołacz": ""
        },
        {
            "id": 6,
            "word": "my",
            "mianownik": "my",
            "dopełniacz": "nas",
            "celownik": "nam",
            "biernik": "nas",
            "narzędnik": "nami",
            "miejscownik": "nas",
            "wołacz": ""
        },
        {
            "id": 7,
            "word": "wy",
            "mianownik": "wy",
            "dopełniacz": "was",
            "celownik": "wam",
            "biernik": "was",
            "narzędnik": "wami",
            "miejscownik": "was",
            "wołacz": "wy"
        },
        {
            "id": 8,
            "word": "oni",
            "mianownik": "oni",
            "dopełniacz": "ich",
            "celownik": "im",
            "biernik": "ich",
            "narzędnik": "nimi",
            "miejscownik": "nich",
            "wołacz": ""
        },
        {
            "id": 9,
            "word": "one",
            "mianownik": "one",
            "dopełniacz": "ich",
            "celownik": "im",
            "biernik": "je",
            "narzędnik": "nimi",
            "miejscownik": "nich",
            "wołacz": ""
        }
    ]

    # Ensure all cases are present with empty string defaults
    result = []
    for pronoun in pronouns_data:
        flat = {"id": pronoun["id"], "word": pronoun["word"]}
        for case in all_cases:
            flat[case] = pronoun.get(case, "")
        result.append(flat)
    return result
