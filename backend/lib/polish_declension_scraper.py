import requests
from bs4 import BeautifulSoup
from typing import Dict, Optional
import re
from dataclasses import dataclass
from models.vocabulary import Noun
from services.database import SessionLocal
import json
from time import sleep

words = [
    "kobieta", "mężczyzna", "chłopiec", "dziewczyna",
    "rodzina", "przyjaciel", "przyjaciółka", "nauczyciel", "kot", "pies",
    "dom", "samochód", "książka", "komputer", "telefon", "stół", "dziecko",
    "miasto", "wieś", "szkoła", "praca", "ogród", "drzewo", "kwiat",
    "miesiąc", "miejsce", "czas", "jedzenie", "miłość", "klucz",
    "laptop", "rower", "film", "sport", "zdrowie", "tata", "mama",
    "brat", "siostra", "dziadek", "babcia", "księżyc", "mleko",
    "chleb", "woda", "herbata", "kawa", "ciasto",
    "centrum", "sklep", "restauracja", "muzeum", "imię", "nazwisko",
    "adres", "telefon", "internet", "las", "morze", "krem",
    "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota",
    "niedziela", "kościół", "szpital", "apteka", "stół", "krzesło", "łóżko",
    "okno", "drzwi", "podłoga", "ściana", "sufit", "kuchnia", "łazienka",
    "pralka", "lodówka", "mikrofalówka", "zmywarka", "bursztyn", "srebro",
    "garnek", "patelnia", "sztućce", "talerz", "kubek", "szklanka", "artysta",
    "pracownik", "student", "uczeń", "sportowiec", "muzyk", "pisarz", "inżynier",
    "lekarz", "naukowiec", "programista", "kucharz", "sprzedawca", "fachowiec",
    "architekt", "projektant", "dziennikarz", "fotograf", "gospodyni", "ludzie"]

words = [
    "wampir", "krasnoludek", "anioł", "diabeł",
    "walc", "polonez", "twist", "oberek",
    "tenis", "hokej", "poker", "brydż",
    "dolar", "jen", "funt", "rubel",
    "drink", "szampan", "bourbon", "papieros", "pet",
    "mercedes", "fiat", "volkswagen",
    "pomidor", "ogórek", "banan", "arbuz",
    "borowik", "prawdziwek", "maślak",
    "hamburger", "pączek", "sernik", "kotlet",
    "laptop", "link", "mail", "sms", "facebook", "zoom"
]

@dataclass
class DeclensionResult:
    """Data class for storing declension results"""
    mianownik: str  # Nominative
    dopelniacz: str  # Genitive
    celownik: str  # Dative
    biernik: str  # Accusative
    narzednik: str  # Instrumental
    miejscownik: str  # Locative
    wolacz: str  # Vocative

class PolishDeclensionScraper:
    """Scraper for Polish noun declensions from odmiana.net"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def scrape_declension(self, word: str) -> tuple[Optional[DeclensionResult]]:
        """
        Scrape declension table from the given URL

        Args:
            url: URL to scrape declension from

        Returns:
            DeclensionResult object or None if parsing fails
        """
        try:
            response = self.session.get(self.format_word_url(word), timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')
            return ( self._parse_declension_table(soup, 1),
                     self._parse_declension_table(soup, 2) )

        except requests.RequestException as e:
            print(f"Error fetching URL: {e}")
            return None, None
        except Exception as e:
            print(f"Error parsing page: {e}")
            return None, None

    def _parse_declension_table(self, soup: BeautifulSoup, cell_type: int) -> Optional[DeclensionResult]:
        """
        Parse the declension table from the HTML soup

        Args:
            soup: BeautifulSoup object of the page

        Returns:
            DeclensionResult object or None if parsing fails
        """

        response = []
        # Look for declension table - try different selectors
        table = soup.find('table', class_='declension') or \
                soup.find('table', {'id': 'declension'}) or \
                soup.find('div', class_='declension-table')

        if table:
            response.append(table)
        else:
            # Try to find any table with declension data
            tables = soup.find_all('table')
            for t in tables:
                if self._contains_declension_data(t):
                    response.append(t)

        if len(response) == 0:
            print("Could not find declension table")
            return None

        return self._extract_declension_data(response, cell_type)

    def _contains_declension_data(self, table) -> bool:
        """Check if table contains Polish declension data"""
        text = table.get_text().lower()
        declension_keywords = ['mianownik', 'dopełniacz', 'celownik', 'biernik', 'narzędnik', 'miejscownik', 'wołacz']
        return any(keyword in text for keyword in declension_keywords)

    def _extract_declension_data(self, tables, cell_type: int) -> Optional[DeclensionResult]:
        """
        Extract declension data from table element

        Args:
            table: BeautifulSoup table element

        Returns:
            DeclensionResult object or None if extraction fails
        """
        declension_data = {}

        # Map Polish case names to English keys
        case_mapping = {
            'mianownik': 'mianownik',
            'dopełniacz': 'dopelniacz',
            'celownik': 'celownik',
            'biernik': 'biernik',
            'narzędnik': 'narzednik',
            'narzednik': 'narzednik',
            'miejscownik': 'miejscownik',
            'wołacz': 'wolacz'
        }

        for table in tables:
            # Try to find rows with case information
            rows = table.find_all('tr')

            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    case_name = cells[0].get_text().strip().lower()
                    case_value = cells[cell_type].get_text(separator=", ").strip() # first colunm is for singular form

                    # Clean up the case name and value
                    case_name = re.sub(r'[^\w\s]', '', case_name)
                    case_value = re.sub(r'\s+', ' ', case_value).strip()

                    # Map to our internal case names
                    for polish_case, english_key in case_mapping.items():
                        if polish_case in case_name:
                            if english_key in declension_data:
                                data = declension_data[english_key].split(", ")
                                if case_value not in data:
                                    data.append(case_value)
                                declension_data[english_key] =  ', '.join(data)
                            else:
                                declension_data[english_key] = case_value
                            break

        # Validate we have all required cases
        required_cases = ['mianownik', 'dopelniacz', 'celownik', 'biernik', 'narzednik', 'miejscownik', 'wolacz']

        if not all(case in declension_data for case in required_cases):
            print(f"Missing declension cases. Found: {list(declension_data.keys())}")
            return None

        return DeclensionResult(**declension_data)

    def format_word_url(self, word: str) -> Optional[DeclensionResult]:
        """
        Get declension for the word 'ludzie' from the specific URL

        Returns:
            DeclensionResult object or None if scraping fails
        """
        return f"https://odmiana.net/odmiana-przez-przypadki-rzeczownika-{word}"

    def format_declension_result(self, result: DeclensionResult) -> Dict[str, str]:
        """
        Format declension result as a dictionary with Polish case names

        Args:
            result: DeclensionResult object

        Returns:
            Dictionary with Polish case names as keys
        """
        return {
            "mianownik": result.mianownik,
            "dopełniacz": result.dopelniacz,
            "celownik": result.celownik,
            "biernik": result.biernik,
            "narzędnik": result.narzednik,
            "miejscownik": result.miejscownik,
            "wołacz": result.wolacz
        }

# Example usage
if __name__ == "__main__":
    scraper = PolishDeclensionScraper()
    db = SessionLocal()
    try:
        for word in words:
            noun = Noun(word=word, cases_pojed={}, cases_mnoga={}, cases_menska={})
            result1, result2 = scraper.scrape_declension(word)
            for field, result in { "cases_pojed": result1, "cases_mnoga": result2 }.items():
                if result:
                    cases = scraper.format_declension_result(result)
                    setattr(noun, field, cases)
                    # db.add(noun)
                    # db.commit()
                else:
                    print(f"Failed to scrape declension data for: {word}")

            print(f"{word} -> {json.dumps({"cases_pojed": noun.cases_pojed, "cases_mnoga": noun.cases_mnoga }, ensure_ascii=False)}")
            sleep(2)
    finally:
        db.close()
