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

words = [
    "Droga", "Hiszpania", "Jowisz", "Księżyc", "Mars", "Merkury", "Neptun",
    "Niemcy", "Pluton", "Saturn", "Słońce", "USB", "Uran", "Wenus", "Włochy",
    "Ziemia", "absynt", "adres", "agrest", "akademik", "akordeon", "aktor",
    "aktorka", "aleja", "alergia", "alkohol", "altówka", "amerykanin", "ananas",
    "angielka", "anglik", "anioł", "anyż", "aplikacja", "apteczka", "apteka",
    "arbuz", "architekt", "architektura", "arcydzieło", "artykuł", "artykuły",
    "asekuracja", "astronomia", "autobus", "autokar", "autor", "autostrada",
    "babcia", "badminton", "bagietka", "bajka", "bakalie", "bakłażan",
    "baletnica", "balkon", "balon", "balsam", "banan", "bandaż", "bank",
    "bankiet", "bar", "bark", "barman", "barszcz", "barwa", "baseball",
    "bazylia", "baśń", "bażant", "beletrystyka", "bezpieczeństwa", "bezsenność",
    "biblioteka", "biedronka", "biegunka", "bilard", "bilet", "bimber",
    "biodro", "biografia", "biologia", "bita", "biurko", "biurowiec",
    "biustonosz", "biżuteria", "blok", "blokowisko", "bluza", "bluzka",
    "bocian", "boczek", "boisko", "boks", "bramka", "bramkarz", "bransoletka",
    "branża", "brat", "bratanek", "bratanica", "bretońsku", "brew", "broda",
    "brokuł", "broszka", "broń", "bruzda", "brwi", "brydż", "bryndza",
    "brzoskwinia", "brzuch", "budowla", "budynek", "budyń", "bulion", "burak",
    "bursztyn", "burza", "butelek", "buty", "bułka", "byk", "bóbr", "ból",
    "błyskawica", "błyszczyk", "camping", "całoksztalt", "cebula", "cecha",
    "centrum", "cewka", "chałka", "chałwa", "chemia", "chipsy", "chińczyk",
    "chleb", "chlebak", "chochla", "chodnik", "chomik", "choroba", "chrzan",
    "chrząszcz", "chusteczka", "chwila", "chłopak", "chłopiec", "ciasta",
    "ciastko", "ciasto", "ciała", "ciało", "cienie", "cień", "ciocia", "cios",
    "ciuch", "ciężarówka", "ciśnienie", "cmentarz", "cukier", "cukierek",
    "cukiernicze", "cukierniczka", "cukinia", "cydr", "cykoria", "cynamon",
    "czajnik", "czapka", "czapla", "czas", "czasopismo", "czaszka", "czekolada",
    "czelność", "czereśnia", "czerwiec", "cześć", "czosnek", "czoło",
    "czołówka", "czwartek", "czynnik", "czytanie", "czytelnik", "cząber",
    "część", "córka", "cło", "dach", "daktyl", "danie", "datek", "decyzja",
    "dekada", "delfin", "dentysta", "dentystka", "deser", "deskorolka",
    "deszcz", "deszczem", "dezodorant", "dieta", "dinozaur", "dla", "do",
    "doba", "dobranoc", "dodatek", "doktor", "doktorat", "dolewka", "dom",
    "domino", "dostarczenie", "dostawa", "doświadczenie", "dramat", "dres",
    "dreszcz", "dreszcze", "drewno", "drink", "droga", "drogeria", "drożdżówka",
    "druk", "drukarka", "drzewo", "drzwi", "drób", "drążek", "dupa", "durszlak",
    "dworzec", "dwudziestka", "dymka", "dynia", "dyrektor", "dyrygent", "dywan",
    "dywanik", "dzban", "dzbanek", "dziadek", "dziadkowie", "dzieci", "dziecko",
    "dziedziczność", "dziedziniec", "dzielnica", "dziennikarka", "dziennikarz",
    "dzierżawczy", "dzień", "dzik", "dziura", "dziurkacz", "dzięcioł", "dzwon",
    "dłoń", "długopis", "dźwig", "dźwięk", "dżdżownica", "dżem", "dżuma",
    "edukacja", "egzamin", "ekonomia", "ekspedient", "ekspedientka", "emeryt",
    "emerytka", "etyka", "fabryka", "facet", "fachowiec", "faktu", "fala",
    "fantastyka", "farba", "fartuch", "fasola", "fasolka", "ferie", "fiction",
    "filet", "filiżanka", "filologia", "filozofia", "fizyka", "flaming", "flet",
    "foka", "fortepian", "fotel", "frajda", "francuzka", "frytki",
    "frytkownica", "funt", "gabinet", "gad", "galaktyka", "galareta",
    "galaretka", "ganek", "garaż", "garderoba", "gardło", "garnek", "garnitur",
    "gatunek", "gałka", "geografia", "gimnastyka", "gimnazjum", "gips",
    "gitara", "golenia", "golf", "golonka", "gorczyca", "goryl", "gorączka",
    "gotówka", "gołoledź", "gołąb", "gra", "grad", "granat", "grochówka",
    "groszek", "grudzień", "gruszka", "gruzja", "grzanka", "grzebień", "grzmot",
    "grzyb", "grzywka", "gulasz", "guma", "gumka", "gust", "guzek", "guzik",
    "gwarancja", "gwiazda", "gwiazdozbiór", "góra", "gęś", "głaz", "główka",
    "hala", "harfa", "harmonijka", "hasło", "hałas", "helikopter",
    "herbaciarnia", "herbata", "herbatnik", "hipopotam", "historia", "hiszpan",
    "hobby", "hokej", "homar", "horror", "hulajnoga", "huragan", "hydraulik",
    "iglica", "igła", "ilość", "imbir", "imię", "impreza", "indyk",
    "informacja", "informatyka", "instrument", "inwalidzki", "inżynier",
    "jabłecznik", "jabłko", "jadalnia", "jadłospis", "jagoda", "jajecznica",
    "jajka", "jajko", "japończyk", "jaskinia", "jaskółka", "jastrząb",
    "jaszczurka", "jeansy", "jedzenie", "jeleń", "jesień", "jezdnia", "jezioro",
    "jeździectwo", "jeż", "jogurt", "jubiler", "język", "kabel", "kac",
    "kaczka", "kakao", "kalafior", "kalendarz", "kameleon", "kamienica",
    "kamizelka", "kanapa", "kanapka", "kanarek", "kangur", "kapelusz",
    "kapusta", "karaluch", "karetka", "kark", "karmnik", "karnet", "kartkówka",
    "kartofel", "karty", "kasza", "kaszanka", "kaszel", "katar", "kawa",
    "kawaler", "kawiarnia", "kawior", "kawy", "kciuk", "keczup", "kefir",
    "kelner", "kibic", "kieliszek", "kierowca", "kierunek", "kieszeń",
    "kiełbasa", "kijanka", "kino", "kiosk", "kisiel", "kiwi", "klapki",
    "klarnet", "klasa", "klatka", "klawiatura", "klej", "kleszcz", "klient",
    "klimatyzacja", "klub", "klucz", "kmin", "knajpa", "knajpka", "kobieta",
    "koc", "kocię", "kod", "kogut", "kokos", "koktajl", "kolacja", "kolano",
    "kolczyk", "kolczyki", "kolejka", "kolekcja", "kolendra", "koleżanka",
    "koliber", "kolokwium", "kolor", "komar", "kometa", "komiks", "komin",
    "kominek", "komisariat", "komoda", "kompot", "kompozytor", "komputer",
    "komórka", "koncentrat", "konfekcja", "konfitura", "konkubent",
    "konsternacja", "kontrabas", "konturówka", "kontynent", "kopalnia", "koper",
    "koperek", "korale", "korek", "korektor", "korkociąg", "kornik", "kort",
    "korytarz", "kos", "kosmetyki", "kostium", "kostka", "kosz", "koszula",
    "koszulka", "koszykówka", "kot", "kotlet", "kowal", "koza", "kozica",
    "kołdra", "kołnierz", "koło", "koń", "kości", "kościół", "kość", "krawat",
    "kreda", "kredka", "krem", "kret", "krew", "krewni", "krogulec", "krojenia",
    "krokodyl", "kruk", "krzesło", "krzyżówka", "królik", "krąg", "kręgle",
    "kręgosłup", "kserokopiarka", "książka", "książki", "księgarnia", "księżyc",
    "kubek", "kucharz", "kuchenka", "kuchnia", "kucyk", "kukurydza", "kukułka",
    "kula", "kultura", "kura", "kurczak", "kurkuma", "kuropatwa", "kurtka",
    "kuzyn", "kuzynka", "kwadrans", "kwartał", "kwas", "kwiaciarnia",
    "kwiecień", "kąpiel", "kąsek", "kęs", "kłódka", "lakier", "lampa", "lampka",
    "las", "lato", "legitymacja", "lek", "lekarka", "lekarstwo", "lekarz",
    "lekcja", "lekki", "lekkoatletyka", "len", "lew", "licencjat", "liceum",
    "licytacja", "liczba", "linijka", "lipiec", "lis", "list", "listonosz",
    "listonoszka", "listopad", "literatura", "literówka", "litwin", "litwinka",
    "liść", "lodowiec", "lody", "lodziarnia", "lodówka", "lokówka", "los",
    "lotnisko", "lustro", "luty", "lęk", "macierzanka", "macocha", "magister",
    "magisterka", "maj", "majonez", "majtki", "makaron", "makijaż", "makowiec",
    "malarka", "malarz", "mama", "mandarynka", "mango", "mapa", "marchewka",
    "marynarka", "marynarz", "marzec", "maseczka", "maszynka", "masło",
    "matematyka", "matka", "matura", "małpa", "małżeństwo", "maślanka", "meble",
    "melodia", "melon", "metal", "metro", "mewa", "miara", "miasto", "miejsce",
    "miesiąc", "migdał", "mikrofalówka", "minuta", "miotacz", "mistrz",
    "mistrzostwa", "mit", "mizeria", "miód", "miękko", "mięsa", "mięsem",
    "mięsień", "mięso", "mięta", "miłość", "mleka", "mleko", "mnóstwo",
    "modliszka", "mop", "morela", "mors", "morze", "most", "motocykl", "motyl",
    "mrówka", "mróz", "mucha", "mur", "muszka", "musztarda", "muzeum", "muzyk",
    "muzyka", "mydło", "mysz", "myszka", "mózg", "mąka", "mąż", "męka",
    "mężatka", "młodzieniec", "mżawka", "nabiał", "naczynie", "naczyń",
    "nadawca", "nadgarstek", "nadwaga", "nagranie", "nalewka", "naleśniki",
    "namiot", "napiwek", "napięcie", "napoje", "napój", "narciarstwo",
    "narodowość", "narty", "narzędzie", "naszyjnik", "nauczyciel",
    "nauczycielka", "nazwisko", "nerka", "nerw", "niedziela", "niedźwiedź",
    "niemowlę", "nieobecność", "nietoperz", "nić", "noc", "noga", "nos",
    "nosorożec", "nowela", "nurkowanie", "nów", "nóż", "nędza", "obcy",
    "obecność", "obiad", "obieraczka", "obniżka", "obojczyk", "obraz", "obrus",
    "obrzeże", "obrączka", "obsługa", "oburzenie", "obwarzanek", "obwód",
    "obywatelstwo", "obój", "obóz", "obłok", "ocean", "ocet", "oczu", "odbyt",
    "odcień", "oddział", "odkurzacz", "odporność", "odpowiedź", "odzież",
    "ofiara", "ogień", "ognisko", "ogrzewanie", "ogórek", "ojciec", "okap",
    "okno", "oko", "okoliczność", "okres", "okulary", "okładka", "olej",
    "oliwa", "omlet", "operacja", "opowiadanie", "opowieść", "orkiestra",
    "orzech", "orzeł", "osa", "osiedle", "osioł", "otręby", "otwarcie",
    "otwieracz", "owad", "owca", "owoc", "owsianka", "ozdoba", "ołówek",
    "ośrodek", "pacjent", "paczka", "pająk", "palec", "paluch", "pamiętnik",
    "pamięć", "pan", "pani", "panienka", "papieros", "papryka", "papuga",
    "paragon", "parasol", "parking", "parkomat", "parter", "parówka", "pasek",
    "pasja", "pasmanteria", "pasożyt", "pasta", "pasztet", "patelnia", "paw",
    "paznokci", "paznokieć", "pazur", "pałeczki", "państwo", "październik",
    "pchła", "pedagogika", "pendrive", "penis", "pensja", "perfumy", "perkusja",
    "pet", "pełnia", "piasek", "pidżama", "piec", "pieczeń", "pieczywo", "pieg",
    "piekarnia", "piekarnik", "pielęgniarka", "pielęgniarz", "pieniądze",
    "pieprz", "pieprzniczka", "pieprzyk", "piernik", "pierogi", "pierś",
    "pierścionek", "pies", "pieszych", "pietruszka", "pigułka", "pijawka",
    "pilot", "ping-pong", "pingwin", "pionek", "piorun", "piosenka",
    "piosenkarka", "pisarka", "pisarz", "pisklę", "piwnica", "piwo", "pizzeria",
    "piątek", "pięta", "piętro", "piłka", "piłkarz", "plac", "placek",
    "planeta", "plaster", "plastik", "plecak", "plecy", "plik", "plotkarka",
    "pluskwa", "po", "pochwa", "pociecha", "pociąg", "poczta", "początkujący",
    "pod", "podkoszulek", "podróżnicza", "podstawówka", "podudzie", "poduszka",
    "podwieczorek", "podziw", "podłoga", "poeta", "poetka", "poezja", "pogoda",
    "pogody", "pojazd", "poker", "pokolenie", "pokrywka", "pokój", "policjant",
    "policzek", "politologia", "polka", "polonistyka", "pomarańcza", "pomidor",
    "pomysł", "poniedziałek", "popiół", "popołudnie", "por", "pora", "poranek",
    "portfel", "porywisty", "porzeczka", "posiłek", "potrawa", "potylica",
    "powidła", "powiek", "powieka", "powietrze", "powieść", "powodzenia",
    "powódź", "poziom", "południe", "pończochy", "pośladek", "pożar",
    "pożywienie", "pożądanie", "pracownik", "pralka", "prawda", "prawnik",
    "prawo", "precel", "problem", "profesor", "prognoza", "programista", "prom",
    "prosię", "prowizja", "prysznic", "przebój", "przeciwieństwo",
    "przedmieście", "przedmiot", "przedpokój", "przedpołudnie", "przedramię",
    "przedsiębiorca", "przedsiębiorczość", "przedsięwzięcie", "przedszkole",
    "przeglądarka", "przejście", "przekroczenie", "przemoc", "przepiórka",
    "przerażenie", "przerwa", "przestrzeń", "przesąd", "przetrwanie",
    "przeziębienie", "przełęcz", "prześcieradło", "przybysz", "przychodnia",
    "przyczepa", "przyimek", "przyjaciel", "przyjaciółka", "przyjaźń",
    "przymiotnik", "przymrozek", "przyprawa", "przystanek", "przystawka",
    "próg", "prąd", "psychologia", "pszczoła", "ptak", "puchacz", "puder",
    "pudełko", "pustynia", "półka", "północ", "półrocze", "półwysep", "pączek",
    "pęcherz", "pęczek", "pęd", "pędzel", "pędzelek", "pępek", "pętla",
    "płaszcz", "płatki", "płatność", "płaz", "płeć", "płuco", "płyta",
    "pływanie", "rachunek", "rajstopy", "rakieta", "ramię", "randka", "rano",
    "ratunek", "ratusz", "razem", "recenzja", "recepta", "regal", "regał",
    "religia", "restauracja", "reszta", "rezerwacja", "reżyser", "robak",
    "rocznica", "rodzeństwo", "rodzice", "rogal", "rok", "roku", "rolada",
    "rolnik", "romans", "rondel", "rondo", "ropucha", "rosjanka", "roszczenie",
    "rosół", "rower", "rozmaryn", "rozmiar", "rozwód", "rumianek", "rura",
    "ryba", "rynek", "ryzyko", "ryś", "ryż", "rzecz", "rzeczownik",
    "rzeczywistość", "rzeka", "rzemiosło", "rzepa", "rzutnik", "rzęs", "rzęsa",
    "róg", "róż", "ręcznik", "ręka", "rękaw", "rękawiczki", "ręki", "saksofon",
    "sala", "salamandra", "salami", "salon", "salwa", "samochód", "samolot",
    "samoobsługa", "samoopalacz", "satyra", "sałata", "sałatka", "schab",
    "schody", "science", "segregator", "sekretarka", "sekretarz", "sekunda",
    "seler", "semestr", "sepia", "ser", "serce", "seria", "sernik", "serwetka",
    "sezam", "siatka", "siatkówka", "siekiera", "sielanka", "sierpień", "sieć",
    "sikorka", "siniak", "siodło", "siostra", "siostrzenica", "siostrzeniec",
    "sitko", "siłownia", "skaner", "skarpeta", "skarpetki", "sklep",
    "skowronek", "skrzypce", "skrzyżowanie", "skuteczność", "skóra", "smak",
    "smalec", "smycz", "smyczek", "sobota", "socjologia", "sofa", "sok",
    "solniczka", "sos", "sosjerka", "spawacz", "spinacz", "spodek", "spodnie",
    "spojrzenie", "spokój", "sport", "sposób", "społeczeństwie", "sprawa",
    "sprawdzian", "sprawozdanie", "sprzątaczka", "sprzęt", "spódnica", "srebro",
    "sroka", "ssak", "stacja", "stan", "stanik", "stanowisko", "starcie",
    "staruszek", "statek", "staw", "sterta", "stolik", "stonoga", "stopa",
    "stołówka", "strata", "strefa", "stroj", "struś", "strych", "stryjek",
    "strzykawka", "strzęp", "strój", "styczeń", "stypendium", "stół", "sufit",
    "sukces", "sukienka", "supeł", "suseł", "suszarka", "sutek", "suwak",
    "sweter", "sworzeń", "sygnalizacja", "sylweta", "sylwetka", "syn",
    "sypialnia", "szachownica", "szachy", "szacunek", "szafa", "szafka",
    "szafran", "szalik", "szampan", "szampon", "szarlotka", "szatnia",
    "szałwia", "szczenię", "szczepionka", "szczoteczka", "szczotka", "szczupak",
    "szczur", "szczypiorek", "szczypiorniak", "szczyt", "szczęka", "szczęście",
    "szelki", "szermierka", "szklanka", "szkoła", "szkło", "szlafrok", "szmer",
    "szminka", "sznur", "sznurówki", "szorty", "szosa", "szpak", "szparagi",
    "szpatułka", "szpinak", "szpital", "sztućce", "szuflada", "szwagier",
    "szyba", "szycie", "szyja", "szyld", "szympans", "szynka", "sól", "sąd",
    "sąsiadka", "sędzia", "sęp", "słaby", "słodycze", "słoik", "słowik",
    "słownik", "słoń", "tabletka", "taboret", "taca", "taksówka", "talerz",
    "talia", "taras", "tarcza", "tarczyca", "tarka", "tata", "taśma", "teatr",
    "telewizor", "temperówka", "tenis", "test", "teść", "toaleta", "tom",
    "torba", "torebka", "tors", "tort", "tożsamość", "tramwaj", "transport",
    "trener", "treść", "trolejbus", "trufle", "truskawka", "tryb", "trzepaczka",
    "trzustka", "trzęsienie", "trąbka", "tsunami", "tusz", "tułów", "tuńczyk",
    "twardo", "twarożek", "twarz", "twaróg", "tydzień", "tygrys", "tymianek",
    "tytoń", "tęcza", "tło", "ubieganie", "ubranie", "ucho", "uczelnia",
    "uczta", "uderzenie", "udo", "ufność", "uiszczenie", "układ", "ulica",
    "uniwersytet", "upał", "urzędniczka", "urzędnik", "usta", "ustawa", "utwór",
    "użytkownik", "używka", "wada", "wafel", "waga", "wahadło", "wakacje",
    "wanilia", "warga", "warkocz", "warsztat", "warunek", "warzywa",
    "warzywniak", "warzywo", "waza", "wałek", "ważka", "weekend", "wejście",
    "wiadukt", "wiara", "wiatr", "widelec", "wieczór", "wiedza", "wiek",
    "wielbłąd", "wieloryb", "wiersz", "wiewiórka", "wieś", "wieżowiec", "wilk",
    "winda", "wino", "winogrono", "wiolonczela", "wiśnia", "wnuczka", "wnuk",
    "woda", "woreczek", "wpływ", "wrzesień", "wróbel", "wsparcie", "wspinanie",
    "wstążka", "wstęp", "wtorek", "wujek", "wulkan", "wybrzeże", "wychowanie",
    "wychowawca", "wydarzenie", "wydawca", "wydawnictwo", "wydra", "wygląd",
    "wyjście", "wykaz", "wykałaczka", "wykształcenie", "wykład", "wymioty",
    "wynik", "wynos", "wypadek", "wypracowanie", "wyroby", "wysiłek",
    "wysokość", "wyspa", "wystawa", "wytrzymałość", "wywiad", "wyścig",
    "wyśmienity", "wyżywienie", "wzgórze", "wzor", "wzrok", "wódka", "wózek",
    "wąs", "wątpienie", "wątpliwość", "wątroba", "wątróbka", "wąż", "wędka",
    "wędkarstwo", "wędrówka", "węzeł", "władza", "włoch", "włosy", "włoszka",
    "włosów", "włóczka", "zabaw", "zachmurzenie", "zagłada", "zaimek", "zając",
    "zakaz", "zakażenie", "zakres", "zakupy", "zakładka", "zaległość", "zaleta",
    "zalotka", "zamieć", "zamrażalnik", "zamówienie", "zaparcie", "zarzut",
    "zarządzanie", "zasada", "zasobnik", "zastawa", "zastrzyk", "zaszczyt",
    "zatrucie", "zauroczenie", "zaułek", "zawartość", "zawieszka", "zawodnik",
    "zawód", "założenie", "załącznik", "zbrodnia", "zdanie", "zdrajca",
    "zdrowie", "ze", "zebra", "zebranie", "zegar", "zegarek", "zespoł",
    "zestaw", "zeszyt", "ziarno", "ziele", "ziemi", "ziemniak", "ziemniaki",
    "zima", "ziomek", "zioła", "zięć", "zlecenie", "zlew", "zmierzch",
    "zmywarka", "zmęczenie", "znaczek", "zsiadłe", "zszywacz", "zupa",
    "zwierzę", "związek", "zwycięstwo", "ząb", "złoto", "złotówka", "złudzenie",
    "złącze", "ćma", "łabędź", "ładowarka", "łapówka", "łasica", "łasuch",
    "ława", "ławica", "ławka", "łazienka", "łańcuch", "łeb", "łokieć",
    "łopatka", "łotwa", "łotysz", "łoś", "łucznictwo", "łydka", "łyżeczka",
    "łyżka", "łyżwiarstwo", "łyżwy", "łódka", "łódź", "łóżko", "łąka",
    "ścierka", "ścieżka", "ścięgno", "śliwka", "ślusarz", "śmieci", "śmietanka",
    "śniadanie", "śnieg", "śniegiem", "śnieżyca", "śpiwór", "środa", "środki",
    "świder", "świerszcz", "świnia", "świnka", "świstak", "świt", "świątynia",
    "święto", "źrebię", "źródło", "żaba", "żaglówka", "żarówka", "żbik",
    "żeberka", "żebro", "żeglarstwo", "żel", "żelazo", "żmija", "żonkil",
    "żołnierz", "żołądek", "żrebię", "żrenica", "żubr", "żuraw", "życie",
    "żyrafa", "żyrandol", "żyto", "żyła", "żółty", "żółw", "żłobek"]


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
    existing_word_set = {word[0] for word in existing_words}
    words_to_scrape = [word for word in words if word not in existing_word_set]
    words_already_exist = len(words) - len(words_to_scrape)

    logger.info(f"Words already in database: {words_already_exist}")
    logger.info(f"Words to scrape: {len(words_to_scrape)}")
    print(f"📊 Database status: {words_already_exist} words exist, {len(words_to_scrape)} to scrape")

    processed_count = 0
    success_count = 0
    failed_count = 0
    skipped_count = 0

    try:
        for word in words:
            processed_count += 1

            # Check if word already exists in database
            existing_noun = db.query(Noun).filter(Noun.word == word).first()
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
