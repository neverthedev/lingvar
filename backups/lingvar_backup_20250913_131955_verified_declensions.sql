--
-- PostgreSQL database dump
--

\restrict krWIAzBgj43ABH7OkB6twis29UDYiPEPzoMarb1c2MorjyB4uPyRY6xcbeAFinb

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
-- Name: rules; Type: TABLE; Schema: public; Owner: lingvar_user
--

CREATE TABLE public.rules (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    parent_rule_id integer,
    ordering integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.rules OWNER TO lingvar_user;

--
-- Name: rules_id_seq; Type: SEQUENCE; Schema: public; Owner: lingvar_user
--

CREATE SEQUENCE public.rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rules_id_seq OWNER TO lingvar_user;

--
-- Name: rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lingvar_user
--

ALTER SEQUENCE public.rules_id_seq OWNED BY public.rules.id;


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
-- Name: rules id; Type: DEFAULT; Schema: public; Owner: lingvar_user
--

ALTER TABLE ONLY public.rules ALTER COLUMN id SET DEFAULT nextval('public.rules_id_seq'::regclass);


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
4	chłopiec	{"biernik": "chłopca", "wołacz": "chłopcze", "celownik": "chłopcu", "mianownik": "chłopiec", "narzędnik": "chłopcem", "dopełniacz": "chłopca", "miejscownik": "chłopcu"}	{"biernik": "chłopców", "wołacz": "chłopcy", "celownik": "chłopcom", "mianownik": "chłopcy", "narzędnik": "chłopcami", "dopełniacz": "chłopców", "miejscownik": "chłopcach"}	{}	2025-07-03 19:22:44.140605+00	\N
6	rodzina	{"biernik": "rodzinę", "wołacz": "rodzino", "celownik": "rodzinie", "mianownik": "rodzina", "narzędnik": "rodziną", "dopełniacz": "rodziny", "miejscownik": "rodzinie"}	{"biernik": "rodziny", "wołacz": "rodziny", "celownik": "rodzinom", "mianownik": "rodziny", "narzędnik": "rodzinami", "dopełniacz": "rodzin", "miejscownik": "rodzinach"}	{}	2025-07-03 19:22:48.763143+00	\N
7	przyjaciel	{"biernik": "przyjaciela", "wołacz": "przyjacielu", "celownik": "przyjacielowi", "mianownik": "przyjaciel", "narzędnik": "przyjacielem", "dopełniacz": "przyjaciela", "miejscownik": "przyjacielu"}	{"biernik": "przyjaciół", "wołacz": "przyjaciele", "celownik": "przyjaciołom", "mianownik": "przyjaciele", "narzędnik": "przyjaciółmi", "dopełniacz": "przyjaciół", "miejscownik": "przyjaciołach"}	{}	2025-07-03 19:22:51.144926+00	\N
9	nauczyciel	{"biernik": "nauczyciela", "wołacz": "nauczycielu", "celownik": "nauczycielowi", "mianownik": "nauczyciel", "narzędnik": "nauczycielem", "dopełniacz": "nauczyciela", "miejscownik": "nauczycielu"}	{"biernik": "nauczycieli", "wołacz": "nauczyciele", "celownik": "nauczycielom", "mianownik": "nauczyciele", "narzędnik": "nauczycielami", "dopełniacz": "nauczycieli", "miejscownik": "nauczycielach"}	{}	2025-07-03 19:22:55.854618+00	\N
11	pies	{"biernik": "psa", "wołacz": "psie", "celownik": "psu", "mianownik": "pies", "narzędnik": "psem", "dopełniacz": "psa", "miejscownik": "psie"}	{"biernik": "psy, psów", "wołacz": "psy, psowie, psy", "celownik": "psom", "mianownik": "psy, psowie, psy", "narzędnik": "psami", "dopełniacz": "psów", "miejscownik": "psach"}	{}	2025-07-03 19:23:00.553019+00	\N
12	dom	{"biernik": "dom", "wołacz": "domie", "celownik": "domowi", "mianownik": "dom", "narzędnik": "domem", "dopełniacz": "domu", "miejscownik": "domu"}	{"biernik": "domy", "wołacz": "domy", "celownik": "domom", "mianownik": "domy", "narzędnik": "domami", "dopełniacz": "domów", "miejscownik": "domach"}	{}	2025-07-03 19:23:02.969723+00	\N
14	książka	{"biernik": "książkę", "wołacz": "książko", "celownik": "książce", "mianownik": "książka", "narzędnik": "książką", "dopełniacz": "książki", "miejscownik": "książce"}	{"biernik": "książki", "wołacz": "książki", "celownik": "książkom", "mianownik": "książki", "narzędnik": "książkami", "dopełniacz": "książek", "miejscownik": "książkach"}	{}	2025-07-03 19:23:07.581077+00	\N
18	dziecko	{"biernik": "dziecko", "wołacz": "dziecko", "celownik": "dziecku", "mianownik": "dziecko", "narzędnik": "dzieckiem", "dopełniacz": "dziecka", "miejscownik": "dziecku"}	{"biernik": "dzieci", "wołacz": "dzieci", "celownik": "dzieciom", "mianownik": "dzieci", "narzędnik": "dziećmi", "dopełniacz": "dzieci", "miejscownik": "dzieciach"}	{}	2025-07-03 19:23:16.888128+00	\N
19	miasto	{"biernik": "miasto", "wołacz": "miasto", "celownik": "miastu", "mianownik": "miasto", "narzędnik": "miastem", "dopełniacz": "miasta", "miejscownik": "mieście"}	{"biernik": "miasta", "wołacz": "miasta", "celownik": "miastom", "mianownik": "miasta", "narzędnik": "miastami", "dopełniacz": "miast", "miejscownik": "miastach"}	{}	2025-07-03 19:23:19.298128+00	\N
21	szkoła	{"biernik": "szkołę", "wołacz": "szkoło", "celownik": "szkole", "mianownik": "szkoła", "narzędnik": "szkołą", "dopełniacz": "szkoły", "miejscownik": "szkole"}	{"biernik": "szkoły", "wołacz": "szkoły", "celownik": "szkołom", "mianownik": "szkoły", "narzędnik": "szkołami", "dopełniacz": "szkół", "miejscownik": "szkołach"}	{}	2025-07-03 19:23:23.999279+00	\N
23	ogród	{"biernik": "ogród", "wołacz": "ogrodzie", "celownik": "ogrodowi", "mianownik": "ogród", "narzędnik": "ogrodem", "dopełniacz": "ogrodu", "miejscownik": "ogrodzie"}	{"biernik": "ogrody", "wołacz": "ogrody", "celownik": "ogrodom", "mianownik": "ogrody", "narzędnik": "ogrodami", "dopełniacz": "ogrodów", "miejscownik": "ogrodach"}	{}	2025-07-03 19:23:28.640379+00	\N
25	kwiat	{"biernik": "kwiat", "wołacz": "kwiecie", "celownik": "kwiatowi", "mianownik": "kwiat", "narzędnik": "kwiatem", "dopełniacz": "kwiatu", "miejscownik": "kwiecie"}	{"biernik": "kwiaty", "wołacz": "kwiaty", "celownik": "kwiatom", "mianownik": "kwiaty", "narzędnik": "kwiatami", "dopełniacz": "kwiatów", "miejscownik": "kwiatach"}	{}	2025-07-03 19:23:33.272287+00	\N
27	miejsce	{"biernik": "miejsce", "wołacz": "miejsce", "celownik": "miejscu", "mianownik": "miejsce", "narzędnik": "miejscem", "dopełniacz": "miejsca", "miejscownik": "miejscu"}	{"biernik": "miejsca", "wołacz": "miejsca", "celownik": "miejscom", "mianownik": "miejsca", "narzędnik": "miejscami", "dopełniacz": "miejsc", "miejscownik": "miejscach"}	{}	2025-07-03 19:23:38.01106+00	\N
28	czas	{"biernik": "czas", "wołacz": "czasie", "celownik": "czasowi", "mianownik": "czas", "narzędnik": "czasem", "dopełniacz": "czasu", "miejscownik": "czasie"}	{"biernik": "czasy", "wołacz": "czasy", "celownik": "czasom", "mianownik": "czasy", "narzędnik": "czasami", "dopełniacz": "czasów", "miejscownik": "czasach"}	{}	2025-07-03 19:23:40.332004+00	\N
30	miłość	{"biernik": "miłość", "wołacz": "miłości", "celownik": "miłości", "mianownik": "miłość", "narzędnik": "miłością", "dopełniacz": "miłości", "miejscownik": "miłości"}	{"biernik": "miłości", "wołacz": "miłości", "celownik": "miłościom", "mianownik": "miłości", "narzędnik": "miłościami", "dopełniacz": "miłości", "miejscownik": "miłościach"}	{}	2025-07-03 19:23:47.336172+00	\N
34	film	{"biernik": "film", "wołacz": "filmie", "celownik": "filmowi", "mianownik": "film", "narzędnik": "filmem", "dopełniacz": "filmu", "miejscownik": "filmie"}	{"biernik": "filmy", "wołacz": "filmy", "celownik": "filmom", "mianownik": "filmy", "narzędnik": "filmami", "dopełniacz": "filmów", "miejscownik": "filmach"}	{}	2025-07-03 19:23:56.669938+00	\N
16	telefon	{"biernik": "telefon", "wołacz": "telefonie", "celownik": "telefonowi", "mianownik": "telefon", "narzędnik": "telefonem", "dopełniacz": "telefonu", "miejscownik": "telefonie"}	{"biernik": "telefony", "wołacz": "telefony", "celownik": "telefonom", "mianownik": "telefony", "narzędnik": "telefonami", "dopełniacz": "telefonów", "miejscownik": "telefonach"}	{}	2025-07-03 19:23:12.227919+00	\N
32	laptop	{"biernik": "laptop, laptopa", "wołacz": "laptopie", "celownik": "laptopowi", "mianownik": "laptop", "narzędnik": "laptopem", "dopełniacz": "laptopu, laptopa", "miejscownik": "laptopie"}	{"biernik": "laptopy", "wołacz": "laptopy", "celownik": "laptopom", "mianownik": "laptopy", "narzędnik": "laptopami", "dopełniacz": "laptopów", "miejscownik": "laptopach"}	{}	2025-07-03 19:23:51.996929+00	\N
36	zdrowie	{"biernik": "zdrowie", "wołacz": "zdrowie", "celownik": "zdrowiu", "mianownik": "zdrowie", "narzędnik": "zdrowiem", "dopełniacz": "zdrowia", "miejscownik": "zdrowiu"}	{"biernik": "zdrowia", "wołacz": "zdrowia", "celownik": "zdrowiom", "mianownik": "zdrowia", "narzędnik": "zdrowiami", "dopełniacz": "zdrowi", "miejscownik": "zdrowiach"}	{}	2025-07-03 19:24:01.277973+00	\N
38	mama	{"biernik": "mamę", "wołacz": "mamo", "celownik": "mamie", "mianownik": "mama", "narzędnik": "mamą", "dopełniacz": "mamy", "miejscownik": "mamie"}	{"biernik": "mamy", "wołacz": "mamy", "celownik": "mamom", "mianownik": "mamy", "narzędnik": "mamami", "dopełniacz": "mam", "miejscownik": "mamach"}	{}	2025-07-03 19:24:06.074535+00	\N
40	siostra	{"biernik": "siostrę", "wołacz": "siostro", "celownik": "siostrze", "mianownik": "siostra", "narzędnik": "siostrą", "dopełniacz": "siostry", "miejscownik": "siostrze"}	{"biernik": "siostry", "wołacz": "siostry", "celownik": "siostrom", "mianownik": "siostry", "narzędnik": "siostrami", "dopełniacz": "sióstr", "miejscownik": "siostrach"}	{}	2025-07-03 19:24:10.752727+00	\N
42	babcia	{"biernik": "babcię", "wołacz": "babciu", "celownik": "babci", "mianownik": "babcia", "narzędnik": "babcią", "dopełniacz": "babci", "miejscownik": "babci"}	{"biernik": "babcie", "wołacz": "babcie", "celownik": "babciom", "mianownik": "babcie", "narzędnik": "babciami", "dopełniacz": "babci, babć", "miejscownik": "babciach"}	{}	2025-07-03 19:24:15.378729+00	\N
43	księżyc	{"biernik": "księżyc", "wołacz": "księżycu", "celownik": "księżycowi", "mianownik": "księżyc", "narzędnik": "księżycem", "dopełniacz": "księżyca", "miejscownik": "księżycu"}	{"biernik": "księżyce", "wołacz": "księżyce", "celownik": "księżycom", "mianownik": "księżyce", "narzędnik": "księżycami", "dopełniacz": "księżyców", "miejscownik": "księżycach"}	{}	2025-07-03 19:24:20.043726+00	\N
45	chleb	{"biernik": "chleb", "wołacz": "chlebie", "celownik": "chlebowi", "mianownik": "chleb", "narzędnik": "chlebem", "dopełniacz": "chleba", "miejscownik": "chlebie"}	{"biernik": "chleby", "wołacz": "chleby", "celownik": "chlebom", "mianownik": "chleby", "narzędnik": "chlebami", "dopełniacz": "chlebów", "miejscownik": "chlebach"}	{}	2025-07-03 19:24:24.74394+00	\N
47	herbata	{"biernik": "herbatę", "wołacz": "herbato", "celownik": "herbacie", "mianownik": "herbata", "narzędnik": "herbatą", "dopełniacz": "herbaty", "miejscownik": "herbacie"}	{"biernik": "herbaty", "wołacz": "herbaty", "celownik": "herbatom", "mianownik": "herbaty", "narzędnik": "herbatami", "dopełniacz": "herbat", "miejscownik": "herbatach"}	{}	2025-07-03 19:24:29.345026+00	\N
48	kawa	{"biernik": "kawę", "wołacz": "kawo", "celownik": "kawie", "mianownik": "kawa", "narzędnik": "kawą", "dopełniacz": "kawy", "miejscownik": "kawie"}	{"biernik": "kawy", "wołacz": "kawy", "celownik": "kawom", "mianownik": "kawy", "narzędnik": "kawami", "dopełniacz": "kaw", "miejscownik": "kawach"}	{}	2025-07-03 19:24:31.654329+00	\N
50	centrum	{"biernik": "centrum", "wołacz": "centrum", "celownik": "centrum", "mianownik": "centrum", "narzędnik": "centrum", "dopełniacz": "centrum", "miejscownik": "centrum"}	{"biernik": "centra", "wołacz": "centra", "celownik": "centrom", "mianownik": "centra", "narzędnik": "centrami", "dopełniacz": "centrów", "miejscownik": "centrach"}	{}	2025-07-03 19:24:41.101406+00	\N
52	restauracja	{"biernik": "restaurację", "wołacz": "restauracjo", "celownik": "restauracji", "mianownik": "restauracja", "narzędnik": "restauracją", "dopełniacz": "restauracji", "miejscownik": "restauracji"}	{"biernik": "restauracje", "wołacz": "restauracje", "celownik": "restauracjom", "mianownik": "restauracje", "narzędnik": "restauracjami", "dopełniacz": "restauracji", "miejscownik": "restauracjach"}	{}	2025-07-03 19:24:45.737771+00	\N
54	imię	{"biernik": "imię", "wołacz": "imię", "celownik": "imieniu", "mianownik": "imię", "narzędnik": "imieniem", "dopełniacz": "imienia", "miejscownik": "imieniu"}	{"biernik": "imiona", "wołacz": "imiona", "celownik": "imionom", "mianownik": "imiona", "narzędnik": "imionami", "dopełniacz": "imion", "miejscownik": "imionach"}	{}	2025-07-03 19:24:50.382829+00	\N
56	adres	{"biernik": "adres", "wołacz": "adresie", "celownik": "adresowi", "mianownik": "adres", "narzędnik": "adresem", "dopełniacz": "adresu", "miejscownik": "adresie"}	{"biernik": "adresy", "wołacz": "adresy", "celownik": "adresom", "mianownik": "adresy", "narzędnik": "adresami", "dopełniacz": "adresów", "miejscownik": "adresach"}	{}	2025-07-03 19:24:55.093486+00	\N
59	las	{"biernik": "las", "wołacz": "lesie", "celownik": "lasowi", "mianownik": "las", "narzędnik": "lasem", "dopełniacz": "lasu", "miejscownik": "lesie"}	{"biernik": "lasy", "wołacz": "lasy", "celownik": "lasom", "mianownik": "lasy", "narzędnik": "lasami", "dopełniacz": "lasów", "miejscownik": "lasach"}	{}	2025-07-03 19:25:04.523813+00	\N
60	morze	{"biernik": "morze", "wołacz": "morze", "celownik": "morzu", "mianownik": "morze", "narzędnik": "morzem", "dopełniacz": "morza", "miejscownik": "morzu"}	{"biernik": "morza", "wołacz": "morza", "celownik": "morzom", "mianownik": "morza", "narzędnik": "morzami", "dopełniacz": "mórz", "miejscownik": "morzach"}	{}	2025-07-03 19:25:06.810073+00	\N
62	poniedziałek	{"biernik": "poniedziałek", "wołacz": "poniedziałku", "celownik": "poniedziałkowi", "mianownik": "poniedziałek", "narzędnik": "poniedziałkiem", "dopełniacz": "poniedziałku", "miejscownik": "poniedziałku"}	{"biernik": "poniedziałki", "wołacz": "poniedziałki", "celownik": "poniedziałkom", "mianownik": "poniedziałki", "narzędnik": "poniedziałkami", "dopełniacz": "poniedziałków", "miejscownik": "poniedziałkach"}	{}	2025-07-03 19:25:11.53144+00	\N
64	środa	{"biernik": "środę", "wołacz": "środo", "celownik": "środzie", "mianownik": "środa", "narzędnik": "środą", "dopełniacz": "środy", "miejscownik": "środzie"}	{"biernik": "środy", "wołacz": "środy", "celownik": "środom", "mianownik": "środy", "narzędnik": "środami", "dopełniacz": "śród", "miejscownik": "środach"}	{}	2025-07-03 19:25:16.218313+00	\N
66	piątek	{"biernik": "piątek", "wołacz": "piątku", "celownik": "piątkowi", "mianownik": "piątek", "narzędnik": "piątkiem", "dopełniacz": "piątku", "miejscownik": "piątku"}	{"biernik": "piątki", "wołacz": "piątki", "celownik": "piątkom", "mianownik": "piątki", "narzędnik": "piątkami", "dopełniacz": "piątków", "miejscownik": "piątkach"}	{}	2025-07-03 19:25:20.865999+00	\N
67	sobota	{"biernik": "sobotę", "wołacz": "soboto", "celownik": "sobocie", "mianownik": "sobota", "narzędnik": "sobotą", "dopełniacz": "soboty", "miejscownik": "sobocie"}	{"biernik": "soboty", "wołacz": "soboty", "celownik": "sobotom", "mianownik": "soboty", "narzędnik": "sobotami", "dopełniacz": "sobót", "miejscownik": "sobotach"}	{}	2025-07-03 19:25:23.194051+00	\N
70	szpital	{"biernik": "szpital", "wołacz": "szpitalu", "celownik": "szpitalowi", "mianownik": "szpital", "narzędnik": "szpitalem", "dopełniacz": "szpitala", "miejscownik": "szpitalu"}	{"biernik": "szpitale", "wołacz": "szpitale", "celownik": "szpitalom", "mianownik": "szpitale", "narzędnik": "szpitalami", "dopełniacz": "szpitali", "miejscownik": "szpitalach"}	{}	2025-07-03 19:25:30.174093+00	\N
71	apteka	{"biernik": "aptekę", "wołacz": "apteko", "celownik": "aptece", "mianownik": "apteka", "narzędnik": "apteką", "dopełniacz": "apteki", "miejscownik": "aptece"}	{"biernik": "apteki", "wołacz": "apteki", "celownik": "aptekom", "mianownik": "apteki", "narzędnik": "aptekami", "dopełniacz": "aptek", "miejscownik": "aptekach"}	{}	2025-07-03 19:25:32.503941+00	\N
74	łóżko	{"biernik": "łóżko", "wołacz": "łóżko", "celownik": "łóżku", "mianownik": "łóżko", "narzędnik": "łóżkiem", "dopełniacz": "łóżka", "miejscownik": "łóżku"}	{"biernik": "łóżka", "wołacz": "łóżka", "celownik": "łóżkom", "mianownik": "łóżka", "narzędnik": "łóżkami", "dopełniacz": "łóżek", "miejscownik": "łóżkach"}	{}	2025-07-03 19:25:39.516314+00	\N
76	drzwi	{"biernik": "", "wołacz": "", "celownik": "", "mianownik": "", "narzędnik": "", "dopełniacz": "", "miejscownik": ""}	{"biernik": "drzwi", "wołacz": "drzwi", "celownik": "drzwiom", "mianownik": "drzwi", "narzędnik": "drzwiami", "dopełniacz": "drzwi", "miejscownik": "drzwiach"}	{}	2025-07-03 19:25:44.217671+00	\N
78	ściana	{"biernik": "ścianę", "wołacz": "ściano", "celownik": "ścianie", "mianownik": "ściana", "narzędnik": "ścianą", "dopełniacz": "ściany", "miejscownik": "ścianie"}	{"biernik": "ściany", "wołacz": "ściany", "celownik": "ścianom", "mianownik": "ściany", "narzędnik": "ścianami", "dopełniacz": "ścian", "miejscownik": "ścianach"}	{}	2025-07-03 19:25:48.812395+00	\N
79	sufit	{"biernik": "sufit", "wołacz": "suficie", "celownik": "sufitowi", "mianownik": "sufit", "narzędnik": "sufitem", "dopełniacz": "sufitu", "miejscownik": "suficie"}	{"biernik": "sufity", "wołacz": "sufity", "celownik": "sufitom", "mianownik": "sufity", "narzędnik": "sufitami", "dopełniacz": "sufitów", "miejscownik": "sufitach"}	{}	2025-07-03 19:25:51.125831+00	\N
81	łazienka	{"biernik": "łazienkę", "wołacz": "łazienko", "celownik": "łazience", "mianownik": "łazienka", "narzędnik": "łazienką", "dopełniacz": "łazienki", "miejscownik": "łazience"}	{"biernik": "łazienki", "wołacz": "łazienki", "celownik": "łazienkom", "mianownik": "łazienki", "narzędnik": "łazienkami", "dopełniacz": "łazienek", "miejscownik": "łazienkach"}	{}	2025-07-03 19:25:55.848989+00	\N
83	lodówka	{"biernik": "lodówkę", "wołacz": "lodówko", "celownik": "lodówce", "mianownik": "lodówka", "narzędnik": "lodówką", "dopełniacz": "lodówki", "miejscownik": "lodówce"}	{"biernik": "lodówki", "wołacz": "lodówki", "celownik": "lodówkom", "mianownik": "lodówki", "narzędnik": "lodówkami", "dopełniacz": "lodówek", "miejscownik": "lodówkach"}	{}	2025-07-03 19:26:00.503584+00	\N
85	zmywarka	{"biernik": "zmywarkę", "wołacz": "zmywarko", "celownik": "zmywarce", "mianownik": "zmywarka", "narzędnik": "zmywarką", "dopełniacz": "zmywarki", "miejscownik": "zmywarce"}	{"biernik": "zmywarki", "wołacz": "zmywarki", "celownik": "zmywarkom", "mianownik": "zmywarki", "narzędnik": "zmywarkami", "dopełniacz": "zmywarek", "miejscownik": "zmywarkach"}	{}	2025-07-03 19:26:05.207607+00	\N
86	bursztyn	{"biernik": "bursztyn", "wołacz": "bursztynie", "celownik": "bursztynowi", "mianownik": "bursztyn", "narzędnik": "bursztynem", "dopełniacz": "bursztynu", "miejscownik": "bursztynie"}	{"biernik": "bursztyny", "wołacz": "bursztyny", "celownik": "bursztynom", "mianownik": "bursztyny", "narzędnik": "bursztynami", "dopełniacz": "bursztynów", "miejscownik": "bursztynach"}	{}	2025-07-03 19:26:07.471836+00	\N
88	garnek	{"biernik": "garnek", "wołacz": "garnku", "celownik": "garnkowi", "mianownik": "garnek", "narzędnik": "garnkiem", "dopełniacz": "garnka", "miejscownik": "garnku"}	{"biernik": "garnki", "wołacz": "garnki", "celownik": "garnkom", "mianownik": "garnki", "narzędnik": "garnkami", "dopełniacz": "garnków", "miejscownik": "garnkach"}	{}	2025-07-03 19:26:12.123264+00	\N
90	sztućce	{"biernik": "", "wołacz": "", "celownik": "", "mianownik": "", "narzędnik": "", "dopełniacz": "", "miejscownik": ""}	{"biernik": "sztućce", "wołacz": "sztućce", "celownik": "sztućcom", "mianownik": "sztućce", "narzędnik": "sztućcami", "dopełniacz": "sztućców", "miejscownik": "sztućcach"}	{}	2025-07-03 19:26:16.802641+00	\N
92	kubek	{"biernik": "kubek", "wołacz": "kubku", "celownik": "kubkowi", "mianownik": "kubek", "narzędnik": "kubkiem", "dopełniacz": "kubka", "miejscownik": "kubku"}	{"biernik": "kubki", "wołacz": "kubki", "celownik": "kubkom", "mianownik": "kubki", "narzędnik": "kubkami", "dopełniacz": "kubków", "miejscownik": "kubkach"}	{}	2025-07-03 19:26:21.595576+00	\N
94	artysta	{"biernik": "artystę", "wołacz": "artysto", "celownik": "artyście", "mianownik": "artysta", "narzędnik": "artystą", "dopełniacz": "artysty", "miejscownik": "artyście"}	{"biernik": "artystów", "wołacz": "artyści, artysty", "celownik": "artystom", "mianownik": "artyści, artysty", "narzędnik": "artystami", "dopełniacz": "artystów", "miejscownik": "artystach"}	{}	2025-07-03 19:26:26.209542+00	\N
96	student	{"biernik": "studenta", "wołacz": "studencie", "celownik": "studentowi", "mianownik": "student", "narzędnik": "studentem", "dopełniacz": "studenta", "miejscownik": "studencie"}	{"biernik": "studentów", "wołacz": "studenci, studenty", "celownik": "studentom", "mianownik": "studenci, studenty", "narzędnik": "studentami", "dopełniacz": "studentów", "miejscownik": "studentach"}	{}	2025-07-03 19:26:30.875653+00	\N
97	uczeń	{"biernik": "ucznia", "wołacz": "uczniu", "celownik": "uczniowi", "mianownik": "uczeń", "narzędnik": "uczniem", "dopełniacz": "ucznia", "miejscownik": "uczniu"}	{"biernik": "uczniów, uczni", "wołacz": "uczniowie, ucznie", "celownik": "uczniom", "mianownik": "uczniowie, ucznie", "narzędnik": "uczniami", "dopełniacz": "uczniów, uczni", "miejscownik": "uczniach"}	{}	2025-07-03 19:26:33.285393+00	\N
99	muzyk	{"biernik": "muzyka", "wołacz": "muzyku", "celownik": "muzykowi", "mianownik": "muzyk", "narzędnik": "muzykiem", "dopełniacz": "muzyka", "miejscownik": "muzyku"}	{"biernik": "muzyków", "wołacz": "muzycy, muzyki", "celownik": "muzykom", "mianownik": "muzycy, muzyki", "narzędnik": "muzykami", "dopełniacz": "muzyków", "miejscownik": "muzykach"}	{}	2025-07-03 19:26:38.001397+00	\N
101	inżynier	{"biernik": "inżyniera", "wołacz": "inżynierze", "celownik": "inżynierowi", "mianownik": "inżynier", "narzędnik": "inżynierem", "dopełniacz": "inżyniera", "miejscownik": "inżynierze"}	{"biernik": "inżynierów", "wołacz": "inżynierzy, inżynierowie, inżyniery", "celownik": "inżynierom", "mianownik": "inżynierzy, inżynierowie, inżyniery", "narzędnik": "inżynierami", "dopełniacz": "inżynierów", "miejscownik": "inżynierach"}	{}	2025-07-03 19:26:42.767064+00	\N
35	sport	{"biernik": "sport, sporta", "wołacz": "sporcie", "celownik": "sportowi", "mianownik": "sport", "narzędnik": "sportem", "dopełniacz": "sportu, sporta", "miejscownik": "sporcie"}	{"biernik": "sporty", "wołacz": "sporty", "celownik": "sportom", "mianownik": "sporty", "narzędnik": "sportami", "dopełniacz": "sportów", "miejscownik": "sportach"}	{}	2025-07-03 19:23:58.980052+00	\N
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
104	programista	{"biernik": "programistę", "wołacz": "programisto", "celownik": "programiście", "mianownik": "programista", "narzędnik": "programistą", "dopełniacz": "programisty", "miejscownik": "programiście"}	{"biernik": "programistów", "wołacz": "programiści, programisty", "celownik": "programistom", "mianownik": "programiści, programisty", "narzędnik": "programistami", "dopełniacz": "programistów", "miejscownik": "programistach"}	{}	2025-07-03 19:26:49.741867+00	\N
105	kucharz	{"biernik": "kucharza", "wołacz": "kucharzu", "celownik": "kucharzowi", "mianownik": "kucharz", "narzędnik": "kucharzem", "dopełniacz": "kucharza", "miejscownik": "kucharzu"}	{"biernik": "kucharzy", "wołacz": "kucharze", "celownik": "kucharzom", "mianownik": "kucharze", "narzędnik": "kucharzami", "dopełniacz": "kucharzy", "miejscownik": "kucharzach"}	{}	2025-07-03 19:26:52.054205+00	\N
107	fachowiec	{"biernik": "fachowca", "wołacz": "fachowcu", "celownik": "fachowcowi", "mianownik": "fachowiec", "narzędnik": "fachowcem", "dopełniacz": "fachowca", "miejscownik": "fachowcu"}	{"biernik": "fachowców", "wołacz": "fachowcy, fachowce", "celownik": "fachowcom", "mianownik": "fachowcy, fachowce", "narzędnik": "fachowcami", "dopełniacz": "fachowców", "miejscownik": "fachowcach"}	{}	2025-07-03 19:26:56.652053+00	\N
109	projektant	{"biernik": "projektanta", "wołacz": "projektancie", "celownik": "projektantowi", "mianownik": "projektant", "narzędnik": "projektantem", "dopełniacz": "projektanta", "miejscownik": "projektancie"}	{"biernik": "projektantów", "wołacz": "projektanci, projektanty", "celownik": "projektantom", "mianownik": "projektanci, projektanty", "narzędnik": "projektantami", "dopełniacz": "projektantów", "miejscownik": "projektantach"}	{}	2025-07-03 19:27:01.332928+00	\N
111	fotograf	{"biernik": "fotografa", "wołacz": "fotografie", "celownik": "fotografowi", "mianownik": "fotograf", "narzędnik": "fotografem", "dopełniacz": "fotografa", "miejscownik": "fotografie"}	{"biernik": "fotografów", "wołacz": "fotografowie, fotografy", "celownik": "fotografom", "mianownik": "fotografowie, fotografy", "narzędnik": "fotografami", "dopełniacz": "fotografów", "miejscownik": "fotografach"}	{}	2025-07-03 19:27:06.073571+00	\N
113	ludzie	{"biernik": "", "wołacz": "", "celownik": "", "mianownik": "", "narzędnik": "", "dopełniacz": "", "miejscownik": ""}	{"biernik": "ludzi", "wołacz": "ludzie", "celownik": "ludziom", "mianownik": "ludzie", "narzędnik": "ludźmi", "dopełniacz": "ludzi", "miejscownik": "ludziach"}	{}	2025-07-03 19:27:13.418798+00	\N
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
141	pomidor	{"biernik": "pomidor, pomidora", "wołacz": "pomidorze", "celownik": "pomidorowi", "mianownik": "pomidor", "narzędnik": "pomidorem", "dopełniacz": "pomidora", "miejscownik": "pomidorze"}	{"biernik": "pomidory", "wołacz": "pomidory", "celownik": "pomidorom", "mianownik": "pomidory", "narzędnik": "pomidorami", "dopełniacz": "pomidorów", "miejscownik": "pomidorach"}	{}	2025-09-13 09:07:06.414144+00	\N
143	maślak	{"biernik": "maślaka", "wołacz": "maślaku", "celownik": "maślakowi", "mianownik": "maślak", "narzędnik": "maślakiem", "dopełniacz": "maślaka", "miejscownik": "maślaku"}	{"biernik": "maślaki", "wołacz": "maślaki", "celownik": "maślakom", "mianownik": "maślaki", "narzędnik": "maślakami", "dopełniacz": "maślaków", "miejscownik": "maślakach"}	{}	2025-09-13 09:07:06.414144+00	\N
138	mercedes	{"biernik": "mercedesa", "wołacz": "mercedesie", "celownik": "mercedesowi", "mianownik": "mercedes", "narzędnik": "mercedesem", "dopełniacz": "mercedesa", "miejscownik": "mercedesie"}	{"biernik": "mercedesy", "wołacz": "mercedesy", "celownik": "mercedesom", "mianownik": "mercedesy", "narzędnik": "mercedesami", "dopełniacz": "mercedesów", "miejscownik": "mercedesach"}	{}	2025-09-13 09:07:06.414144+00	\N
139	fiat	{"biernik": "fiata", "wołacz": "fiacie", "celownik": "fiatowi", "mianownik": "fiat", "narzędnik": "fiatem", "dopełniacz": "fiata", "miejscownik": "fiacie"}	{"biernik": "fiaty", "wołacz": "fiaty", "celownik": "fiatom", "mianownik": "fiaty", "narzędnik": "fiatami", "dopełniacz": "fiatów", "miejscownik": "fiatach"}	{}	2025-09-13 09:07:06.414144+00	\N
142	prawdziwek	{"biernik": "prawdziwka", "wołacz": "prawdziwku", "celownik": "prawdziwkowi", "mianownik": "prawdziwek", "narzędnik": "prawdziwkiem", "dopełniacz": "prawdziwka", "miejscownik": "prawdziwku"}	{"biernik": "prawdziwki, prawdziwków", "wołacz": "prawdziwki, prawdziwkowie, prawdziwki", "celownik": "prawdziwkom", "mianownik": "prawdziwki, prawdziwkowie, prawdziwki", "narzędnik": "prawdziwkami", "dopełniacz": "prawdziwków", "miejscownik": "prawdziwkach"}	{}	2025-09-13 09:07:06.414144+00	\N
144	hamburger	{"biernik": "hamburgera, hamburger", "wołacz": "hamburgerze", "celownik": "hamburgerowi", "mianownik": "hamburger", "narzędnik": "hamburgerem", "dopełniacz": "hamburgera", "miejscownik": "hamburgerze"}	{"biernik": "hamburgery", "wołacz": "hamburgery", "celownik": "hamburgerom", "mianownik": "hamburgery", "narzędnik": "hamburgerami", "dopełniacz": "hamburgerów", "miejscownik": "hamburgerach"}	{}	2025-09-13 09:07:06.414144+00	\N
137	pet	{"biernik": "pet, peta", "wołacz": "pecie", "celownik": "petowi", "mianownik": "pet", "narzędnik": "petem", "dopełniacz": "peta", "miejscownik": "pecie"}	{"biernik": "pety", "wołacz": "pety", "celownik": "petom", "mianownik": "pety", "narzędnik": "petami", "dopełniacz": "petów", "miejscownik": "petach"}	{}	2025-09-13 09:07:06.414144+00	\N
156	borowik	{"biernik": "borowika", "wołacz": "borowiku", "celownik": "borowikowi", "mianownik": "borowik", "narzędnik": "borowikiem", "dopełniacz": "borowika", "miejscownik": "borowiku"}	{"biernik": "borowiki", "wołacz": "borowiki", "celownik": "borowikom", "mianownik": "borowiki", "narzędnik": "borowikami", "dopełniacz": "borowików", "miejscownik": "borowikach"}	{}	2025-09-13 09:08:05.385472+00	\N
98	sportowiec	{"biernik": "sportowca", "wołacz": "sportowcu, sportowcze", "celownik": "sportowcowi", "mianownik": "sportowiec", "narzędnik": "sportowcem", "dopełniacz": "sportowca", "miejscownik": "sportowcu"}	{"biernik": "sportowców", "wołacz": "sportowcy, sportowce", "celownik": "sportowcom", "mianownik": "sportowcy, sportowce", "narzędnik": "sportowcami", "dopełniacz": "sportowców", "miejscownik": "sportowcach"}	{}	2025-07-03 19:26:35.658117+00	\N
146	sernik	{"biernik": "sernik, sernika", "wołacz": "serniku", "celownik": "sernikowi", "mianownik": "sernik", "narzędnik": "sernikiem", "dopełniacz": "sernika", "miejscownik": "serniku"}	{"biernik": "serniki", "wołacz": "serniki", "celownik": "sernikom", "mianownik": "serniki", "narzędnik": "sernikami", "dopełniacz": "serników", "miejscownik": "sernikach"}	{}	2025-09-13 09:07:06.414144+00	\N
150	sms	{"biernik": "sms, sms-a, smsa", "wołacz": "sms-ie, smsie, sms-ie, smsie", "celownik": "sms-owi, smsowi, sms-owi, smsowi", "mianownik": "sms", "narzędnik": "sms-em, smsem, sms-em, smsem", "dopełniacz": "sms-u, smsu, sms-a, smsa", "miejscownik": "sms-ie, smsie, sms-ie, smsie"}	{"biernik": "sms-y, smsy, sms-y, smsy", "wołacz": "sms-y, smsy, sms-y, smsy", "celownik": "sms-om, smsom, sms-om, smsom", "mianownik": "sms-y, smsy, sms-y, smsy", "narzędnik": "sms-ami, smsami, sms-ami, smsami", "dopełniacz": "sms-ów, smsów, sms-ów, smsów", "miejscownik": "sms-ach, smsach, sms-ach, smsach"}	{}	2025-09-13 09:07:06.414144+00	\N
151	facebook	{"biernik": "facebooka, facebook", "wołacz": "facebooku", "celownik": "facebookowi", "mianownik": "facebook", "narzędnik": "facebookiem", "dopełniacz": "facebooka", "miejscownik": "facebooku"}	{"biernik": "facebooki", "wołacz": "facebooki", "celownik": "facebookom", "mianownik": "facebooki", "narzędnik": "facebookami", "dopełniacz": "facebooków", "miejscownik": "facebookach"}	{}	2025-09-13 09:07:06.414144+00	\N
152	zoom	{"biernik": "zoom", "wołacz": "zoomie", "celownik": "zoomowi", "mianownik": "zoom", "narzędnik": "zoomem", "dopełniacz": "zoomu", "miejscownik": "zoomie"}	{"biernik": "zoomy", "wołacz": "zoomy", "celownik": "zoomom", "mianownik": "zoomy", "narzędnik": "zoomami", "dopełniacz": "zoomów", "miejscownik": "zoomach"}	{}	2025-09-13 09:07:06.414144+00	\N
153	ogórek	{"biernik": "ogórek, ogórka", "wołacz": "ogórku", "celownik": "ogórkowi", "mianownik": "ogórek", "narzędnik": "ogórkiem", "dopełniacz": "ogórka", "miejscownik": "ogórku"}	{"biernik": "ogórki", "wołacz": "ogórki", "celownik": "ogórkom", "mianownik": "ogórki", "narzędnik": "ogórkami", "dopełniacz": "ogórków", "miejscownik": "ogórkach"}	{}	2025-09-13 09:08:05.385472+00	\N
154	banan	{"biernik": "banan, banana", "wołacz": "bananie", "celownik": "bananowi", "mianownik": "banan", "narzędnik": "bananem", "dopełniacz": "banana, bananu", "miejscownik": "bananie"}	{"biernik": "banany", "wołacz": "banany", "celownik": "bananom", "mianownik": "banany", "narzędnik": "bananami", "dopełniacz": "bananów", "miejscownik": "bananach"}	{}	2025-09-13 09:08:05.385472+00	\N
155	arbuz	{"biernik": "arbuz, arbuza", "wołacz": "arbuzie", "celownik": "arbuzowi", "mianownik": "arbuz", "narzędnik": "arbuzem", "dopełniacz": "arbuza", "miejscownik": "arbuzie"}	{"biernik": "arbuzy", "wołacz": "arbuzy", "celownik": "arbuzom", "mianownik": "arbuzy", "narzędnik": "arbuzami", "dopełniacz": "arbuzów", "miejscownik": "arbuzach"}	{}	2025-09-13 09:08:05.385472+00	\N
145	pączek	{"biernik": "pączek, pączka", "wołacz": "pączku", "celownik": "pączkowi", "mianownik": "pączek", "narzędnik": "pączkiem", "dopełniacz": "pączka", "miejscownik": "pączku"}	{"biernik": "pączki", "wołacz": "pączki", "celownik": "pączkom", "mianownik": "pączki", "narzędnik": "pączkami", "dopełniacz": "pączków", "miejscownik": "pączkach"}	{}	2025-09-13 09:07:06.414144+00	\N
147	kotlet	{"biernik": "kotlet, kotleta", "wołacz": "kotlecie", "celownik": "kotletowi", "mianownik": "kotlet", "narzędnik": "kotletem", "dopełniacz": "kotleta", "miejscownik": "kotlecie"}	{"biernik": "kotlety", "wołacz": "kotlety", "celownik": "kotletom", "mianownik": "kotlety", "narzędnik": "kotletami", "dopełniacz": "kotletów", "miejscownik": "kotletach"}	{}	2025-09-13 09:07:06.414144+00	\N
148	link	{"biernik": "link, linka", "wołacz": "linku", "celownik": "linkowi", "mianownik": "link", "narzędnik": "linkiem", "dopełniacz": "linku, linka", "miejscownik": "linku"}	{"biernik": "linki", "wołacz": "linki", "celownik": "linkom", "mianownik": "linki", "narzędnik": "linkami", "dopełniacz": "linków", "miejscownik": "linkach"}	{}	2025-09-13 09:07:06.414144+00	\N
149	mail	{"biernik": "mail, maila", "wołacz": "mailu", "celownik": "mailowi", "mianownik": "mail", "narzędnik": "mailem", "dopełniacz": "maila, mailu", "miejscownik": "mailu"}	{"biernik": "maile", "wołacz": "maile", "celownik": "mailom", "mianownik": "maile", "narzędnik": "mailami", "dopełniacz": "maili", "miejscownik": "mailach"}	{}	2025-09-13 09:07:06.414144+00	\N
136	papieros	{"biernik": "papierosa, papieros", "wołacz": "papierosie", "celownik": "papierosowi", "mianownik": "papieros", "narzędnik": "papierosem", "dopełniacz": "papierosa", "miejscownik": "papierosie"}	{"biernik": "papierosy", "wołacz": "papierosy", "celownik": "papierosom", "mianownik": "papierosy", "narzędnik": "papierosami", "dopełniacz": "papierosów", "miejscownik": "papierosach"}	{}	2025-09-13 09:07:06.414144+00	\N
140	volkswagen	{"biernik": "volkswagena", "wołacz": "volkswagenie", "celownik": "volkswagenowi", "mianownik": "volkswagen", "narzędnik": "volkswagenem", "dopełniacz": "volkswagena", "miejscownik": "volkswagenie"}	{"biernik": "volkswageny", "wołacz": "volkswageny", "celownik": "volkswagenom", "mianownik": "volkswageny", "narzędnik": "volkswagenami", "dopełniacz": "volkswagenów", "miejscownik": "volkswagenach"}	{}	2025-09-13 09:07:06.414144+00	\N
10	kot	{"biernik": "kota", "wołacz": "kocie", "celownik": "kotu, kotowi", "mianownik": "kot", "narzędnik": "kotem", "dopełniacz": "kota", "miejscownik": "kocie"}	{"biernik": "koty, kotów", "wołacz": "koty, kotowie, koty", "celownik": "kotom", "mianownik": "koty, kotowie, koty", "narzędnik": "kotami", "dopełniacz": "kotów", "miejscownik": "kotach"}	{}	2025-07-03 19:22:58.232352+00	\N
2	kobieta	{"biernik": "kobietę", "wołacz": "kobieto", "celownik": "kobiecie", "mianownik": "kobieta", "narzędnik": "kobietą", "dopełniacz": "kobiety", "miejscownik": "kobiecie"}	{"biernik": "kobiety", "wołacz": "kobiety", "celownik": "kobietom", "mianownik": "kobiety", "narzędnik": "kobietami", "dopełniacz": "kobiet", "miejscownik": "kobietach"}	{}	2025-07-03 19:22:39.409013+00	\N
3	mężczyzna	{"biernik": "mężczyznę", "wołacz": "mężczyzno", "celownik": "mężczyźnie", "mianownik": "mężczyzna", "narzędnik": "mężczyzną", "dopełniacz": "mężczyzny", "miejscownik": "mężczyźnie"}	{"biernik": "mężczyzn", "wołacz": "mężczyźni, mężczyzny", "celownik": "mężczyznom", "mianownik": "mężczyźni, mężczyzny", "narzędnik": "mężczyznami", "dopełniacz": "mężczyzn", "miejscownik": "mężczyznach"}	{}	2025-07-03 19:22:41.83023+00	\N
5	dziewczyna	{"biernik": "dziewczynę", "wołacz": "dziewczyno", "celownik": "dziewczynie", "mianownik": "dziewczyna", "narzędnik": "dziewczyną", "dopełniacz": "dziewczyny", "miejscownik": "dziewczynie"}	{"biernik": "dziewczyny", "wołacz": "dziewczyny", "celownik": "dziewczynom", "mianownik": "dziewczyny", "narzędnik": "dziewczynami", "dopełniacz": "dziewczyn", "miejscownik": "dziewczynach"}	{}	2025-07-03 19:22:46.439833+00	\N
8	przyjaciółka	{"biernik": "przyjaciółkę", "wołacz": "przyjaciółko", "celownik": "przyjaciółce", "mianownik": "przyjaciółka", "narzędnik": "przyjaciółką", "dopełniacz": "przyjaciółki", "miejscownik": "przyjaciółce"}	{"biernik": "przyjaciółki", "wołacz": "przyjaciółki", "celownik": "przyjaciółkom", "mianownik": "przyjaciółki", "narzędnik": "przyjaciółkami", "dopełniacz": "przyjaciółek", "miejscownik": "przyjaciółkach"}	{}	2025-07-03 19:22:53.494042+00	\N
13	samochód	{"biernik": "samochód", "wołacz": "samochodzie", "celownik": "samochodowi", "mianownik": "samochód", "narzędnik": "samochodem", "dopełniacz": "samochodu", "miejscownik": "samochodzie"}	{"biernik": "samochody", "wołacz": "samochody", "celownik": "samochodom", "mianownik": "samochody", "narzędnik": "samochodami", "dopełniacz": "samochodów", "miejscownik": "samochodach"}	{}	2025-07-03 19:23:05.306091+00	\N
15	komputer	{"biernik": "komputer", "wołacz": "komputerze", "celownik": "komputerowi", "mianownik": "komputer", "narzędnik": "komputerem", "dopełniacz": "komputera", "miejscownik": "komputerze"}	{"biernik": "komputery", "wołacz": "komputery", "celownik": "komputerom", "mianownik": "komputery", "narzędnik": "komputerami", "dopełniacz": "komputerów", "miejscownik": "komputerach"}	{}	2025-07-03 19:23:09.898212+00	\N
20	wieś	{"biernik": "wieś", "wołacz": "wsi", "celownik": "wsi", "mianownik": "wieś", "narzędnik": "wsią", "dopełniacz": "wsi", "miejscownik": "wsi"}	{"biernik": "wsie", "wołacz": "wsie", "celownik": "wsiom", "mianownik": "wsie", "narzędnik": "wsiami", "dopełniacz": "wsi", "miejscownik": "wsiach"}	{}	2025-07-03 19:23:21.609972+00	\N
22	praca	{"biernik": "pracę", "wołacz": "praco", "celownik": "pracy", "mianownik": "praca", "narzędnik": "pracą", "dopełniacz": "pracy", "miejscownik": "pracy"}	{"biernik": "prace", "wołacz": "prace", "celownik": "pracom", "mianownik": "prace", "narzędnik": "pracami", "dopełniacz": "prac", "miejscownik": "pracach"}	{}	2025-07-03 19:23:26.281317+00	\N
24	drzewo	{"biernik": "drzewo", "wołacz": "drzewo", "celownik": "drzewu", "mianownik": "drzewo", "narzędnik": "drzewem", "dopełniacz": "drzewa", "miejscownik": "drzewie"}	{"biernik": "drzewa", "wołacz": "drzewa", "celownik": "drzewom", "mianownik": "drzewa", "narzędnik": "drzewami", "dopełniacz": "drzew", "miejscownik": "drzewach"}	{}	2025-07-03 19:23:30.949607+00	\N
26	miesiąc	{"biernik": "miesiąc", "wołacz": "miesiącu", "celownik": "miesiącowi", "mianownik": "miesiąc", "narzędnik": "miesiącem", "dopełniacz": "miesiąca", "miejscownik": "miesiącu"}	{"biernik": "miesiące", "wołacz": "miesiące", "celownik": "miesiącom", "mianownik": "miesiące", "narzędnik": "miesiącami", "dopełniacz": "miesięcy", "miejscownik": "miesiącach"}	{}	2025-07-03 19:23:35.653769+00	\N
17	stół	{"biernik": "stół", "wołacz": "stole", "celownik": "stołowi", "mianownik": "stół", "narzędnik": "stołem", "dopełniacz": "stołu", "miejscownik": "stole"}	{"biernik": "stoły", "wołacz": "stoły", "celownik": "stołom", "mianownik": "stoły", "narzędnik": "stołami", "dopełniacz": "stołów", "miejscownik": "stołach"}	{}	2025-07-03 19:23:14.558499+00	\N
72	stół	{"biernik": "stół", "wołacz": "stole", "celownik": "stołowi", "mianownik": "stół", "narzędnik": "stołem", "dopełniacz": "stołu", "miejscownik": "stole"}	{"biernik": "stoły", "wołacz": "stoły", "celownik": "stołom", "mianownik": "stoły", "narzędnik": "stołami", "dopełniacz": "stołów", "miejscownik": "stołach"}	{}	2025-07-03 19:25:34.847865+00	\N
158	pieniądz	{"biernik": "pieniądz", "wołacz": "pieniądzu", "celownik": "pieniądzowi", "mianownik": "pieniądz", "narzędnik": "pieniądzem", "dopełniacz": "pieniądza", "miejscownik": "pieniądzu"}	{"biernik": "pieniądze", "wołacz": "pieniądze", "celownik": "pieniądzom", "mianownik": "pieniądze", "narzędnik": "pieniędzmi", "dopełniacz": "pieniędzy", "miejscownik": "pieniądzach"}	{}	2025-09-13 12:19:39.408346+00	\N
29	jedzenie	{"biernik": "jedzenie", "wołacz": "jedzenie", "celownik": "jedzeniu", "mianownik": "jedzenie", "narzędnik": "jedzeniem", "dopełniacz": "jedzenia", "miejscownik": "jedzeniu"}	{"biernik": "jedzenia", "wołacz": "jedzenia", "celownik": "jedzeniom", "mianownik": "jedzenia", "narzędnik": "jedzeniami", "dopełniacz": "jedzeń", "miejscownik": "jedzeniach"}	{}	2025-07-03 19:23:45.040767+00	\N
31	klucz	{"biernik": "klucz", "wołacz": "kluczu", "celownik": "kluczowi", "mianownik": "klucz", "narzędnik": "kluczem", "dopełniacz": "klucza", "miejscownik": "kluczu"}	{"biernik": "klucze", "wołacz": "klucze", "celownik": "kluczom", "mianownik": "klucze", "narzędnik": "kluczami", "dopełniacz": "kluczy", "miejscownik": "kluczach"}	{}	2025-07-03 19:23:49.671939+00	\N
33	rower	{"biernik": "rower", "wołacz": "rowerze", "celownik": "rowerowi", "mianownik": "rower", "narzędnik": "rowerem", "dopełniacz": "roweru", "miejscownik": "rowerze"}	{"biernik": "rowery", "wołacz": "rowery", "celownik": "rowerom", "mianownik": "rowery", "narzędnik": "rowerami", "dopełniacz": "rowerów", "miejscownik": "rowerach"}	{}	2025-07-03 19:23:54.386006+00	\N
37	tata	{"biernik": "tatę", "wołacz": "tato", "celownik": "tacie", "mianownik": "tata", "narzędnik": "tatą", "dopełniacz": "taty", "miejscownik": "tacie"}	{"biernik": "tatów", "wołacz": "tatowie, taty", "celownik": "tatom", "mianownik": "tatowie, taty", "narzędnik": "tatami", "dopełniacz": "tatów", "miejscownik": "tatach"}	{}	2025-07-03 19:24:03.670756+00	\N
39	brat	{"biernik": "brata", "wołacz": "bracie", "celownik": "bratu", "mianownik": "brat", "narzędnik": "bratem", "dopełniacz": "brata", "miejscownik": "bracie"}	{"biernik": "braci", "wołacz": "bracia, braty", "celownik": "braciom", "mianownik": "bracia, braty", "narzędnik": "braćmi", "dopełniacz": "braci", "miejscownik": "braciach"}	{}	2025-07-03 19:24:08.411946+00	\N
41	dziadek	{"biernik": "dziadka", "wołacz": "dziadku", "celownik": "dziadkowi", "mianownik": "dziadek", "narzędnik": "dziadkiem", "dopełniacz": "dziadka", "miejscownik": "dziadku"}	{"biernik": "dziadki, dziadków", "wołacz": "dziadki, dziadkowie, dziadki", "celownik": "dziadkom", "mianownik": "dziadki, dziadkowie, dziadki", "narzędnik": "dziadkami", "dopełniacz": "dziadków", "miejscownik": "dziadkach"}	{}	2025-07-03 19:24:13.058849+00	\N
159	słońce	{"biernik": "słońce", "wołacz": "słońce", "celownik": "słońcu", "mianownik": "słońce", "narzędnik": "słońcem", "dopełniacz": "słońca", "miejscownik": "słońcu"}	{"biernik": "słońca", "wołacz": "słońca", "celownik": "słońcom", "mianownik": "słońca", "narzędnik": "słońcami", "dopełniacz": "słońc", "miejscownik": "słońcach"}	{}	2025-09-13 12:19:39.413802+00	\N
44	mleko	{"biernik": "mleko", "wołacz": "mleko", "celownik": "mleku", "mianownik": "mleko", "narzędnik": "mlekiem", "dopełniacz": "mleka", "miejscownik": "mleku"}	{"biernik": "mleka", "wołacz": "mleka", "celownik": "mlekom", "mianownik": "mleka", "narzędnik": "mlekami", "dopełniacz": "mlek", "miejscownik": "mlekach"}	{}	2025-07-03 19:24:22.368087+00	\N
46	woda	{"biernik": "wodę", "wołacz": "wodo", "celownik": "wodzie", "mianownik": "woda", "narzędnik": "wodą", "dopełniacz": "wody", "miejscownik": "wodzie"}	{"biernik": "wody", "wołacz": "wody", "celownik": "wodom", "mianownik": "wody", "narzędnik": "wodami", "dopełniacz": "wód", "miejscownik": "wodach"}	{}	2025-07-03 19:24:27.040928+00	\N
49	ciasto	{"biernik": "ciasto", "wołacz": "ciasto", "celownik": "ciastu", "mianownik": "ciasto", "narzędnik": "ciastem", "dopełniacz": "ciasta", "miejscownik": "cieście"}	{"biernik": "ciasta", "wołacz": "ciasta", "celownik": "ciastom", "mianownik": "ciasta", "narzędnik": "ciastami", "dopełniacz": "ciast", "miejscownik": "ciastach"}	{}	2025-07-03 19:24:33.984185+00	\N
160	owoc	{"biernik": "owoc", "wołacz": "owocu", "celownik": "owocowi", "mianownik": "owoc", "narzędnik": "owocem", "dopełniacz": "owocu", "miejscownik": "owocu"}	{"biernik": "owoce", "wołacz": "owoce", "celownik": "owocom", "mianownik": "owoce", "narzędnik": "owocami", "dopełniacz": "owoców", "miejscownik": "owocach"}	{}	2025-09-13 12:19:39.416827+00	\N
161	warzywo	{"biernik": "warzywo", "wołacz": "warzywo", "celownik": "warzywu", "mianownik": "warzywo", "narzędnik": "warzywem", "dopełniacz": "warzywa", "miejscownik": "warzywie"}	{"biernik": "warzywa", "wołacz": "warzywa", "celownik": "warzywom", "mianownik": "warzywa", "narzędnik": "warzywami", "dopełniacz": "warzyw", "miejscownik": "warzywach"}	{}	2025-09-13 12:19:39.417157+00	\N
51	sklep	{"biernik": "sklep", "wołacz": "sklepie", "celownik": "sklepowi", "mianownik": "sklep", "narzędnik": "sklepem", "dopełniacz": "sklepu", "miejscownik": "sklepie"}	{"biernik": "sklepy", "wołacz": "sklepy", "celownik": "sklepom", "mianownik": "sklepy", "narzędnik": "sklepami", "dopełniacz": "sklepów", "miejscownik": "sklepach"}	{}	2025-07-03 19:24:43.418916+00	\N
53	muzeum	{"biernik": "muzeum", "wołacz": "muzeum", "celownik": "muzeum", "mianownik": "muzeum", "narzędnik": "muzeum", "dopełniacz": "muzeum", "miejscownik": "muzeum"}	{"biernik": "muzea", "wołacz": "muzea", "celownik": "muzeom", "mianownik": "muzea", "narzędnik": "muzeami", "dopełniacz": "muzeów", "miejscownik": "muzeach"}	{}	2025-07-03 19:24:48.076033+00	\N
55	nazwisko	{"biernik": "nazwisko", "wołacz": "nazwisko", "celownik": "nazwisku", "mianownik": "nazwisko", "narzędnik": "nazwiskiem", "dopełniacz": "nazwiska", "miejscownik": "nazwisku"}	{"biernik": "nazwiska", "wołacz": "nazwiska", "celownik": "nazwiskom", "mianownik": "nazwiska", "narzędnik": "nazwiskami", "dopełniacz": "nazwisk", "miejscownik": "nazwiskach"}	{}	2025-07-03 19:24:52.710419+00	\N
57	telefon	{"biernik": "telefon", "wołacz": "telefonie", "celownik": "telefonowi", "mianownik": "telefon", "narzędnik": "telefonem", "dopełniacz": "telefonu", "miejscownik": "telefonie"}	{"biernik": "telefony", "wołacz": "telefony", "celownik": "telefonom", "mianownik": "telefony", "narzędnik": "telefonami", "dopełniacz": "telefonów", "miejscownik": "telefonach"}	{}	2025-07-03 19:24:57.352734+00	\N
162	e-mail	{"biernik": "e-mail, e-maila", "wołacz": "e-mailu", "celownik": "e-mailowi", "mianownik": "e-mail", "narzędnik": "e-mailem", "dopełniacz": "e-mailu, e-maila", "miejscownik": "e-mailu"}	{"biernik": "e-maile", "wołacz": "e-maile", "celownik": "e-mailom", "mianownik": "e-maile", "narzędnik": "e-mailami", "dopełniacz": "e-maili", "miejscownik": "e-mailach"}	{}	2025-09-13 12:19:39.41994+00	\N
58	internet	{"biernik": "internet", "wołacz": "internecie", "celownik": "internetowi", "mianownik": "internet", "narzędnik": "internetem", "dopełniacz": "internetu", "miejscownik": "internecie"}	{"biernik": "internety", "wołacz": "internety", "celownik": "internetom", "mianownik": "internety", "narzędnik": "internetami", "dopełniacz": "internetów", "miejscownik": "internetach"}	{}	2025-07-03 19:25:02.166719+00	\N
61	krem	{"biernik": "krem", "wołacz": "kremie", "celownik": "kremowi", "mianownik": "krem", "narzędnik": "kremem", "dopełniacz": "kremu", "miejscownik": "kremie"}	{"biernik": "kremy", "wołacz": "kremy", "celownik": "kremom", "mianownik": "kremy", "narzędnik": "kremami", "dopełniacz": "kremów", "miejscownik": "kremach"}	{}	2025-07-03 19:25:09.183783+00	\N
63	wtorek	{"biernik": "wtorek", "wołacz": "wtorku", "celownik": "wtorkowi", "mianownik": "wtorek", "narzędnik": "wtorkiem", "dopełniacz": "wtorku", "miejscownik": "wtorku"}	{"biernik": "wtorki", "wołacz": "wtorki", "celownik": "wtorkom", "mianownik": "wtorki", "narzędnik": "wtorkami", "dopełniacz": "wtorków", "miejscownik": "wtorkach"}	{}	2025-07-03 19:25:13.911539+00	\N
65	czwartek	{"biernik": "czwartek", "wołacz": "czwartku", "celownik": "czwartkowi", "mianownik": "czwartek", "narzędnik": "czwartkiem", "dopełniacz": "czwartku", "miejscownik": "czwartku"}	{"biernik": "czwartki", "wołacz": "czwartki", "celownik": "czwartkom", "mianownik": "czwartki", "narzędnik": "czwartkami", "dopełniacz": "czwartków", "miejscownik": "czwartkach"}	{}	2025-07-03 19:25:18.536698+00	\N
68	niedziela	{"biernik": "niedzielę", "wołacz": "niedzielo", "celownik": "niedzieli", "mianownik": "niedziela", "narzędnik": "niedzielą", "dopełniacz": "niedzieli", "miejscownik": "niedzieli"}	{"biernik": "niedziele", "wołacz": "niedziele", "celownik": "niedzielom", "mianownik": "niedziele", "narzędnik": "niedzielami", "dopełniacz": "niedzieli, niedziel", "miejscownik": "niedzielach"}	{}	2025-07-03 19:25:25.561738+00	\N
69	kościół	{"biernik": "kościół", "wołacz": "kościele", "celownik": "kościołowi", "mianownik": "kościół", "narzędnik": "kościołem", "dopełniacz": "kościoła", "miejscownik": "kościele"}	{"biernik": "kościoły", "wołacz": "kościoły", "celownik": "kościołom", "mianownik": "kościoły", "narzędnik": "kościołami", "dopełniacz": "kościołów", "miejscownik": "kościołach"}	{}	2025-07-03 19:25:27.869944+00	\N
73	krzesło	{"biernik": "krzesło", "wołacz": "krzesło", "celownik": "krzesłu", "mianownik": "krzesło", "narzędnik": "krzesłem", "dopełniacz": "krzesła", "miejscownik": "krześle"}	{"biernik": "krzesła", "wołacz": "krzesła", "celownik": "krzesłom", "mianownik": "krzesła", "narzędnik": "krzesłami", "dopełniacz": "krzeseł", "miejscownik": "krzesłach"}	{}	2025-07-03 19:25:37.12743+00	\N
75	okno	{"biernik": "okno", "wołacz": "okno", "celownik": "oknu", "mianownik": "okno", "narzędnik": "oknem", "dopełniacz": "okna", "miejscownik": "oknie"}	{"biernik": "okna", "wołacz": "okna", "celownik": "oknom", "mianownik": "okna", "narzędnik": "oknami", "dopełniacz": "okien", "miejscownik": "oknach"}	{}	2025-07-03 19:25:41.895473+00	\N
77	podłoga	{"biernik": "podłogę", "wołacz": "podłogo", "celownik": "podłodze", "mianownik": "podłoga", "narzędnik": "podłogą", "dopełniacz": "podłogi", "miejscownik": "podłodze"}	{"biernik": "podłogi", "wołacz": "podłogi", "celownik": "podłogom", "mianownik": "podłogi", "narzędnik": "podłogami", "dopełniacz": "podłóg", "miejscownik": "podłogach"}	{}	2025-07-03 19:25:46.51011+00	\N
80	kuchnia	{"biernik": "kuchnię", "wołacz": "kuchnio", "celownik": "kuchni", "mianownik": "kuchnia", "narzędnik": "kuchnią", "dopełniacz": "kuchni", "miejscownik": "kuchni"}	{"biernik": "kuchnie", "wołacz": "kuchnie", "celownik": "kuchniom", "mianownik": "kuchnie", "narzędnik": "kuchniami", "dopełniacz": "kuchni", "miejscownik": "kuchniach"}	{}	2025-07-03 19:25:53.5215+00	\N
82	pralka	{"biernik": "pralkę", "wołacz": "pralko", "celownik": "pralce", "mianownik": "pralka", "narzędnik": "pralką", "dopełniacz": "pralki", "miejscownik": "pralce"}	{"biernik": "pralki", "wołacz": "pralki", "celownik": "pralkom", "mianownik": "pralki", "narzędnik": "pralkami", "dopełniacz": "pralek", "miejscownik": "pralkach"}	{}	2025-07-03 19:25:58.179473+00	\N
84	mikrofalówka	{"biernik": "mikrofalówkę", "wołacz": "mikrofalówko", "celownik": "mikrofalówce", "mianownik": "mikrofalówka", "narzędnik": "mikrofalówką", "dopełniacz": "mikrofalówki", "miejscownik": "mikrofalówce"}	{"biernik": "mikrofalówki", "wołacz": "mikrofalówki", "celownik": "mikrofalówkom", "mianownik": "mikrofalówki", "narzędnik": "mikrofalówkami", "dopełniacz": "mikrofalówek", "miejscownik": "mikrofalówkach"}	{}	2025-07-03 19:26:02.852239+00	\N
87	srebro	{"biernik": "srebro", "wołacz": "srebro", "celownik": "srebru", "mianownik": "srebro", "narzędnik": "srebrem", "dopełniacz": "srebra", "miejscownik": "srebrze"}	{"biernik": "srebra", "wołacz": "srebra", "celownik": "srebrom", "mianownik": "srebra", "narzędnik": "srebrami", "dopełniacz": "sreber", "miejscownik": "srebrach"}	{}	2025-07-03 19:26:09.815412+00	\N
89	patelnia	{"biernik": "patelnię", "wołacz": "patelnio", "celownik": "patelni", "mianownik": "patelnia", "narzędnik": "patelnią", "dopełniacz": "patelni", "miejscownik": "patelni"}	{"biernik": "patelnie", "wołacz": "patelnie", "celownik": "patelniom", "mianownik": "patelnie", "narzędnik": "patelniami", "dopełniacz": "patelni, patelń", "miejscownik": "patelniach"}	{}	2025-07-03 19:26:14.486843+00	\N
91	talerz	{"biernik": "talerz", "wołacz": "talerzu", "celownik": "talerzowi", "mianownik": "talerz", "narzędnik": "talerzem", "dopełniacz": "talerza", "miejscownik": "talerzu"}	{"biernik": "talerze", "wołacz": "talerze", "celownik": "talerzom", "mianownik": "talerze", "narzędnik": "talerzami", "dopełniacz": "talerzy", "miejscownik": "talerzach"}	{}	2025-07-03 19:26:19.19508+00	\N
93	szklanka	{"biernik": "szklankę", "wołacz": "szklanko", "celownik": "szklance", "mianownik": "szklanka", "narzędnik": "szklanką", "dopełniacz": "szklanki", "miejscownik": "szklance"}	{"biernik": "szklanki", "wołacz": "szklanki", "celownik": "szklankom", "mianownik": "szklanki", "narzędnik": "szklankami", "dopełniacz": "szklanek", "miejscownik": "szklankach"}	{}	2025-07-03 19:26:23.917823+00	\N
95	pracownik	{"biernik": "pracownika", "wołacz": "pracowniku", "celownik": "pracownikowi", "mianownik": "pracownik", "narzędnik": "pracownikiem", "dopełniacz": "pracownika", "miejscownik": "pracowniku"}	{"biernik": "pracowników", "wołacz": "pracownicy, pracowniki", "celownik": "pracownikom", "mianownik": "pracownicy, pracowniki", "narzędnik": "pracownikami", "dopełniacz": "pracowników", "miejscownik": "pracownikach"}	{}	2025-07-03 19:26:28.529562+00	\N
100	pisarz	{"biernik": "pisarza", "wołacz": "pisarzu", "celownik": "pisarzowi", "mianownik": "pisarz", "narzędnik": "pisarzem", "dopełniacz": "pisarza", "miejscownik": "pisarzu"}	{"biernik": "pisarzy", "wołacz": "pisarze", "celownik": "pisarzom", "mianownik": "pisarze", "narzędnik": "pisarzami", "dopełniacz": "pisarzy", "miejscownik": "pisarzach"}	{}	2025-07-03 19:26:40.400885+00	\N
102	lekarz	{"biernik": "lekarza", "wołacz": "lekarzu", "celownik": "lekarzowi", "mianownik": "lekarz", "narzędnik": "lekarzem", "dopełniacz": "lekarza", "miejscownik": "lekarzu"}	{"biernik": "lekarzy", "wołacz": "lekarze", "celownik": "lekarzom", "mianownik": "lekarze", "narzędnik": "lekarzami", "dopełniacz": "lekarzy", "miejscownik": "lekarzach"}	{}	2025-07-03 19:26:45.069091+00	\N
106	sprzedawca	{"biernik": "sprzedawcę", "wołacz": "sprzedawco", "celownik": "sprzedawcy", "mianownik": "sprzedawca", "narzędnik": "sprzedawcą", "dopełniacz": "sprzedawcy", "miejscownik": "sprzedawcy"}	{"biernik": "sprzedawców", "wołacz": "sprzedawcy, sprzedawce", "celownik": "sprzedawcom", "mianownik": "sprzedawcy, sprzedawce", "narzędnik": "sprzedawcami", "dopełniacz": "sprzedawców", "miejscownik": "sprzedawcach"}	{}	2025-07-03 19:26:54.36354+00	\N
108	architekt	{"biernik": "architekta", "wołacz": "architekcie", "celownik": "architektowi", "mianownik": "architekt", "narzędnik": "architektem", "dopełniacz": "architekta", "miejscownik": "architekcie"}	{"biernik": "architektów", "wołacz": "architekci, architekty", "celownik": "architektom", "mianownik": "architekci, architekty", "narzędnik": "architektami", "dopełniacz": "architektów", "miejscownik": "architektach"}	{}	2025-07-03 19:26:59.021908+00	\N
110	dziennikarz	{"biernik": "dziennikarza", "wołacz": "dziennikarzu", "celownik": "dziennikarzowi", "mianownik": "dziennikarz", "narzędnik": "dziennikarzem", "dopełniacz": "dziennikarza", "miejscownik": "dziennikarzu"}	{"biernik": "dziennikarzy", "wołacz": "dziennikarze", "celownik": "dziennikarzom", "mianownik": "dziennikarze", "narzędnik": "dziennikarzami", "dopełniacz": "dziennikarzy", "miejscownik": "dziennikarzach"}	{}	2025-07-03 19:27:03.671799+00	\N
112	gospodyni	{"biernik": "gospodynię", "wołacz": "gospodyni", "celownik": "gospodyni", "mianownik": "gospodyni", "narzędnik": "gospodynią", "dopełniacz": "gospodyni", "miejscownik": "gospodyni"}	{"biernik": "gospodynie", "wołacz": "gospodynie", "celownik": "gospodyniom", "mianownik": "gospodynie", "narzędnik": "gospodyniami", "dopełniacz": "gospodyń", "miejscownik": "gospodyniach"}	{}	2025-07-03 19:27:08.483037+00	\N
163	kierowca	{"biernik": "kierowcę", "wołacz": "kierowco", "celownik": "kierowcy", "mianownik": "kierowca", "narzędnik": "kierowcą", "dopełniacz": "kierowcy", "miejscownik": "kierowcy"}	{"biernik": "kierowców", "wołacz": "kierowcy, kierowce", "celownik": "kierowcom", "mianownik": "kierowcy, kierowce", "narzędnik": "kierowcami", "dopełniacz": "kierowców", "miejscownik": "kierowcach"}	{}	2025-09-13 12:19:39.436688+00	\N
164	ksiądz	{"biernik": "księdza", "wołacz": "księże", "celownik": "księdzu", "mianownik": "ksiądz", "narzędnik": "księdzem", "dopełniacz": "księdza", "miejscownik": "księdzu"}	{"biernik": "księży", "wołacz": "księża", "celownik": "księżom", "mianownik": "księża", "narzędnik": "księżmi", "dopełniacz": "księży", "miejscownik": "księżach"}	{}	2025-09-13 12:19:39.437214+00	\N
103	naukowiec	{"biernik": "naukowca", "wołacz": "naukowcu, naukowcze", "celownik": "naukowcowi", "mianownik": "naukowiec", "narzędnik": "naukowcem", "dopełniacz": "naukowca", "miejscownik": "naukowcu"}	{"biernik": "naukowców", "wołacz": "naukowcy, naukowce", "celownik": "naukowcom", "mianownik": "naukowcy, naukowce", "narzędnik": "naukowcami", "dopełniacz": "naukowców", "miejscownik": "naukowcach"}	{}	2025-07-03 19:26:47.381103+00	\N
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
-- Data for Name: rules; Type: TABLE DATA; Schema: public; Owner: lingvar_user
--

COPY public.rules (id, title, description, parent_rule_id, ordering, created_at, updated_at) FROM stdin;
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

SELECT pg_catalog.setval('public.nouns_id_seq', 164, true);


--
-- Name: pronouns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lingvar_user
--

SELECT pg_catalog.setval('public.pronouns_id_seq', 9, true);


--
-- Name: rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lingvar_user
--

SELECT pg_catalog.setval('public.rules_id_seq', 1, false);


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
-- Name: rules rules_pkey; Type: CONSTRAINT; Schema: public; Owner: lingvar_user
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_pkey PRIMARY KEY (id);


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
-- Name: ix_rules_id; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE INDEX ix_rules_id ON public.rules USING btree (id);


--
-- Name: ix_rules_parent_rule_id; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE INDEX ix_rules_parent_rule_id ON public.rules USING btree (parent_rule_id);


--
-- Name: ix_rules_title; Type: INDEX; Schema: public; Owner: lingvar_user
--

CREATE INDEX ix_rules_title ON public.rules USING btree (title);


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
-- Name: rules rules_parent_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lingvar_user
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_parent_rule_id_fkey FOREIGN KEY (parent_rule_id) REFERENCES public.rules(id);


--
-- PostgreSQL database dump complete
--

\unrestrict krWIAzBgj43ABH7OkB6twis29UDYiPEPzoMarb1c2MorjyB4uPyRY6xcbeAFinb

