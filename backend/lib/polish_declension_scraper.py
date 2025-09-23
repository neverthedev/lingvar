import requests
from bs4 import BeautifulSoup
from typing import Dict, Optional
import re
from dataclasses import dataclass
from models.vocabulary import Noun
from services.database import SessionLocal
import json
from time import sleep
import logging
from datetime import datetime
import os

words =['społeczeństwo', 'skarpeta']

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
        # Basic session configuration - headers will be enhanced per request
        self.session.headers.update({
            'Connection': 'keep-alive',
            'DNT': '1'
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
            from urllib.parse import quote

            # URL encode the word for headers to avoid encoding issues
            encoded_word = quote(word.encode('utf-8'))

            # Enhanced headers to mimic browser behavior
            enhanced_headers = {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9,pl;q=0.8,ru;q=0.7',
                'Cache-Control': 'max-age=0',
                'Sec-Ch-Ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"macOS"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'Referer': f'https://odmiana.net/odmiana-przez-przypadki-rzeczownika-{encoded_word}',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'Cookie': '_ga=GA1.1.1570150082.1757175221; FCCDCF=%5Bnull%2Cnull%2Cnull%2C%5B%22CQXUr8AQXUr8AEsACBPLB7FoAP_gAEPgAB5YIYJB7C7FbSFCyL5zaLsAMAhHR8AAQoQAAASBAmABQAKQIAQCgkAYFASABAACAAAAICRBIQIECAAAAUAAAAAAAAAEAAAAAAAIIAAAgAEAAAAIAAACAIAAEAAIAAAAEAAAmAgAAIIACAAAgAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAQAABBDBIPYXYraQoWRcKbBdgBgEK6PgACFCAAACQIEwAKABSBACAUkgCAIgQAAAAAAAABASIJAABAQEAAAgAIAAAAAAAgAAAAAABBAAAEAAgAAAAAAAAQBAAAgABAAAAAgAAESEAABBAAQAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAA.f_gAAAAAAAA%22%2C%222~70.89.93.108.122.149.184.196.236.259.311.313.314.323.358.415.442.486.494.495.540.574.723.827.864.981.1029.1047.1048.1051.1095.1097.1126.1205.1276.1301.1365.1415.1449.1514.1570.1577.1598.1651.1716.1735.1753.1765.1870.1878.1889.1958.2072.2253.2299.2373.2415.2506.2526.2531.2568.2571.2575.2624.2677.2778~dv.%22%2C%228CD19A2C-3536-4595-BE61-F4ED90E408CF%22%5D%5D; _cc_id=57a4746fe6de823e7de2122b954470ff; panoramaId_expiry=1758799888113; panoramaId=968a74af8bfaa249ecfc0db383a5185ca02c818c2c59ce57a7dba85fbb473827; panoramaIdType=panoDevice; cto_bundle=yhjAel92eHU3R0N4TUdkUkdjQyUyRkt3c01LMzNrVmFpdktiRndoejkydkZMeXl2SGQlMkZkMlFKMmtveFdyV3V5T1RhOE9aTUJvMGNIN3V6NGVpUE9WZEhoN2xmWm1iVUVFUUo1b2klMkIwdk9hSXlOeWU4WUE5T29ic0M2WWgzQ1dTRUUlMkZ4VTA3aDhqYUg1dGVkVlNKWFlJZ0NxYTVscGVMNVM5RmlCeDJOR0R5Q0JrR1lUUiUyQlhxZVdTbVdBY28wMUJvMzhCaGIzc296OGxIYVExeGRYZ2sxS0RXRmxGajdBTWd6VXpEbTgxWklsb0RTUEU2R1hZQmV1cDNUejB3QTdhc1dEJTJCcHQw; __gads=ID=b0eb60bd853f35e2:T=1741972772:RT=1758558086:S=ALNI_MaFzrmYuelO3pprCcE-X11dtglRQQ; __gpi=UID=0000105ebfc6a7e0:T=1741972772:RT=1758558086:S=ALNI_MZbqzSPqpShWfDTeKVGbiopFDYA7Q; __eoi=ID=e3049f53ec97892f:T=1757590507:RT=1758558086:S=AA-AfjZ0Xx3YKnFcP1oXOle3Tgms; _giq=1e41fe5768d1784a5703; _ga_775JE7WC13=GS2.1.s1758554581$o31$g1$t1758558282$j60$l0$h0; FCNEC=%5B%5B%22AKsRol_eEs3J4Ny7eWY_dq2sq1-pg69bcR4o9yh-mtBl36fPxTfEakBQvY43r7orrDaS-0R3mVT-LMs9ldNIhitVluBUn7MNnTa_MoCxT7DiTtmMXbfXm8MtR_5XXQDGyVp2zysz2e8pOBZAjs-7bWRWivSL7ZAchg%3D%3D%22%5D%5D'
            }

            # Update session headers with enhanced headers
            self.session.headers.update(enhanced_headers)

            response = self.session.get(self.format_word_url(word), timeout=10)
            response.raise_for_status()

            # Ensure proper UTF-8 encoding for Polish characters
            response.encoding = 'utf-8'

            soup = BeautifulSoup(response.content, 'html.parser', from_encoding='utf-8')
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
            logger = logging.getLogger(__name__)
            logger.warning("Could not find declension table")
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

    def format_word_url(self, word: str) -> str:
        """
        Get URL for the word with proper URL encoding for Polish characters

        Returns:
            URL string with properly encoded Polish characters
        """
        from urllib.parse import quote
        encoded_word = quote(word.encode('utf-8'))
        return f"https://odmiana.net/odmiana-przez-przypadki-rzeczownika-{encoded_word}"

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
    # Setup logging
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_filename = f"{log_dir}/polish_declension_{timestamp}.log"

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_filename, encoding='utf-8'),
            logging.StreamHandler()  # This will still show errors in console
        ]
    )

    logger = logging.getLogger(__name__)
    logger.info(f"Starting Polish declension scraping session")
    logger.info(f"Total words to process: {len(words)}")

    scraper = PolishDeclensionScraper()
    db = SessionLocal()

    # Check how many words are already in database
    existing_words = db.query(Noun.word).all()
    existing_word_set = {word[0].lower() for word in existing_words}
    words_to_scrape = [word for word in words if word.lower() not in existing_word_set]
    words_already_exist = len(words) - len(words_to_scrape)

    logger.info(f"Words already in database: {words_already_exist}")
    logger.info(f"Words to scrape: {len(words_to_scrape)}")
    print(f"📊 Database status: {words_already_exist} words exist, {len(words_to_scrape)} to scrape")

    processed_count = 0
    success_count = 0
    failed_count = 0
    skipped_count = 0

    try:
        for word in words_to_scrape:
            processed_count += 1

            # Check if word already exists in database (case-insensitive)
            existing_noun = db.query(Noun).filter(Noun.word.ilike(word)).first()
            if existing_noun:
                logger.info(f"SKIPPED: Word '{word}' already exists in database (ID: {existing_noun.id})")
                skipped_count += 1
                # Console counter (this will show progress)
                print(f"Progress: {processed_count}/{len(words)} ({processed_count/len(words)*100:.1f}%) | Success: {success_count} | Failed: {failed_count} | Skipped: {skipped_count}")
                continue

            noun = Noun(word=word, cases_pojed={}, cases_mnoga={}, cases_menska={})
            result1, result2 = scraper.scrape_declension(word)

            word_success = False
            for field, result in { "cases_pojed": result1, "cases_mnoga": result2 }.items():
                if result:
                    cases = scraper.format_declension_result(result)
                    setattr(noun, field, cases)
                    word_success = True
                else:
                    logger.warning(f"Failed to scrape {field} for: {word}")

            if word_success:
                result_data = {
                    "word": word,
                    "cases_pojed": noun.cases_pojed,
                    "cases_mnoga": noun.cases_mnoga
                }
                logger.info(f"SUCCESS: {word} -> {json.dumps(result_data, ensure_ascii=False)}")
                success_count += 1

                # Only add to database if scraping was successful
                db.add(noun)
                db.commit()
            else:
                logger.error(f"FAILED: Complete failure for word: {word}")
                failed_count += 1

            # Console counter (this will show progress)
            print(f"Progress: {processed_count}/{len(words)} ({processed_count/len(words)*100:.1f}%) | Success: {success_count} | Failed: {failed_count} | Skipped: {skipped_count}")

            # Only sleep if we actually scraped (not if we skipped)
            if not existing_noun:
                sleep(2)

    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
        print(f"\nScraping interrupted. Progress: {processed_count}/{len(words)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
    finally:
        logger.info(f"Session completed. Processed: {processed_count}, Success: {success_count}, Failed: {failed_count}, Skipped: {skipped_count}")
        print(f"\nFinal results: {processed_count} processed, {success_count} successful, {failed_count} failed, {skipped_count} skipped")
        print(f"Log file saved to: {log_filename}")
        db.close()
