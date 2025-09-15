--
-- PostgreSQL database dump
--

\restrict HtU8CPOybfZ77KwmYVQ3dBmyqUS4EnTDSDkcgGns7ZrwkKagh9KwbOeyLC2x8Zi

-- Dumped from database version 15.13
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: nouns; Type: TABLE; Schema: public; Owner: lingvar_user
--

CREATE TABLE public.nouns (
    id integer NOT NULL,
    word character varying(100) NOT NULL,
    cases_pojed jsonb NOT NULL,
    cases_mnoga jsonb NOT NULL,
    cases_menska jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.nouns OWNER TO lingvar_user;

--
-- Name: nouns_id_seq; Type: SEQUENCE; Schema: public; Owner: lingvar_user
--

CREATE SEQUENCE public.nouns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nouns_id_seq OWNER TO lingvar_user;

--
-- Name: nouns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lingvar_user
--

ALTER SEQUENCE public.nouns_id_seq OWNED BY public.nouns.id;


--
-- Name: pronouns; Type: TABLE; Schema: public; Owner: lingvar_user
--

CREATE TABLE public.pronouns (
    id integer NOT NULL,
    word character varying(100) NOT NULL,
    cases jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.pronouns OWNER TO lingvar_user;

--
-- Name: pronouns_id_seq; Type: SEQUENCE; Schema: public; Owner: lingvar_user
--

CREATE SEQUENCE public.pronouns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pronouns_id_seq OWNER TO lingvar_user;

--
-- Name: pronouns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lingvar_user
--

ALTER SEQUENCE public.pronouns_id_seq OWNED BY public.pronouns.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: lingvar_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    is_active boolean,
    is_superuser boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO lingvar_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: lingvar_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO lingvar_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lingvar_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verbs; Type: TABLE; Schema: public; Owner: lingvar_user
--

CREATE TABLE public.verbs (
    id integer NOT NULL,
    word character varying(100) NOT NULL,
    cases jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.verbs OWNER TO lingvar_user;

--
-- Name: verbs_id_seq; Type: SEQUENCE; Schema: public; Owner: lingvar_user
--

CREATE SEQUENCE public.verbs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.verbs_id_seq OWNER TO lingvar_user;

--
-- Name: verbs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lingvar_user
--

ALTER SEQUENCE public.verbs_id_seq OWNED BY public.verbs.id;


--
-- Name: nouns id; Type: DEFAULT; Schema: public; Owner: lingvar_user
--

ALTER TABLE ONLY public.nouns ALTER COLUMN id SET DEFAULT nextval('public.nouns_id_seq'::regclass);


--
-- Name: pronouns id; Type: DEFAULT; Schema: public; Owner: lingvar_user
--

ALTER TABLE ONLY public.pronouns ALTER COLUMN id SET DEFAULT nextval('public.pronouns_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: lingvar_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verbs id; Type: DEFAULT; Schema: public; Owner: lingvar_user
--

ALTER TABLE ONLY public.verbs ALTER COLUMN id SET DEFAULT nextval('public.verbs_id_seq'::regclass);


--
-- Data for Name: nouns; Type: TABLE DATA; Schema: public; Owner: lingvar_user
--

COPY public.nouns (id, word, cases_pojed, cases_mnoga, cases_menska, created_at, updated_at) FROM stdin;
2	kobieta	{"biernik": "kobietę", "wołacz": "kobieto", "celownik": "kobiecie", "mianownik": "kobieta", "narzędnik": "kobietą", "dopełniacz": "kobiety", "miejscownik": "kobiecie"}	{}	{}	2025-07-03 19:22:39.409013+00	\N
3	mężczyzna	{"biernik": "mężczyznę", "wołacz": "mężczyzno", "celownik": "mężczyźnie", "mianownik": "mężczyzna", "narzędnik": "mężczyzną", "dopełniacz": "mężczyzny", "miejscownik": "mężczyźnie"}	{}	{}	2025-07-03 19:22:41.83023+00	\N
4	chłopiec	{"biernik": "chłopca", "wołacz": "chłopcze", "celownik": "chłopcu", "mianownik": "chłopiec", "narzędnik": "chłopcem", "dopełniacz": "chłopca", "miejscownik": "chłopcu"}	{}	{}	2025-07-03 19:22:44.140605+00	\N
5	dziewczyna	{"biernik": "dziewczynę", "wołacz": "dziewczyno", "celownik": "dziewczynie", "mianownik": "dziewczyna", "narzędnik": "dziewczyną", "dopełniacz": "dziewczyny", "miejscownik": "dziewczynie"}	{}	{}	2025-07-03 19:22:46.439833+00	\N
6	rodzina	{"biernik": "rodzinę", "wołacz": "rodzino", "celownik": "rodzinie", "mianownik": "rodzina", "narzędnik": "rodziną", "dopełniacz": "rodziny", "miejscownik": "rodzinie"}	{}	{}	2025-07-03 19:22:48.763143+00	\N
7	przyjaciel	{"biernik": "przyjaciela", "wołacz": "przyjacielu", "celownik": "przyjacielowi", "mianownik": "przyjaciel", "narzędnik": "przyjacielem", "dopełniacz": "przyjaciela", "miejscownik": "przyjacielu"}	{}	{}	2025-07-03 19:22:51.144926+00	\N
8	przyjaciółka	{"biernik": "przyjaciółkę", "wołacz": "przyjaciółko", "celownik": "przyjaciółce", "mianownik": "przyjaciółka", "narzędnik": "przyjaciółką", "dopełniacz": "przyjaciółki", "miejscownik": "przyjaciółce"}	{}	{}	2025-07-03 19:22:53.494042+00	\N
9	nauczyciel	{"biernik": "nauczyciela", "wołacz": "nauczycielu", "celownik": "nauczycielowi", "mianownik": "nauczyciel", "narzędnik": "nauczycielem", "dopełniacz": "nauczyciela", "miejscownik": "nauczycielu"}	{}	{}	2025-07-03 19:22:55.854618+00	\N
10	kot	{"biernik": "kota", "wołacz": "kocie", "celownik": "kotu", "mianownik": "kot", "narzędnik": "kotem", "dopełniacz": "kota", "miejscownik": "kocie"}	{}	{}	2025-07-03 19:22:58.232352+00	\N
11	pies	{"biernik": "psa", "wołacz": "psie", "celownik": "psu", "mianownik": "pies", "narzędnik": "psem", "dopełniacz": "psa", "miejscownik": "psie"}	{}	{}	2025-07-03 19:23:00.553019+00	\N
12	dom	{"biernik": "dom", "wołacz": "domie", "celownik": "domowi", "mianownik": "dom", "narzędnik": "domem", "dopełniacz": "domu", "miejscownik": "domu"}	{}	{}	2025-07-03 19:23:02.969723+00	\N
13	samochód	{"biernik": "samochód", "wołacz": "samochodzie", "celownik": "samochodowi", "mianownik": "samochód", "narzędnik": "samochodem", "dopełniacz": "samochodu", "miejscownik": "samochodzie"}	{}	{}	2025-07-03 19:23:05.306091+00	\N
14	książka	{"biernik": "książkę", "wołacz": "książko", "celownik": "książce", "mianownik": "książka", "narzędnik": "książką", "dopełniacz": "książki", "miejscownik": "książce"}	{}	{}	2025-07-03 19:23:07.581077+00	\N
15	komputer	{"biernik": "komputer", "wołacz": "komputerze", "celownik": "komputerowi", "mianownik": "komputer", "narzędnik": "komputerem", "dopełniacz": "komputera", "miejscownik": "komputerze"}	{}	{}	2025-07-03 19:23:09.898212+00	\N
16	telefon	{"biernik": "telefon", "wołacz": "telefonie", "celownik": "telefonowi", "mianownik": "telefon", "narzędnik": "telefonem", "dopełniacz": "telefonu", "miejscownik": "telefonie"}	{}	{}	2025-07-03 19:23:12.227919+00	\N
17	stół	{"biernik": "stół", "wołacz": "stole", "celownik": "stołowi", "mianownik": "stół", "narzędnik": "stołem", "dopełniacz": "stołu", "miejscownik": "stole"}	{}	{}	2025-07-03 19:23:14.558499+00	\N
18	dziecko	{"biernik": "dziecko", "wołacz": "dziecko", "celownik": "dziecku", "mianownik": "dziecko", "narzędnik": "dzieckiem", "dopełniacz": "dziecka", "miejscownik": "dziecku"}	{}	{}	2025-07-03 19:23:16.888128+00	\N
19	miasto	{"biernik": "miasto", "wołacz": "miasto", "celownik": "miastu", "mianownik": "miasto", "narzędnik": "miastem", "dopełniacz": "miasta", "miejscownik": "mieście"}	{}	{}	2025-07-03 19:23:19.298128+00	\N
20	wieś	{"biernik": "wieś", "wołacz": "wsi", "celownik": "wsi", "mianownik": "wieś", "narzędnik": "wsią", "dopełniacz": "wsi", "miejscownik": "wsi"}	{}	{}	2025-07-03 19:23:21.609972+00	\N
21	szkoła	{"biernik": "szkołę", "wołacz": "szkoło", "celownik": "szkole", "mianownik": "szkoła", "narzędnik": "szkołą", "dopełniacz": "szkoły", "miejscownik": "szkole"}	{}	{}	2025-07-03 19:23:23.999279+00	\N
22	praca	{"biernik": "pracę", "wołacz": "praco", "celownik": "pracy", "mianownik": "praca", "narzędnik": "pracą", "dopełniacz": "pracy", "miejscownik": "pracy"}	{}	{}	2025-07-03 19:23:26.281317+00	\N
23	ogród	{"biernik": "ogród", "wołacz": "ogrodzie", "celownik": "ogrodowi", "mianownik": "ogród", "narzędnik": "ogrodem", "dopełniacz": "ogrodu", "miejscownik": "ogrodzie"}	{}	{}	2025-07-03 19:23:28.640379+00	\N
24	drzewo	{"biernik": "drzewo", "wołacz": "drzewo", "celownik": "drzewu", "mianownik": "drzewo", "narzędnik": "drzewem", "dopełniacz": "drzewa", "miejscownik": "drzewie"}	{}	{}	2025-07-03 19:23:30.949607+00	\N
25	kwiat	{"biernik": "kwiat", "wołacz": "kwiecie", "celownik": "kwiatowi", "mianownik": "kwiat", "narzędnik": "kwiatem", "dopełniacz": "kwiatu", "miejscownik": "kwiecie"}	{}	{}	2025-07-03 19:23:33.272287+00	\N
26	miesiąc	{"biernik": "miesiąc", "wołacz": "miesiącu", "celownik": "miesiącowi", "mianownik": "miesiąc", "narzędnik": "miesiącem", "dopełniacz": "miesiąca", "miejscownik": "miesiącu"}	{}	{}	2025-07-03 19:23:35.653769+00	\N
27	miejsce	{"biernik": "miejsce", "wołacz": "miejsce", "celownik": "miejscu", "mianownik": "miejsce", "narzędnik": "miejscem", "dopełniacz": "miejsca", "miejscownik": "miejscu"}	{}	{}	2025-07-03 19:23:38.01106+00	\N
28	czas	{"biernik": "czas", "wołacz": "czasie", "celownik": "czasowi", "mianownik": "czas", "narzędnik": "czasem", "dopełniacz": "czasu", "miejscownik": "czasie"}	{}	{}	2025-07-03 19:23:40.332004+00	\N
29	jedzenie	{"biernik": "jedzenie", "wołacz": "jedzenie", "celownik": "jedzeniu", "mianownik": "jedzenie", "narzędnik": "jedzeniem", "dopełniacz": "jedzenia", "miejscownik": "jedzeniu"}	{}	{}	2025-07-03 19:23:45.040767+00	\N
30	miłość	{"biernik": "miłość", "wołacz": "miłości", "celownik": "miłości", "mianownik": "miłość", "narzędnik": "miłością", "dopełniacz": "miłości", "miejscownik": "miłości"}	{}	{}	2025-07-03 19:23:47.336172+00	\N
31	klucz	{"biernik": "klucz", "wołacz": "kluczu", "celownik": "kluczowi", "mianownik": "klucz", "narzędnik": "kluczem", "dopełniacz": "klucza", "miejscownik": "kluczu"}	{}	{}	2025-07-03 19:23:49.671939+00	\N
32	laptop	{"biernik": "laptop", "wołacz": "laptopie", "celownik": "laptopowi", "mianownik": "laptop", "narzędnik": "laptopem", "dopełniacz": "laptopu", "miejscownik": "laptopie"}	{}	{}	2025-07-03 19:23:51.996929+00	\N
33	rower	{"biernik": "rower", "wołacz": "rowerze", "celownik": "rowerowi", "mianownik": "rower", "narzędnik": "rowerem", "dopełniacz": "roweru", "miejscownik": "rowerze"}	{}	{}	2025-07-03 19:23:54.386006+00	\N
34	film	{"biernik": "film", "wołacz": "filmie", "celownik": "filmowi", "mianownik": "film", "narzędnik": "filmem", "dopełniacz": "filmu", "miejscownik": "filmie"}	{}	{}	2025-07-03 19:23:56.669938+00	\N
35	sport	{"biernik": "sport", "wołacz": "sporcie", "celownik": "sportowi", "mianownik": "sport", "narzędnik": "sportem", "dopełniacz": "sportu", "miejscownik": "sporcie"}	{}	{}	2025-07-03 19:23:58.980052+00	\N
36	zdrowie	{"biernik": "zdrowie", "wołacz": "zdrowie", "celownik": "zdrowiu", "mianownik": "zdrowie", "narzędnik": "zdrowiem", "dopełniacz": "zdrowia", "miejscownik": "zdrowiu"}	{}	{}	2025-07-03 19:24:01.277973+00	\N
37	tata	{"biernik": "tatę", "wołacz": "tato", "celownik": "tacie", "mianownik": "tata", "narzędnik": "tatą", "dopełniacz": "taty", "miejscownik": "tacie"}	{}	{}	2025-07-03 19:24:03.670756+00	\N
38	mama	{"biernik": "mamę", "wołacz": "mamo", "celownik": "mamie", "mianownik": "mama", "narzędnik": "mamą", "dopełniacz": "mamy", "miejscownik": "mamie"}	{}	{}	2025-07-03 19:24:06.074535+00	\N
39	brat	{"biernik": "brata", "wołacz": "bracie", "celownik": "bratu", "mianownik": "brat", "narzędnik": "bratem", "dopełniacz": "brata", "miejscownik": "bracie"}	{}	{}	2025-07-03 19:24:08.411946+00	\N
40	siostra	{"biernik": "siostrę", "wołacz": "siostro", "celownik": "siostrze", "mianownik": "siostra", "narzędnik": "siostrą", "dopełniacz": "siostry", "miejscownik": "siostrze"}	{}	{}	2025-07-03 19:24:10.752727+00	\N
41	dziadek	{"biernik": "dziadka", "wołacz": "dziadku", "celownik": "dziadkowi", "mianownik": "dziadek", "narzędnik": "dziadkiem", "dopełniacz": "dziadka", "miejscownik": "dziadku"}	{}	{}	2025-07-03 19:24:13.058849+00	\N
42	babcia	{"biernik": "babcię", "wołacz": "babciu", "celownik": "babci", "mianownik": "babcia", "narzędnik": "babcią", "dopełniacz": "babci", "miejscownik": "babci"}	{}	{}	2025-07-03 19:24:15.378729+00	\N
43	księżyc	{"biernik": "księżyc", "wołacz": "księżycu", "celownik": "księżycowi", "mianownik": "księżyc", "narzędnik": "księżycem", "dopełniacz": "księżyca", "miejscownik": "księżycu"}	{}	{}	2025-07-03 19:24:20.043726+00	\N
44	mleko	{"biernik": "mleko", "wołacz": "mleko", "celownik": "mleku", "mianownik": "mleko", "narzędnik": "mlekiem", "dopełniacz": "mleka", "miejscownik": "mleku"}	{}	{}	2025-07-03 19:24:22.368087+00	\N
45	chleb	{"biernik": "chleb", "wołacz": "chlebie", "celownik": "chlebowi", "mianownik": "chleb", "narzędnik": "chlebem", "dopełniacz": "chleba", "miejscownik": "chlebie"}	{}	{}	2025-07-03 19:24:24.74394+00	\N
46	woda	{"biernik": "wodę", "wołacz": "wodo", "celownik": "wodzie", "mianownik": "woda", "narzędnik": "wodą", "dopełniacz": "wody", "miejscownik": "wodzie"}	{}	{}	2025-07-03 19:24:27.040928+00	\N
47	herbata	{"biernik": "herbatę", "wołacz": "herbato", "celownik": "herbacie", "mianownik": "herbata", "narzędnik": "herbatą", "dopełniacz": "herbaty", "miejscownik": "herbacie"}	{}	{}	2025-07-03 19:24:29.345026+00	\N
48	kawa	{"biernik": "kawę", "wołacz": "kawo", "celownik": "kawie", "mianownik": "kawa", "narzędnik": "kawą", "dopełniacz": "kawy", "miejscownik": "kawie"}	{}	{}	2025-07-03 19:24:31.654329+00	\N
49	ciasto	{"biernik": "ciasto", "wołacz": "ciasto", "celownik": "ciastu", "mianownik": "ciasto", "narzędnik": "ciastem", "dopełniacz": "ciasta", "miejscownik": "cieście"}	{}	{}	2025-07-03 19:24:33.984185+00	\N
50	centrum	{"biernik": "centrum", "wołacz": "centrum", "celownik": "centrum", "mianownik": "centrum", "narzędnik": "centrum", "dopełniacz": "centrum", "miejscownik": "centrum"}	{}	{}	2025-07-03 19:24:41.101406+00	\N
51	sklep	{"biernik": "sklep", "wołacz": "sklepie", "celownik": "sklepowi", "mianownik": "sklep", "narzędnik": "sklepem", "dopełniacz": "sklepu", "miejscownik": "sklepie"}	{}	{}	2025-07-03 19:24:43.418916+00	\N
52	restauracja	{"biernik": "restaurację", "wołacz": "restauracjo", "celownik": "restauracji", "mianownik": "restauracja", "narzędnik": "restauracją", "dopełniacz": "restauracji", "miejscownik": "restauracji"}	{}	{}	2025-07-03 19:24:45.737771+00	\N
53	muzeum	{"biernik": "muzeum", "wołacz": "muzeum", "celownik": "muzeum", "mianownik": "muzeum", "narzędnik": "muzeum", "dopełniacz": "muzeum", "miejscownik": "muzeum"}	{}	{}	2025-07-03 19:24:48.076033+00	\N
54	imię	{"biernik": "imię", "wołacz": "imię", "celownik": "imieniu", "mianownik": "imię", "narzędnik": "imieniem", "dopełniacz": "imienia", "miejscownik": "imieniu"}	{}	{}	2025-07-03 19:24:50.382829+00	\N
55	nazwisko	{"biernik": "nazwisko", "wołacz": "nazwisko", "celownik": "nazwisku", "mianownik": "nazwisko", "narzędnik": "nazwiskiem", "dopełniacz": "nazwiska", "miejscownik": "nazwisku"}	{}	{}	2025-07-03 19:24:52.710419+00	\N
56	adres	{"biernik": "adres", "wołacz": "adresie", "celownik": "adresowi", "mianownik": "adres", "narzędnik": "adresem", "dopełniacz": "adresu", "miejscownik": "adresie"}	{}	{}	2025-07-03 19:24:55.093486+00	\N
57	telefon	{"biernik": "telefon", "wołacz": "telefonie", "celownik": "telefonowi", "mianownik": "telefon", "narzędnik": "telefonem", "dopełniacz": "telefonu", "miejscownik": "telefonie"}	{}	{}	2025-07-03 19:24:57.352734+00	\N
58	internet	{"biernik": "internet", "wołacz": "internecie", "celownik": "internetowi", "mianownik": "internet", "narzędnik": "internetem", "dopełniacz": "internetu", "miejscownik": "internecie"}	{}	{}	2025-07-03 19:25:02.166719+00	\N
59	las	{"biernik": "las", "wołacz": "lesie", "celownik": "lasowi", "mianownik": "las", "narzędnik": "lasem", "dopełniacz": "lasu", "miejscownik": "lesie"}	{}	{}	2025-07-03 19:25:04.523813+00	\N
60	morze	{"biernik": "morze", "wołacz": "morze", "celownik": "morzu", "mianownik": "morze", "narzędnik": "morzem", "dopełniacz": "morza", "miejscownik": "morzu"}	{}	{}	2025-07-03 19:25:06.810073+00	\N
61	krem	{"biernik": "krem", "wołacz": "kremie", "celownik": "kremowi", "mianownik": "krem", "narzędnik": "kremem", "dopełniacz": "kremu", "miejscownik": "kremie"}	{}	{}	2025-07-03 19:25:09.183783+00	\N
62	poniedziałek	{"biernik": "poniedziałek", "wołacz": "poniedziałku", "celownik": "poniedziałkowi", "mianownik": "poniedziałek", "narzędnik": "poniedziałkiem", "dopełniacz": "poniedziałku", "miejscownik": "poniedziałku"}	{}	{}	2025-07-03 19:25:11.53144+00	\N
63	wtorek	{"biernik": "wtorek", "wołacz": "wtorku", "celownik": "wtorkowi", "mianownik": "wtorek", "narzędnik": "wtorkiem", "dopełniacz": "wtorku", "miejscownik": "wtorku"}	{}	{}	2025-07-03 19:25:13.911539+00	\N
64	środa	{"biernik": "środę", "wołacz": "środo", "celownik": "środzie", "mianownik": "środa", "narzędnik": "środą", "dopełniacz": "środy", "miejscownik": "środzie"}	{}	{}	2025-07-03 19:25:16.218313+00	\N
65	czwartek	{"biernik": "czwartek", "wołacz": "czwartku", "celownik": "czwartkowi", "mianownik": "czwartek", "narzędnik": "czwartkiem", "dopełniacz": "czwartku", "miejscownik": "czwartku"}	{}	{}	2025-07-03 19:25:18.536698+00	\N
66	piątek	{"biernik": "piątek", "wołacz": "piątku", "celownik": "piątkowi", "mianownik": "piątek", "narzędnik": "piątkiem", "dopełniacz": "piątku", "miejscownik": "piątku"}	{}	{}	2025-07-03 19:25:20.865999+00	\N
67	sobota	{"biernik": "sobotę", "wołacz": "soboto", "celownik": "sobocie", "mianownik": "sobota", "narzędnik": "sobotą", "dopełniacz": "soboty", "miejscownik": "sobocie"}	{}	{}	2025-07-03 19:25:23.194051+00	\N
68	niedziela	{"biernik": "niedzielę", "wołacz": "niedzielo", "celownik": "niedzieli", "mianownik": "niedziela", "narzędnik": "niedzielą", "dopełniacz": "niedzieli", "miejscownik": "niedzieli"}	{}	{}	2025-07-03 19:25:25.561738+00	\N
69	kościół	{"biernik": "kościół", "wołacz": "kościele", "celownik": "kościołowi", "mianownik": "kościół", "narzędnik": "kościołem", "dopełniacz": "kościoła", "miejscownik": "kościele"}	{}	{}	2025-07-03 19:25:27.869944+00	\N
70	szpital	{"biernik": "szpital", "wołacz": "szpitalu", "celownik": "szpitalowi", "mianownik": "szpital", "narzędnik": "szpitalem", "dopełniacz": "szpitala", "miejscownik": "szpitalu"}	{}	{}	2025-07-03 19:25:30.174093+00	\N
71	apteka	{"biernik": "aptekę", "wołacz": "apteko", "celownik": "aptece", "mianownik": "apteka", "narzędnik": "apteką", "dopełniacz": "apteki", "miejscownik": "aptece"}	{}	{}	2025-07-03 19:25:32.503941+00	\N
72	stół	{"biernik": "stół", "wołacz": "stole", "celownik": "stołowi", "mianownik": "stół", "narzędnik": "stołem", "dopełniacz": "stołu", "miejscownik": "stole"}	{}	{}	2025-07-03 19:25:34.847865+00	\N
73	krzesło	{"biernik": "krzesło", "wołacz": "krzesło", "celownik": "krzesłu", "mianownik": "krzesło", "narzędnik": "krzesłem", "dopełniacz": "krzesła", "miejscownik": "krześle"}	{}	{}	2025-07-03 19:25:37.12743+00	\N
74	łóżko	{"biernik": "łóżko", "wołacz": "łóżko", "celownik": "łóżku", "mianownik": "łóżko", "narzędnik": "łóżkiem", "dopełniacz": "łóżka", "miejscownik": "łóżku"}	{}	{}	2025-07-03 19:25:39.516314+00	\N
75	okno	{"biernik": "okno", "wołacz": "okno", "celownik": "oknu", "mianownik": "okno", "narzędnik": "oknem", "dopełniacz": "okna", "miejscownik": "oknie"}	{}	{}	2025-07-03 19:25:41.895473+00	\N
76	drzwi	{"biernik": "", "wołacz": "", "celownik": "", "mianownik": "", "narzędnik": "", "dopełniacz": "", "miejscownik": ""}	{}	{}	2025-07-03 19:25:44.217671+00	\N
77	podłoga	{"biernik": "podłogę", "wołacz": "podłogo", "celownik": "podłodze", "mianownik": "podłoga", "narzędnik": "podłogą", "dopełniacz": "podłogi", "miejscownik": "podłodze"}	{}	{}	2025-07-03 19:25:46.51011+00	\N
78	ściana	{"biernik": "ścianę", "wołacz": "ściano", "celownik": "ścianie", "mianownik": "ściana", "narzędnik": "ścianą", "dopełniacz": "ściany", "miejscownik": "ścianie"}	{}	{}	2025-07-03 19:25:48.812395+00	\N
79	sufit	{"biernik": "sufit", "wołacz": "suficie", "celownik": "sufitowi", "mianownik": "sufit", "narzędnik": "sufitem", "dopełniacz": "sufitu", "miejscownik": "suficie"}	{}	{}	2025-07-03 19:25:51.125831+00	\N
80	kuchnia	{"biernik": "kuchnię", "wołacz": "kuchnio", "celownik": "kuchni", "mianownik": "kuchnia", "narzędnik": "kuchnią", "dopełniacz": "kuchni", "miejscownik": "kuchni"}	{}	{}	2025-07-03 19:25:53.5215+00	\N
81	łazienka	{"biernik": "łazienkę", "wołacz": "łazienko", "celownik": "łazience", "mianownik": "łazienka", "narzędnik": "łazienką", "dopełniacz": "łazienki", "miejscownik": "łazience"}	{}	{}	2025-07-03 19:25:55.848989+00	\N
82	pralka	{"biernik": "pralkę", "wołacz": "pralko", "celownik": "pralce", "mianownik": "pralka", "narzędnik": "pralką", "dopełniacz": "pralki", "miejscownik": "pralce"}	{}	{}	2025-07-03 19:25:58.179473+00	\N
83	lodówka	{"biernik": "lodówkę", "wołacz": "lodówko", "celownik": "lodówce", "mianownik": "lodówka", "narzędnik": "lodówką", "dopełniacz": "lodówki", "miejscownik": "lodówce"}	{}	{}	2025-07-03 19:26:00.503584+00	\N
84	mikrofalówka	{"biernik": "mikrofalówkę", "wołacz": "mikrofalówko", "celownik": "mikrofalówce", "mianownik": "mikrofalówka", "narzędnik": "mikrofalówką", "dopełniacz": "mikrofalówki", "miejscownik": "mikrofalówce"}	{}	{}	2025-07-03 19:26:02.852239+00	\N
85	zmywarka	{"biernik": "zmywarkę", "wołacz": "zmywarko", "celownik": "zmywarce", "mianownik": "zmywarka", "narzędnik": "zmywarką", "dopełniacz": "zmywarki", "miejscownik": "zmywarce"}	{}	{}	2025-07-03 19:26:05.207607+00	\N
86	bursztyn	{"biernik": "bursztyn", "wołacz": "bursztynie", "celownik": "bursztynowi", "mianownik": "bursztyn", "narzędnik": "bursztynem", "dopełniacz": "bursztynu", "miejscownik": "bursztynie"}	{}	{}	2025-07-03 19:26:07.471836+00	\N
87	srebro	{"biernik": "srebro", "wołacz": "srebro", "celownik": "srebru", "mianownik": "srebro", "narzędnik": "srebrem", "dopełniacz": "srebra", "miejscownik": "srebrze"}	{}	{}	2025-07-03 19:26:09.815412+00	\N
88	garnek	{"biernik": "garnek", "wołacz": "garnku", "celownik": "garnkowi", "mianownik": "garnek", "narzędnik": "garnkiem", "dopełniacz": "garnka", "miejscownik": "garnku"}	{}	{}	2025-07-03 19:26:12.123264+00	\N
89	patelnia	{"biernik": "patelnię", "wołacz": "patelnio", "celownik": "patelni", "mianownik": "patelnia", "narzędnik": "patelnią", "dopełniacz": "patelni", "miejscownik": "patelni"}	{}	{}	2025-07-03 19:26:14.486843+00	\N
90	sztućce	{"biernik": "", "wołacz": "", "celownik": "", "mianownik": "", "narzędnik": "", "dopełniacz": "", "miejscownik": ""}	{}	{}	2025-07-03 19:26:16.802641+00	\N
91	talerz	{"biernik": "talerz", "wołacz": "talerzu", "celownik": "talerzowi", "mianownik": "talerz", "narzędnik": "talerzem", "dopełniacz": "talerza", "miejscownik": "talerzu"}	{}	{}	2025-07-03 19:26:19.19508+00	\N
92	kubek	{"biernik": "kubek", "wołacz": "kubku", "celownik": "kubkowi", "mianownik": "kubek", "narzędnik": "kubkiem", "dopełniacz": "kubka", "miejscownik": "kubku"}	{}	{}	2025-07-03 19:26:21.595576+00	\N
93	szklanka	{"biernik": "szklankę", "wołacz": "szklanko", "celownik": "szklance", "mianownik": "szklanka", "narzędnik": "szklanką", "dopełniacz": "szklanki", "miejscownik": "szklance"}	{}	{}	2025-07-03 19:26:23.917823+00	\N
94	artysta	{"biernik": "artystę", "wołacz": "artysto", "celownik": "artyście", "mianownik": "artysta", "narzędnik": "artystą", "dopełniacz": "artysty", "miejscownik": "artyście"}	{}	{}	2025-07-03 19:26:26.209542+00	\N
95	pracownik	{"biernik": "pracownika", "wołacz": "pracowniku", "celownik": "pracownikowi", "mianownik": "pracownik", "narzędnik": "pracownikiem", "dopełniacz": "pracownika", "miejscownik": "pracowniku"}	{}	{}	2025-07-03 19:26:28.529562+00	\N
96	student	{"biernik": "studenta", "wołacz": "studencie", "celownik": "studentowi", "mianownik": "student", "narzędnik": "studentem", "dopełniacz": "studenta", "miejscownik": "studencie"}	{}	{}	2025-07-03 19:26:30.875653+00	\N
97	uczeń	{"biernik": "ucznia", "wołacz": "uczniu", "celownik": "uczniowi", "mianownik": "uczeń", "narzędnik": "uczniem", "dopełniacz": "ucznia", "miejscownik": "uczniu"}	{}	{}	2025-07-03 19:26:33.285393+00	\N
98	sportowiec	{"biernik": "sportowca", "wołacz": "sportowcusportowcze", "celownik": "sportowcowi", "mianownik": "sportowiec", "narzędnik": "sportowcem", "dopełniacz": "sportowca", "miejscownik": "sportowcu"}	{}	{}	2025-07-03 19:26:35.658117+00	\N
99	muzyk	{"biernik": "muzyka", "wołacz": "muzyku", "celownik": "muzykowi", "mianownik": "muzyk", "narzędnik": "muzykiem", "dopełniacz": "muzyka", "miejscownik": "muzyku"}	{}	{}	2025-07-03 19:26:38.001397+00	\N
100	pisarz	{"biernik": "pisarza", "wołacz": "pisarzu", "celownik": "pisarzowi", "mianownik": "pisarz", "narzędnik": "pisarzem", "dopełniacz": "pisarza", "miejscownik": "pisarzu"}	{}	{}	2025-07-03 19:26:40.400885+00	\N
101	inżynier	{"biernik": "inżyniera", "wołacz": "inżynierze", "celownik": "inżynierowi", "mianownik": "inżynier", "narzędnik": "inżynierem", "dopełniacz": "inżyniera", "miejscownik": "inżynierze"}	{}	{}	2025-07-03 19:26:42.767064+00	\N
102	lekarz	{"biernik": "lekarza", "wołacz": "lekarzu", "celownik": "lekarzowi", "mianownik": "lekarz", "narzędnik": "lekarzem", "dopełniacz": "lekarza", "miejscownik": "lekarzu"}	{}	{}	2025-07-03 19:26:45.069091+00	\N
103	naukowiec	{"biernik": "naukowca", "wołacz": "naukowcunaukowcze", "celownik": "naukowcowi", "mianownik": "naukowiec", "narzędnik": "naukowcem", "dopełniacz": "naukowca", "miejscownik": "naukowcu"}	{}	{}	2025-07-03 19:26:47.381103+00	\N
104	programista	{"biernik": "programistę", "wołacz": "programisto", "celownik": "programiście", "mianownik": "programista", "narzędnik": "programistą", "dopełniacz": "programisty", "miejscownik": "programiście"}	{}	{}	2025-07-03 19:26:49.741867+00	\N
105	kucharz	{"biernik": "kucharza", "wołacz": "kucharzu", "celownik": "kucharzowi", "mianownik": "kucharz", "narzędnik": "kucharzem", "dopełniacz": "kucharza", "miejscownik": "kucharzu"}	{}	{}	2025-07-03 19:26:52.054205+00	\N
106	sprzedawca	{"biernik": "sprzedawcę", "wołacz": "sprzedawco", "celownik": "sprzedawcy", "mianownik": "sprzedawca", "narzędnik": "sprzedawcą", "dopełniacz": "sprzedawcy", "miejscownik": "sprzedawcy"}	{}	{}	2025-07-03 19:26:54.36354+00	\N
107	fachowiec	{"biernik": "fachowca", "wołacz": "fachowcu", "celownik": "fachowcowi", "mianownik": "fachowiec", "narzędnik": "fachowcem", "dopełniacz": "fachowca", "miejscownik": "fachowcu"}	{}	{}	2025-07-03 19:26:56.652053+00	\N
108	architekt	{"biernik": "architekta", "wołacz": "architekcie", "celownik": "architektowi", "mianownik": "architekt", "narzędnik": "architektem", "dopełniacz": "architekta", "miejscownik": "architekcie"}	{}	{}	2025-07-03 19:26:59.021908+00	\N
109	projektant	{"biernik": "projektanta", "wołacz": "projektancie", "celownik": "projektantowi", "mianownik": "projektant", "narzędnik": "projektantem", "dopełniacz": "projektanta", "miejscownik": "projektancie"}	{}	{}	2025-07-03 19:27:01.332928+00	\N
110	dziennikarz	{"biernik": "dziennikarza", "wołacz": "dziennikarzu", "celownik": "dziennikarzowi", "mianownik": "dziennikarz", "narzędnik": "dziennikarzem", "dopełniacz": "dziennikarza", "miejscownik": "dziennikarzu"}	{}	{}	2025-07-03 19:27:03.671799+00	\N
111	fotograf	{"biernik": "fotografa", "wołacz": "fotografie", "celownik": "fotografowi", "mianownik": "fotograf", "narzędnik": "fotografem", "dopełniacz": "fotografa", "miejscownik": "fotografie"}	{}	{}	2025-07-03 19:27:06.073571+00	\N
112	gospodyni	{"biernik": "gospodynię", "wołacz": "gospodyni", "celownik": "gospodyni", "mianownik": "gospodyni", "narzędnik": "gospodynią", "dopełniacz": "gospodyni", "miejscownik": "gospodyni"}	{}	{}	2025-07-03 19:27:08.483037+00	\N
113	ludzie	{"biernik": "", "wołacz": "", "celownik": "", "mianownik": "", "narzędnik": "", "dopełniacz": "", "miejscownik": ""}	{}	{}	2025-07-03 19:27:13.418798+00	\N
115	państwo	{"biernik": "państwo", "wołacz": "państwo", "celownik": "państwu", "mianownik": "państwo", "narzędnik": "państwem", "dopełniacz": "państwa", "miejscownik": "państwie"}	{"biernik": "państwa", "wołacz": "państwa", "celownik": "państwom", "mianownik": "państwa", "narzędnik": "państwami", "dopełniacz": "państw", "miejscownik": "państwach"}	{}	2025-09-08 18:44:34.868309+00	\N
116	pani	{"biernik": "panią", "wołacz": "pani", "celownik": "pani", "mianownik": "pani", "narzędnik": "panią", "dopełniacz": "pani", "miejscownik": "pani"}	{"biernik": "panie", "wołacz": "panie", "celownik": "paniom", "mianownik": "panie", "narzędnik": "paniami", "dopełniacz": "pań", "miejscownik": "paniach"}	{}	2025-09-08 18:44:34.868309+00	\N
117	wampir	{"biernik": "wampira", "wołacz": "wampirze", "celownik": "wampirowi", "mianownik": "wampir", "narzędnik": "wampirem", "dopełniacz": "wampira", "miejscownik": "wampirze"}	{"biernik": "wampiry, wampirów", "wołacz": "wampiry, wampirzy, wampirowie, wampiry", "celownik": "wampirom", "mianownik": "wampiry, wampirzy, wampirowie, wampiry", "narzędnik": "wampirami", "dopełniacz": "wampirów", "miejscownik": "wampirach"}	{}	2025-09-13 09:07:06.414144+00	\N
118	krasnoludek	{"biernik": "krasnoludka", "wołacz": "krasnoludku", "celownik": "krasnoludkowi", "mianownik": "krasnoludek", "narzędnik": "krasnoludkiem", "dopełniacz": "krasnoludka", "miejscownik": "krasnoludku"}	{"biernik": "krasnoludki, krasnoludków", "wołacz": "krasnoludki, krasnoludkowie, krasnoludki", "celownik": "krasnoludkom", "mianownik": "krasnoludki, krasnoludkowie, krasnoludki", "narzędnik": "krasnoludkami", "dopełniacz": "krasnoludków", "miejscownik": "krasnoludkach"}	{}	2025-09-13 09:07:06.414144+00	\N
119	anioł	{"biernik": "anioła", "wołacz": "aniele", "celownik": "aniołowi", "mianownik": "anioł", "narzędnik": "aniołem", "dopełniacz": "anioła", "miejscownik": "aniele"}	{"biernik": "anioły, aniołów", "wołacz": "anioły, anieli, aniołowie, anioły", "celownik": "aniołom", "mianownik": "anioły, anieli, aniołowie, anioły", "narzędnik": "aniołami", "dopełniacz": "aniołów", "miejscownik": "aniołach"}	{}	2025-09-13 09:07:06.414144+00	\N
120	diabeł	{"biernik": "diabła", "wołacz": "diable", "celownik": "diabłu", "mianownik": "diabeł", "narzędnik": "diabłem", "dopełniacz": "diabła", "miejscownik": "diable"}	{"biernik": "diabły, diabłów", "wołacz": "diabły, diabli, diabły", "celownik": "diabłom", "mianownik": "diabły, diabli, diabły", "narzędnik": "diabłami", "dopełniacz": "diabłów", "miejscownik": "diabłach"}	{}	2025-09-13 09:07:06.414144+00	\N
121	walc	{"biernik": "walca", "wołacz": "walcu", "celownik": "walcowi", "mianownik": "walc", "narzędnik": "walcem", "dopełniacz": "walca", "miejscownik": "walcu"}	{"biernik": "walce", "wołacz": "walce", "celownik": "walcom", "mianownik": "walce", "narzędnik": "walcami", "dopełniacz": "walców", "miejscownik": "walcach"}	{}	2025-09-13 09:07:06.414144+00	\N
122	polonez	{"biernik": "poloneza", "wołacz": "polonezie", "celownik": "polonezowi", "mianownik": "polonez", "narzędnik": "polonezem", "dopełniacz": "poloneza", "miejscownik": "polonezie"}	{"biernik": "polonezy", "wołacz": "polonezy", "celownik": "polonezom", "mianownik": "polonezy", "narzędnik": "polonezami", "dopełniacz": "polonezów", "miejscownik": "polonezach"}	{}	2025-09-13 09:07:06.414144+00	\N
123	twist	{"biernik": "twist, twista", "wołacz": "twiście", "celownik": "twistowi", "mianownik": "twist", "narzędnik": "twistem", "dopełniacz": "twistu, twista", "miejscownik": "twiście"}	{"biernik": "twisty", "wołacz": "twisty", "celownik": "twistom", "mianownik": "twisty", "narzędnik": "twistami", "dopełniacz": "twistów", "miejscownik": "twistach"}	{}	2025-09-13 09:07:06.414144+00	\N
124	oberek	{"biernik": "oberka", "wołacz": "oberku", "celownik": "oberkowi", "mianownik": "oberek", "narzędnik": "oberkiem", "dopełniacz": "oberka", "miejscownik": "oberku"}	{"biernik": "oberki", "wołacz": "oberki", "celownik": "oberkom", "mianownik": "oberki", "narzędnik": "oberkami", "dopełniacz": "oberków", "miejscownik": "oberkach"}	{}	2025-09-13 09:07:06.414144+00	\N
125	tenis	{"biernik": "tenis, tenisa", "wołacz": "tenisie", "celownik": "tenisowi", "mianownik": "tenis", "narzędnik": "tenisem", "dopełniacz": "tenisa, tenisu", "miejscownik": "tenisie"}	{"biernik": "tenisy", "wołacz": "tenisy", "celownik": "tenisom", "mianownik": "tenisy", "narzędnik": "tenisami", "dopełniacz": "tenisów", "miejscownik": "tenisach"}	{}	2025-09-13 09:07:06.414144+00	\N
126	hokej	{"biernik": "hokeja, hokej", "wołacz": "hokeju", "celownik": "hokejowi", "mianownik": "hokej", "narzędnik": "hokejem", "dopełniacz": "hokeja", "miejscownik": "hokeju"}	{"biernik": "hokeje", "wołacz": "hokeje", "celownik": "hokejom", "mianownik": "hokeje", "narzędnik": "hokejami", "dopełniacz": "hokejów", "miejscownik": "hokejach"}	{}	2025-09-13 09:07:06.414144+00	\N
127	poker	{"biernik": "pokera", "wołacz": "pokerze", "celownik": "pokerowi", "mianownik": "poker", "narzędnik": "pokerem", "dopełniacz": "pokera", "miejscownik": "pokerze"}	{"biernik": "pokery", "wołacz": "pokery", "celownik": "pokerom", "mianownik": "pokery", "narzędnik": "pokerami", "dopełniacz": "pokerów", "miejscownik": "pokerach"}	{}	2025-09-13 09:07:06.414144+00	\N
128	brydż	{"biernik": "brydża", "wołacz": "brydżu", "celownik": "brydżowi", "mianownik": "brydż", "narzędnik": "brydżem", "dopełniacz": "brydża", "miejscownik": "brydżu"}	{"biernik": "brydże", "wołacz": "brydże", "celownik": "brydżom", "mianownik": "brydże", "narzędnik": "brydżami", "dopełniacz": "brydżów", "miejscownik": "brydżach"}	{}	2025-09-13 09:07:06.414144+00	\N
129	dolar	{"biernik": "dolara", "wołacz": "dolarze", "celownik": "dolarowi", "mianownik": "dolar", "narzędnik": "dolarem", "dopełniacz": "dolara", "miejscownik": "dolarze"}	{"biernik": "dolary", "wołacz": "dolary", "celownik": "dolarom", "mianownik": "dolary", "narzędnik": "dolarami", "dopełniacz": "dolarów", "miejscownik": "dolarach"}	{}	2025-09-13 09:07:06.414144+00	\N
130	jen	{"biernik": "jena", "wołacz": "jenie", "celownik": "jenowi", "mianownik": "jen", "narzędnik": "jenem", "dopełniacz": "jena", "miejscownik": "jenie"}	{"biernik": "jeny", "wołacz": "jeny", "celownik": "jenom", "mianownik": "jeny", "narzędnik": "jenami", "dopełniacz": "jenów", "miejscownik": "jenach"}	{}	2025-09-13 09:07:06.414144+00	\N
131	funt	{"biernik": "funta, funt", "wołacz": "funcie", "celownik": "funtowi", "mianownik": "funt", "narzędnik": "funtem", "dopełniacz": "funta", "miejscownik": "funcie"}	{"biernik": "funty", "wołacz": "funty", "celownik": "funtom", "mianownik": "funty", "narzędnik": "funtami", "dopełniacz": "funtów", "miejscownik": "funtach"}	{}	2025-09-13 09:07:06.414144+00	\N
132	rubel	{"biernik": "rubla", "wołacz": "rublu", "celownik": "rublowi", "mianownik": "rubel", "narzędnik": "rublem", "dopełniacz": "rubla", "miejscownik": "rublu"}	{"biernik": "ruble", "wołacz": "ruble", "celownik": "rublom", "mianownik": "ruble", "narzędnik": "rublami", "dopełniacz": "rubli", "miejscownik": "rublach"}	{}	2025-09-13 09:07:06.414144+00	\N
133	drink	{"biernik": "drinka", "wołacz": "drinku", "celownik": "drinkowi", "mianownik": "drink", "narzędnik": "drinkiem", "dopełniacz": "drinka", "miejscownik": "drinku"}	{"biernik": "drinki", "wołacz": "drinki", "celownik": "drinkom", "mianownik": "drinki", "narzędnik": "drinkami", "dopełniacz": "drinków", "miejscownik": "drinkach"}	{}	2025-09-13 09:07:06.414144+00	\N
134	szampan	{"biernik": "szampana, szampan", "wołacz": "szampanie", "celownik": "szampanowi", "mianownik": "szampan", "narzędnik": "szampanem", "dopełniacz": "szampana", "miejscownik": "szampanie"}	{"biernik": "szampany", "wołacz": "szampany", "celownik": "szampanom", "mianownik": "szampany", "narzędnik": "szampanami", "dopełniacz": "szampanów", "miejscownik": "szampanach"}	{}	2025-09-13 09:07:06.414144+00	\N
135	bourbon	{"biernik": "bourbona", "wołacz": "bourbonie", "celownik": "bourbonowi", "mianownik": "bourbon", "narzędnik": "bourbonem", "dopełniacz": "bourbona", "miejscownik": "bourbonie"}	{"biernik": "bourbony", "wołacz": "bourbony", "celownik": "bourbonom", "mianownik": "bourbony", "narzędnik": "bourbonami", "dopełniacz": "bourbonów", "miejscownik": "bourbonach"}	{}	2025-09-13 09:07:06.414144+00	\N
136	papieros	{"biernik": "papierosem", "wołacz": "papierosami", "celownik": "papierosy", "mianownik": "papieros", "narzędnik": "papierosom", "dopełniacz": "papierosach", "miejscownik": "papierosów"}	{"biernik": "papierosowi", "wołacz": "papierosie", "celownik": "papierosa", "mianownik": "papierosie", "narzędnik": "papierosy", "dopełniacz": "papierosa, papieros", "miejscownik": "papierosy"}	{}	2025-09-13 09:07:06.414144+00	\N
137	pet	{"biernik": "petom", "wołacz": "petowi", "celownik": "petach", "mianownik": "pet", "narzędnik": "pety", "dopełniacz": "petami", "miejscownik": "pety"}	{"biernik": "petów", "wołacz": "pecie", "celownik": "pety", "mianownik": "pet, peta", "narzędnik": "pecie", "dopełniacz": "petem", "miejscownik": "peta"}	{}	2025-09-13 09:07:06.414144+00	\N
138	mercedes	{"biernik": "mercedesie", "wołacz": "mercedesami", "celownik": "mercedesa", "mianownik": "mercedes", "narzędnik": "mercedesy", "dopełniacz": "mercedesy", "miejscownik": "mercedesy"}	{"biernik": "mercedesie", "wołacz": "mercedesom", "celownik": "mercedesach", "mianownik": "mercedesem", "narzędnik": "mercedesowi", "dopełniacz": "mercedesa", "miejscownik": "mercedesów"}	{}	2025-09-13 09:07:06.414144+00	\N
139	fiat	{"biernik": "fiatem", "wołacz": "fiata", "celownik": "fiatom", "mianownik": "fiat", "narzędnik": "fiatach", "dopełniacz": "fiaty", "miejscownik": "fiacie"}	{"biernik": "fiaty", "wołacz": "fiacie", "celownik": "fiatów", "mianownik": "fiaty", "narzędnik": "fiatowi", "dopełniacz": "fiatami", "miejscownik": "fiata"}	{}	2025-09-13 09:07:06.414144+00	\N
140	volkswagen	{"biernik": "volkswageny", "wołacz": "volkswagenowi", "celownik": "volkswageny", "mianownik": "volkswagen", "narzędnik": "volkswageny", "dopełniacz": "volkswagenom", "miejscownik": "volkswagenie"}	{"biernik": "volkswagena", "wołacz": "volkswagenach", "celownik": "volkswagena", "mianownik": "volkswagenów", "narzędnik": "volkswagenem", "dopełniacz": "volkswagenami", "miejscownik": "volkswagenie"}	{}	2025-09-13 09:07:06.414144+00	\N
141	pomidor	{"biernik": "pomidor, pomidora", "wołacz": "pomidorze", "celownik": "pomidorowi", "mianownik": "pomidor", "narzędnik": "pomidorem", "dopełniacz": "pomidora", "miejscownik": "pomidorze"}	{"biernik": "pomidory", "wołacz": "pomidory", "celownik": "pomidorom", "mianownik": "pomidory", "narzędnik": "pomidorami", "dopełniacz": "pomidorów", "miejscownik": "pomidorach"}	{}	2025-09-13 09:07:06.414144+00	\N
142	prawdziwek	{"biernik": "prawdziwków", "wołacz": "prawdziwka", "celownik": "prawdziwki, prawdziwków", "mianownik": "prawdziwek", "narzędnik": "prawdziwki, prawdziwkowie, prawdziwki", "dopełniacz": "prawdziwkom", "miejscownik": "prawdziwkiem"}	{"biernik": "prawdziwkach", "wołacz": "prawdziwkowi", "celownik": "prawdziwki, prawdziwkowie, prawdziwki", "mianownik": "prawdziwka", "narzędnik": "prawdziwku", "dopełniacz": "prawdziwku", "miejscownik": "prawdziwkami"}	{}	2025-09-13 09:07:06.414144+00	\N
143	maślak	{"biernik": "maślaka", "wołacz": "maślaku", "celownik": "maślakowi", "mianownik": "maślak", "narzędnik": "maślakiem", "dopełniacz": "maślaka", "miejscownik": "maślaku"}	{"biernik": "maślaki", "wołacz": "maślaki", "celownik": "maślakom", "mianownik": "maślaki", "narzędnik": "maślakami", "dopełniacz": "maślaków", "miejscownik": "maślakach"}	{}	2025-09-13 09:07:06.414144+00	\N
144	hamburger	{"biernik": "hamburgery", "wołacz": "hamburgera", "celownik": "hamburgerowi", "mianownik": "hamburger", "narzędnik": "hamburgerze", "dopełniacz": "hamburgerze", "miejscownik": "hamburgery"}	{"biernik": "hamburgery", "wołacz": "hamburgera, hamburger", "celownik": "hamburgerem", "mianownik": "hamburgerom", "narzędnik": "hamburgerami", "dopełniacz": "hamburgerów", "miejscownik": "hamburgerach"}	{}	2025-09-13 09:07:06.414144+00	\N
145	pączek	{"biernik": "pączków", "wołacz": "pączkami", "celownik": "pączkiem", "mianownik": "pączek", "narzędnik": "pączkowi", "dopełniacz": "pączek, pączka", "miejscownik": "pączki"}	{"biernik": "pączki", "wołacz": "pączka", "celownik": "pączkach", "mianownik": "pączkom", "narzędnik": "pączku", "dopełniacz": "pączki", "miejscownik": "pączku"}	{}	2025-09-13 09:07:06.414144+00	\N
146	sernik	{"biernik": "sernikowi", "wołacz": "sernikom", "celownik": "sernikami", "mianownik": "sernik", "narzędnik": "sernik, sernika", "dopełniacz": "sernika", "miejscownik": "serniki"}	{"biernik": "serniki", "wołacz": "sernikach", "celownik": "serniki", "mianownik": "sernikiem", "narzędnik": "serników", "dopełniacz": "serniku", "miejscownik": "serniku"}	{}	2025-09-13 09:07:06.414144+00	\N
147	kotlet	{"biernik": "kotletem", "wołacz": "kotlecie", "celownik": "kotlecie", "mianownik": "kotlet", "narzędnik": "kotlety", "dopełniacz": "kotletach", "miejscownik": "kotletów"}	{"biernik": "kotlety", "wołacz": "kotletowi", "celownik": "kotletami", "mianownik": "kotlet, kotleta", "narzędnik": "kotlety", "dopełniacz": "kotleta", "miejscownik": "kotletom"}	{}	2025-09-13 09:07:06.414144+00	\N
148	link	{"biernik": "link, linka", "wołacz": "linkowi", "celownik": "linki", "mianownik": "link", "narzędnik": "linkiem", "dopełniacz": "linki", "miejscownik": "linku"}	{"biernik": "linkom", "wołacz": "linku", "celownik": "linkach", "mianownik": "linki", "narzędnik": "linku, linka", "dopełniacz": "linków", "miejscownik": "linkami"}	{}	2025-09-13 09:07:06.414144+00	\N
149	mail	{"biernik": "mail, maila", "wołacz": "maile", "celownik": "mailom", "mianownik": "mail", "narzędnik": "mailu", "dopełniacz": "mailami", "miejscownik": "mailach"}	{"biernik": "mailu", "wołacz": "maila, mailu", "celownik": "maile", "mianownik": "maile", "narzędnik": "maili", "dopełniacz": "mailem", "miejscownik": "mailowi"}	{}	2025-09-13 09:07:06.414144+00	\N
150	sms	{"biernik": "sms-y, smsy, sms-y, smsy", "wołacz": "sms-u, smsu, sms-a, smsa", "celownik": "sms-owi, smsowi, sms-owi, smsowi", "mianownik": "sms", "narzędnik": "sms-ie, smsie, sms-ie, smsie", "dopełniacz": "sms-ie, smsie, sms-ie, smsie", "miejscownik": "sms-om, smsom, sms-om, smsom"}	{"biernik": "sms, sms-a, smsa", "wołacz": "sms-ów, smsów, sms-ów, smsów", "celownik": "sms-ach, smsach, sms-ach, smsach", "mianownik": "sms-y, smsy, sms-y, smsy", "narzędnik": "sms-y, smsy, sms-y, smsy", "dopełniacz": "sms-ami, smsami, sms-ami, smsami", "miejscownik": "sms-em, smsem, sms-em, smsem"}	{}	2025-09-13 09:07:06.414144+00	\N
151	facebook	{"biernik": "facebooku", "wołacz": "facebookach", "celownik": "facebooku", "mianownik": "facebook", "narzędnik": "facebooki", "dopełniacz": "facebookiem", "miejscownik": "facebooka, facebook"}	{"biernik": "facebookami", "wołacz": "facebookom", "celownik": "facebooki", "mianownik": "facebooków", "narzędnik": "facebooka", "dopełniacz": "facebookowi", "miejscownik": "facebooki"}	{}	2025-09-13 09:07:06.414144+00	\N
152	zoom	{"biernik": "zoomu", "wołacz": "zoomem", "celownik": "zoomy", "mianownik": "zoom", "narzędnik": "zoomie", "dopełniacz": "zoomów", "miejscownik": "zoom"}	{"biernik": "zoomy", "wołacz": "zoomowi", "celownik": "zoomach", "mianownik": "zoomy", "narzędnik": "zoomami", "dopełniacz": "zoomom", "miejscownik": "zoomie"}	{}	2025-09-13 09:07:06.414144+00	\N
153	ogórek	{"biernik": "ogórek", "wołacz": "ogórku", "celownik": "ogórkowi", "mianownik": "ogórek", "narzędnik": "ogórkiem", "dopełniacz": "ogórka", "miejscownik": "ogórku"}	{"biernik": "ogórki", "wołacz": "ogórki", "celownik": "ogórkom", "mianownik": "ogórki", "narzędnik": "ogórkami", "dopełniacz": "ogórków", "miejscownik": "ogórkach"}	{}	2025-09-13 09:08:05.385472+00	\N
154	banan	{"biernik": "banana", "wołacz": "bananie", "celownik": "bananowi", "mianownik": "banan", "narzędnik": "bananem", "dopełniacz": "banana", "miejscownik": "bananie"}	{"biernik": "banany", "wołacz": "banany", "celownik": "bananom", "mianownik": "banany", "narzędnik": "bananami", "dopełniacz": "bananów", "miejscownik": "bananach"}	{}	2025-09-13 09:08:05.385472+00	\N
155	arbuz	{"biernik": "arbuza", "wołacz": "arbuzie", "celownik": "arbuzowi", "mianownik": "arbuz", "narzędnik": "arbuzem", "dopełniacz": "arbuza", "miejscownik": "arbuzie"}	{"biernik": "arbuzy", "wołacz": "arbuzy", "celownik": "arbuzom", "mianownik": "arbuzy", "narzędnik": "arbuzami", "dopełniacz": "arbuzów", "miejscownik": "arbuzach"}	{}	2025-09-13 09:08:05.385472+00	\N
156	borowik	{"biernik": "borowika", "wołacz": "borowiku", "celownik": "borowikowi", "mianownik": "borowik", "narzędnik": "borowikiem", "dopełniacz": "borowika", "miejscownik": "borowiku"}	{"biernik": "borowiki", "wołacz": "borowiki", "celownik": "borowikom", "mianownik": "borowiki", "narzędnik": "borowikami", "dopełniacz": "borowików", "miejscownik": "borowikach"}	{}	2025-09-13 09:08:05.385472+00	\N
\.


--
-- Data for Name: pronouns; Type: TABLE DATA; Schema: public; Owner: lingvar_user
--

COPY public.pronouns (id, word, cases, created_at, updated_at) FROM stdin;
1	ja	{"biernik": "mnie", "wołacz": "", "celownik": "mnie, mi", "mianownik": "ja", "narzędnik": "mną", "dopełniacz": "mnie", "miejscownik": "mnie"}	2025-09-06 12:35:31.491857+00	\N
2	ty	{"biernik": "ciebie, cię", "wołacz": "ty", "celownik": "tobie, ci", "mianownik": "ty", "narzędnik": "tobą", "dopełniacz": "ciebie, cię", "miejscownik": "tobie"}	2025-09-06 12:35:31.491857+00	\N
3	on	{"biernik": "jego, niego, go", "wołacz": "", "celownik": "jemu, niemu, mu", "mianownik": "on", "narzędnik": "nim", "dopełniacz": "jego, niego, go", "miejscownik": "nim"}	2025-09-06 12:35:31.491857+00	\N
4	ona	{"biernik": "ją, nią", "wołacz": "", "celownik": "jej, niej", "mianownik": "ona", "narzędnik": "nią", "dopełniacz": "jej, niej", "miejscownik": "niej"}	2025-09-06 12:35:31.491857+00	\N
5	ono	{"biernik": "je, nie", "wołacz": "", "celownik": "jemu, niemu, mu", "mianownik": "ono", "narzędnik": "nim", "dopełniacz": "jego, niego, go", "miejscownik": "nim"}	2025-09-06 12:35:31.491857+00	\N
6	my	{"biernik": "nas", "wołacz": "", "celownik": "nam", "mianownik": "my", "narzędnik": "nami", "dopełniacz": "nas", "miejscownik": "nas"}	2025-09-06 12:35:31.491857+00	\N
7	wy	{"biernik": "was", "wołacz": "wy", "celownik": "wam", "mianownik": "wy", "narzędnik": "wami", "dopełniacz": "was", "miejscownik": "was"}	2025-09-06 12:35:31.491857+00	\N
8	oni	{"biernik": "ich, nich", "wołacz": "", "celownik": "im, nim", "mianownik": "oni", "narzędnik": "nimi", "dopełniacz": "ich, nich", "miejscownik": "nich"}	2025-09-06 12:35:31.491857+00	\N
9	one	{"biernik": "je, nie", "wołacz": "", "celownik": "im, nim", "mianownik": "one", "narzędnik": "nimi", "dopełniacz": "ich, nich", "miejscownik": "nich"}	2025-09-06 12:35:31.491857+00	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: lingvar_user
--

COPY public.users (id, username, email, hashed_password, is_active, is_superuser, created_at, updated_at) FROM stdin;
1	Oleksii	alexportal@list.ru	$2b$12$PSibZGYotDiRm4QqTrCfAeo0qGr64tC6goBUTcu2ihlSORNjaTVtS	t	f	2025-07-02 17:16:15.733206+00	\N
\.


--
-- Data for Name: verbs; Type: TABLE DATA; Schema: public; Owner: lingvar_user
--

COPY public.verbs (id, word, cases, created_at, updated_at) FROM stdin;
46	myć	{"ja": "myję", "my": "myjemy", "ty": "myjesz", "wy": "myjecie", "one": "myją", "ono": "myje", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
47	prosić	{"ja": "proszę", "my": "prosimy", "ty": "prosisz", "wy": "prosicie", "one": "proszą", "ono": "prosi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
48	chcieć	{"ja": "chcę", "my": "chcemy", "ty": "chcesz", "wy": "chcecie", "one": "chcą", "ono": "chce", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
49	powinien (m.)	{"ja": "powinienem", "my": "powinnyśmy", "on": "powinien", "ty": "powinieneś", "wy": "powinnyście", "one": "powinny", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
50	chodzić	{"ja": "chodzę", "my": "chodzimy", "ty": "chodzisz", "wy": "chodzicie", "one": "chodzą", "ono": "chodzi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
51	zacząć	{"ja": "zacznę", "my": "zaczniemy", "ty": "zaczniesz", "wy": "zaczniecie", "one": "zaczną", "ono": "zacznie", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
52	nieść	{"ja": "niosę", "my": "niesiemy", "ty": "niesiesz", "wy": "niesiecie", "one": "niosą", "ono": "niesie", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
53	wiedzieć	{"ja": "wiem", "my": "wiemy", "ty": "wiesz", "wy": "wiecie", "one": "wiedzą", "ono": "wie", "koniugacja": 4}	2025-09-08 10:49:29.612741+00	\N
54	pójść	{"ja": "pójdę", "my": "pójdziemy", "ty": "pójdziesz", "wy": "pójdziecie", "one": "pójdą", "ono": "pójdzie", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
55	umówić się	{"ja": "umówię się", "my": "umówimy się", "ty": "umówisz się", "wy": "umówicie się", "one": "umówią się", "ono": "umówi się", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
56	dostrzec	{"ja": "dostrzegę", "my": "dostrzeżemy", "ty": "dostrzeżesz", "wy": "dostrzeżecie", "one": "dostrzegą", "ono": "dostrzeże", "koniugacja": 4}	2025-09-08 10:49:29.612741+00	\N
57	słyszeć	{"ja": "słyszę", "my": "słyszymy", "ty": "słyszysz", "wy": "słyszycie", "one": "słyszą", "ono": "słyszy", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
58	iść	{"ja": "idę", "my": "idziemy", "ty": "idziesz", "wy": "idziecie", "one": "idą", "ono": "idzie", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
59	wziąć	{"ja": "wezmę", "my": "weźmiemy", "ty": "weźmiesz", "wy": "weźmiecie", "one": "wezmą", "ono": "weźmie", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
60	śmieć	{"ja": "śmiem", "my": "śmiemy", "ty": "śmiesz", "wy": "śmiecie", "one": "śmieją", "ono": "śmie", "koniugacja": 4}	2025-09-08 10:49:29.612741+00	\N
61	budzić się	{"ja": "budzę się", "my": "budzimy się", "ty": "budzisz się", "wy": "budzicie się", "one": "budzą się", "ono": "budzi się", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
62	móc	{"ja": "mogę", "my": "możemy", "ty": "możesz", "wy": "możecie", "one": "mogą", "ono": "może", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
63	pisać	{"ja": "piszę", "my": "piszemy", "ty": "piszesz", "wy": "piszecie", "one": "piszą", "ono": "pisze", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
64	umieć	{"ja": "umiem", "my": "umiemy", "ty": "umiesz", "wy": "umiecie", "one": "umieją", "ono": "umie", "koniugacja": 4}	2025-09-08 10:49:29.612741+00	\N
65	woleć	{"ja": "wolę", "my": "wolimy", "ty": "wolisz", "wy": "wolicie", "one": "wolą", "ono": "woli", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
66	płacić	{"ja": "płacę", "my": "płacimy", "ty": "płacisz", "wy": "płacicie", "one": "płacą", "ono": "płaci", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
67	powtórzyć	{"ja": "powtórzę", "my": "powtórzymy", "ty": "powtórzysz", "wy": "powtórzycie", "one": "powtórzą", "ono": "powtórzy", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
68	pić	{"ja": "piję", "my": "pijemy", "ty": "pijesz", "wy": "pijecie", "one": "piją", "ono": "pije", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
69	wrócić	{"ja": "wrócę", "my": "wrócimy", "ty": "wrócisz", "wy": "wrócicie", "one": "wrócą", "ono": "wróci", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
70	studiować	{"ja": "studiuję", "my": "studiujemy", "ty": "studiujesz", "wy": "studiujecie", "one": "studiują", "ono": "studiuje", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
71	brać	{"ja": "biorę", "my": "bierzemy", "ty": "bierzesz", "wy": "bierzecie", "one": "biorą", "ono": "bierze", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
72	robić	{"ja": "robię", "my": "robimy", "ty": "robisz", "wy": "robicie", "one": "robią", "ono": "robi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
73	malować	{"ja": "maluję", "my": "malujemy", "ty": "malujesz", "wy": "malujecie", "one": "malują", "ono": "maluje", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
74	jechać	{"ja": "jadę", "my": "jedziemy", "ty": "jedziesz", "wy": "jedziecie", "one": "jadą", "ono": "jedzie", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
75	wierzyć	{"ja": "wierzę", "my": "wierzymy", "ty": "wierzysz", "wy": "wierzycie", "one": "wierzą", "ono": "wierzy", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
76	zamknąć	{"ja": "zamknę", "my": "zamkniemy", "ty": "zamkniesz", "wy": "zamkniecie", "one": "zamkną", "ono": "zamknie", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
77	nudzić się	{"ja": "nudzę się", "my": "nudzimy się", "ty": "nudzisz się", "wy": "nudzicie się", "one": "nudzą się", "ono": "nudzi się", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
78	lubić	{"ja": "lubię", "my": "lubimy", "ty": "lubisz", "wy": "lubicie", "one": "lubią", "ono": "lubi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
79	obejrzeć	{"ja": "obejrzę", "my": "obejrzymy", "ty": "obejrzysz", "wy": "obejrzycie", "one": "obejrzą", "ono": "obejrzy", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
80	smażyć	{"ja": "smażę", "my": "smażymy", "ty": "smażysz", "wy": "smażycie", "one": "smażą", "ono": "smaży", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
81	potrafić	{"ja": "potrafię", "my": "potrafimy", "ty": "potrafisz", "wy": "potraficie", "one": "potrafią", "ono": "potrafi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
82	prać	{"ja": "piorę", "my": "pierzemy", "ty": "pierzesz", "wy": "pierzecie", "one": "piorą", "ono": "pierze", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
83	powinien (z.)	{"ja": "powinnam", "my": "powinniśmy", "ty": "powinnaś", "wy": "powinniście", "ona": "powinna", "one": "powinni", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
84	odwiedzić	{"ja": "odwiedzę", "my": "odwiedzimy", "ty": "odwiedzisz", "wy": "odwiedzicie", "one": "odwiedzą", "ono": "odwiedzi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
85	powiedzieć	{"ja": "powiem", "my": "powiemy", "ty": "powiesz", "wy": "powiecie", "one": "powiedzą", "ono": "powie", "koniugacja": 4}	2025-09-08 10:49:29.612741+00	\N
86	tańczyć	{"ja": "tańczę", "my": "tańczymy", "ty": "tańczysz", "wy": "tańczycie", "one": "tańczą", "ono": "tańczy", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
87	rozumieć	{"ja": "rozumiem", "my": "rozumiemy", "ty": "rozumiesz", "wy": "rozumiecie", "one": "rozumieją", "ono": "rozumie", "koniugacja": 4}	2025-09-08 10:49:29.612741+00	\N
88	stać	{"ja": "stoję", "my": "stoimy", "ty": "stoisz", "wy": "stoicie", "one": "stoją", "ono": "stoi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
89	widzieć	{"ja": "widzę", "my": "widzimy", "ty": "widzisz", "wy": "widzicie", "one": "widzą", "ono": "widzi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
90	myśleć	{"ja": "myślę", "my": "myślimy", "ty": "myślisz", "wy": "myślicie", "one": "myślą", "ono": "myśli", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
91	wieść	{"ja": "wiodę", "my": "wiedziemy", "ty": "wiedziesz", "wy": "wiedziecie", "one": "wiodą", "ono": "wiedzie", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
92	znać	{"ja": "znam", "my": "znamy", "ty": "znasz", "wy": "znacie", "one": "znają", "ono": "zna", "koniugacja": 3}	2025-09-08 10:49:29.612741+00	\N
93	nosić	{"ja": "noszę", "my": "nosimy", "ty": "nosisz", "wy": "nosicie", "one": "noszą", "ono": "nosi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
94	wieźć	{"ja": "wiozę", "my": "wieziemy", "ty": "wieziesz", "wy": "wieziecie", "one": "wiozą", "ono": "wiezie", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
95	spać	{"ja": "śpię", "my": "śpimy", "ty": "śpisz", "wy": "śpicie", "one": "śpią", "ono": "śpi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
96	palić	{"ja": "palę", "my": "palimy", "ty": "palisz", "wy": "palicie", "one": "palą", "ono": "pali", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
97	wstawać	{"ja": "wstaję", "my": "wstajemy", "ty": "wstajesz", "wy": "wstajecie", "one": "wstają", "ono": "wstaje", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
98	mówić	{"ja": "mówię", "my": "mówimy", "ty": "mówisz", "wy": "mówicie", "one": "mówią", "ono": "mówi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
99	dać	{"ja": "dam", "my": "damy", "ty": "dasz", "wy": "dacie", "one": "dadzą", "ono": "da", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
100	jeździć	{"ja": "jeżdżę", "my": "jeździmy", "ty": "jeździsz", "wy": "jeździcie", "one": "jeżdżą", "ono": "jeździ", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
101	pomóc	{"ja": "pomogę", "my": "pomożemy", "ty": "pomożesz", "wy": "pomożecie", "one": "pomogą", "ono": "pomoże", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
102	jeść	{"ja": "jem", "my": "jemy", "ty": "jesz", "wy": "jecie", "one": "jedzą", "ono": "je", "koniugacja": 4}	2025-09-08 10:49:29.612741+00	\N
103	musieć	{"ja": "muszę", "my": "musimy", "ty": "musisz", "wy": "musicie", "one": "muszą", "ono": "musi", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
104	bać się	{"ja": "boję się", "my": "boimy się", "ty": "boisz się", "wy": "boicie się", "one": "boją się", "ono": "boi się", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
105	krzyczeć	{"ja": "krzyczę", "my": "krzyczymy", "ty": "krzyczysz", "wy": "krzyczycie", "one": "krzyczą", "ono": "krzyczy", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
106	patrzeć	{"ja": "patrzę", "my": "patrzymy", "ty": "patrzysz", "wy": "patrzycie", "one": "patrzą", "ono": "patrzy", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
107	zostać	{"ja": "zostanę", "my": "zostaniemy", "ty": "zostaniesz", "wy": "zostaniecie", "one": "zostaną", "ono": "zostanie", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
108	dawać	{"ja": "daję", "my": "dajemy", "ty": "dajesz", "wy": "dajecie", "one": "dają", "ono": "daje", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
109	pracować	{"ja": "pracuję", "my": "pracujemy", "ty": "pracujesz", "wy": "pracujecie", "one": "pracują", "ono": "pracuje", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
110	pozbyć	{"ja": "pozbędę", "my": "pozbędziemy", "ty": "pozbędziesz", "wy": "pozbędziecie", "one": "pozbędą", "ono": "pozbędzie", "koniugacja": 2}	2025-09-08 10:49:29.612741+00	\N
111	przygotowywać	{"ja": "przygotowuję", "my": "przygotowujemy", "ty": "przygotowujesz", "wy": "przygotowujecie", "one": "przygotowują", "ono": "przygotowuje", "koniugacja": 1}	2025-09-08 10:49:29.612741+00	\N
112	gadać	{"ja": "gadam", "my": "gadajmy", "ty": "gadasz", "wy": "gadajcie", "one": "gadają", "ono": "gada"}	2025-09-08 18:51:57.475312+00	\N
113	rozmawiać	{"ja": "rozmawiam", "my": "rozmawiamy", "ty": "rozmawiasz", "wy": "rozmawiacie", "one": "rozmawiają", "ono": "rozmawia"}	2025-09-08 18:51:57.475312+00	\N
\.


--
-- Name: nouns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lingvar_user
--

SELECT pg_catalog.setval('public.nouns_id_seq', 156, true);


--
-- Name: pronouns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lingvar_user
--

SELECT pg_catalog.setval('public.pronouns_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lingvar_user
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: verbs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lingvar_user
--

SELECT pg_catalog.setval('public.verbs_id_seq', 113, true);


--
-- Name: nouns nouns_pkey; Type: CONSTRAINT; Schema: public; Owner: lingvar_user
--

ALTER TABLE ONLY public.nouns
    ADD CONSTRAINT nouns_pkey PRIMARY KEY (id);


--
-- Name: pronouns pronouns_pkey; Type: CONSTRAINT; Schema: public; Owner: lingvar_user
--

ALTER TABLE ONLY public.pronouns
    ADD CONSTRAINT pronouns_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: lingvar_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verbs vers_pkey; Type: CONSTRAINT; Schema: public; Owner: lingvar_user
--

ALTER TABLE ONLY public.verbs
    ADD CONSTRAINT vers_pkey PRIMARY KEY (id);


--
-- Name: ix_nouns_id; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE INDEX ix_nouns_id ON public.nouns USING btree (id);


--
-- Name: ix_nouns_word; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE INDEX ix_nouns_word ON public.nouns USING btree (word);


--
-- Name: ix_pronouns_id; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE INDEX ix_pronouns_id ON public.pronouns USING btree (id);


--
-- Name: ix_pronouns_word; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE INDEX ix_pronouns_word ON public.pronouns USING btree (word);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: ix_verbs_id; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE INDEX ix_verbs_id ON public.verbs USING btree (id);


--
-- Name: ix_verbs_word; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE INDEX ix_verbs_word ON public.verbs USING btree (word);


--
-- PostgreSQL database dump complete
--

\unrestrict HtU8CPOybfZ77KwmYVQ3dBmyqUS4EnTDSDkcgGns7ZrwkKagh9KwbOeyLC2x8Zi

