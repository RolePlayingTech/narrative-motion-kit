# Narrative Motion Kit

[English](README.md) · **Polski**

Biblioteka do tworzenia filmów dokumentalnych i objaśniających na podstawie gotowej narracji, z pomocą agentów AI. Łączy scenariusz wizualny, sceny wielokrotnego użytku, prawdziwe mapy, wykresy, lokalne materiały i deterministyczne renderowanie. Polski film demonstracyjny powstał dla kanału Świadek Dziejów; mechanizmy biblioteki można wykorzystać przy innych tematach i kanałach.

**Obraz powinien wyjaśniać coś, czego sam narrator nie przekazuje.** Projekt korzysta z TypeScript, SVG/HTML, D3, opcjonalnych warstw Canvas/Three.js, Playwright i ffmpeg. Zawiera działające komponenty, przykładowe filmy oraz procedurę kontroli jakości.

![Mapa regionalna oparta na rzeczywistych danych geograficznych](examples/map-v2.png)

[Obejrzyj film demonstracyjny v2](examples/demo-fuel-prices-v2.mp4) · [Przegląd plansz](examples/contact-01.jpg) · [Mapa przed i po poprawkach](examples/map-before-after.jpg) · [Pięć stylów](examples/style-presets.jpg)

## Szybki start

Wymagania: **Node.js 22.12 lub nowszy**, npm oraz `ffmpeg` i `ffprobe` dostępne w `PATH`.

```bash
git clone https://github.com/RolePlayingTech/narrative-motion-kit.git
cd narrative-motion-kit
npm ci
npx playwright install chromium
npm run dev -- --project demo-fuel-prices
```

Otwórz lokalny adres wypisany w terminalu. Na świeżym Linuksie Chromium może wymagać bibliotek systemowych — można je zainstalować przez `npx playwright install --with-deps chromium`. Fonty i materiały produkcyjne są ładowane lokalnie.

W Windows PowerShell używaj `npm.cmd` i `npx.cmd`, jeżeli skrypty PowerShell nie przekazują poprawnie argumentów po `--`.

```bash
# Pojedyncza klatka w określonym momencie
npm run render:frame -- --project demo-fuel-prices --time 14.5

# Arkusze z początkiem, środkiem i końcem każdej sceny
npm run render:contact -- --project demo-fuel-prices

# Wersja robocza, następnie film w docelowej rozdzielczości
npm run render:draft -- --project demo-fuel-prices --workers 2
npm run render:final -- --project demo-fuel-prices --workers 2 --resume

# Kontrola projektu, obrazu i dostępnego filmu wynikowego
npm run qa -- --project demo-fuel-prices
```

Wyniki trafiają do `projects/ID/renders/`. Film znajduje się w `renders/final/ID.mp4`, a obok niego lista źródeł, manifest renderowania i raport techniczny. Arkusze podglądowe są w `renders/contact/`. Pełny opis poleceń: [scripts/CLI.md](scripts/CLI.md).

## Jak powstaje film

### Obsługa w całości przez agenta AI

Dołącz plik z narracją i przekaż agentowi taką instrukcję:

> Utwórz gotowy film z załączonego nagrania, korzystając z Narrative Motion Kit. Przeczytaj AGENTS.md, docs/AGENT_PLAYBOOK.md oraz prompts/CREATE_VIDEO.md. Przeanalizuj cały plik i konstrukcję wypowiedzi, ustal sprawdzone znaczniki czasu oraz bardzo dokładnie dopasuj obraz do tego, co lektor mówi w danej sekundzie. Samodzielnie wyszukuj i pobieraj wartościowe, autentyczne zdjęcia i grafiki, w tym portrety istotnych omawianych postaci. Dobierz stylistykę, sprawdź film z dźwiękiem, popraw synchronizację i kompozycję, a następnie dostarcz film, źródła i raport jakości.

[Pełna instrukcja dla agenta](docs/AGENT_PLAYBOOK.md) obejmuje analizę wejścia, rozpoznanie struktury narracji, synchronizację słów z czytelnym obrazem, pobieranie materiałów i kontrolę gotowego filmu. Użytkownik dostarcza nagranie; agent prowadzi produkcję. Rozpoznawanie mowy i dokładne wyrównanie wymagają dostępnych agentowi narzędzi. Wbudowany podział czasu na podstawie liczby słów jest przybliżony i nie potwierdza dokładnej synchronizacji.

Nagranie lektora wyznacza długość filmu. Sceny odpowiadają kolejnym ideom, a nie równym odcinkom czasu. Agent wybiera sposób przedstawienia treści, zbiera źródła i lokalne materiały, przygotowuje storyboard, renderuje próbki, ocenia je i poprawia projekt przed eksportem.

1. Utwórz projekt i skopiuj nagranie do jego katalogu `narration/`.
2. Zmierz czas nagrania i dopasuj granice scen. Zwykły tekst daje jedynie przybliżone wyrównanie transkrypcji.
3. Zapisz źródła, dane, pochodzenie materiałów oraz informację, co obraz dodaje do narracji.
4. Dobierz stylistykę i sceny; przygotuj kolejne odsłonięcia elementów oraz uzasadnione przejścia.
5. Wyrenderuj i obejrzyj plansze, klatki oraz przejścia. Wykonaj przynajmniej jedną turę poprawek.
6. Wyrenderuj film z oryginalną narracją, uruchom QA i dołącz źródła oraz ocenę jakości.

```bash
npm run new:project -- moj-film
# Skopiuj nagranie i ustaw narration.file w project.json.
npm run audio:ingest -- --project moj-film --transcript transcript/narration.txt
npm run assets:check -- --project moj-film
npm run render:range -- --project moj-film --from 0 --to 3
```

Kompletny brief dla agenta znajduje się w [prompts/CREATE_VIDEO.md](prompts/CREATE_VIDEO.md). Repozytorium zawiera też [AGENTS.md](AGENTS.md), [instrukcję produkcji](docs/AI_WORKFLOW.md) i [skill create-documentary](.agents/skills/create-documentary/SKILL.md).

## Możliwości

- **12 rodzin scen:** liczba/statystyka, porównanie portretów, zdjęcie, materiał dowodowy, proces, podział całości, wykres liniowy, słupkowy, mapa z trasą, oś wydarzeń, porównanie wartości i scena własna.
- **Pięć stylów:** `reportage`, `archive`, `atlas`, `technical`, `editorial`. Agent sam dobiera styl do tematu i materiałów; jasne plansze `tone: "paper"` pozwalają wyróżnić źródła i dane.
- **Rzeczywista geografia:** lokalne GeoJSON/TopoJSON, projekcja Mercatora, zbliżenia, podpisy, skala, mapa lokalizacyjna i kontrola przecięcia lądu przez trasy morskie. Wybrzeża nie są generowane przez AI.
- **Spójny ruch:** animacje zależne od bezwzględnego czasu, klatki kluczowe, easing, kontrolowana losowość, kamera i przejścia przenoszące element między scenami.
- **Powtarzalny render:** klatki PNG, fragmenty, arkusze podglądowe, draft i H.264/AAC; równoległe strony przeglądarki, pamięć podręczna zależna od wejścia i kontrola przez ffprobe.
- **Źródła i jakość:** walidowany format JSON/YAML, rejestr twierdzeń, danych i materiałów, licencje, daty źródeł, lokalne fonty, testy oraz kryteria oceny wizualnej.
- **Rozszerzenia:** działające przykłady dokumentu HTML, cząstek Canvas i globu Three.js. Własne komponenty rozszerzają bibliotekę, nie zastępują podstawowego formatu scen.

Szczegóły i ograniczenia opisuje [katalog scen](docs/SCENE_CATALOG.md). Poprawny schemat projektu nie gwarantuje prawdziwości danych ani dobrego montażu.

## Przykłady

### Film o cenach paliw

`demo-fuel-prices` ma sześć scen i trwa 19,6 sekundy. Pokazuje ilustracyjną cenę, autentyczne archiwalne portrety, fragment konstytucji, proces dostaw, mapę Ormuzu i historyczne dane Brent. Role polityczne oraz dane odnoszą się do 2024 roku. Nagranie jest syntetyczne i dołączone jako WAV, więc render nie wymaga systemowego syntezatora mowy.

Wersja v2 ma większe elementy, jaśniejsze plansze dowodowe, dokładniejszą mapę Natural Earth w skali 1:10 mln i przejścia chroniące czytelność nagłówków. Trasa morska jest oznaczona jako schemat. Nie jest to raport o bieżących cenach ani mapa nawigacyjna.

[Raport weryfikacji](docs/VALIDATION.md) · [Ocena i poprawki](docs/DEMO_REVIEW.md) · [Źródła](examples/SOURCES.md). Pierwsza wersja pozostaje w `examples/v1/` jako materiał porównawczy.

### Galeria komponentów

`scene-gallery` to osobny, 36-sekundowy przykład bez narracji: dziewięć scen, w tym zdjęcie, chronologia, porównanie, wykresy i rozszerzenia DOM/Canvas/Three.js.

```bash
npm run dev -- --project scene-gallery
npm run render:contact -- --project scene-gallery
npm run test:gallery
```

## Dokumentacja

Dokumentacja techniczna jest obecnie po angielsku; oba README opisują uruchomienie i najważniejsze możliwości.

| Zagadnienie             | Dokumentacja                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Produkcja filmu         | [Workflow](docs/AI_WORKFLOW.md), [brief](prompts/CREATE_VIDEO.md)                                                                |
| Storyboard i stylistyka | [Storyboard](docs/STORYBOARDING.md), [style](docs/ART_DIRECTION.md), [język wizualny](docs/VISUAL_GRAMMAR.md)                    |
| Sceny i przejścia       | [Katalog](docs/SCENE_CATALOG.md), [rozszerzanie](docs/ADDING_SCENES.md), [przejścia](docs/TRANSITIONS.md)                        |
| Fakty i materiały       | [Research](docs/RESEARCH_POLICY.md), [materiały](docs/ASSET_POLICY.md), [dane](docs/DATA_VISUALIZATION.md), [mapy](docs/MAPS.md) |
| Dźwięk i render         | [Audio](docs/AUDIO.md), [renderowanie](docs/RENDERING.md), [CLI](scripts/CLI.md)                                                 |
| Jakość i rozwój         | [Kryteria](docs/QUALITY_RUBRIC.md), [architektura](docs/ARCHITECTURE.md), [rozwiązywanie problemów](docs/TROUBLESHOOTING.md)     |

## Rozwój i testy

```bash
npm run check
npm run test:integration
npm run test:gallery
npm run test:preview
npm run build
npm run format:check
```

Kod biblioteki znajduje się w `packages/`, podgląd w `apps/preview/`, narzędzia w `scripts/`, a sceny, fakty i materiały w `projects/`. Wyniki wykonanych testów są w [raporcie weryfikacji](docs/VALIDATION.md).

`npm run build` tworzy podgląd produkcyjny w `dist/`, z lokalnymi projektami i materiałami, bez cache i filmów wynikowych. Możesz go otworzyć poleceniem `npx vite preview --host 127.0.0.1`, a następnie adresem podanym przez Vite, np. `http://127.0.0.1:4173/?project=demo-fuel-prices`.

## Ograniczenia

Powtarzalność dotyczy tego samego projektu i czasu w ustalonym środowisku. Różne systemy, GPU i przeglądarki mogą rasteryzować inaczej. Format pionowy wymaga osobnej kompozycji i oceny. Warstwy DOM/Canvas/WebGL wymagają obecnie cięć między scenami. Nie ma wbudowanej sceny zsynchronizowanego klipu wideo ani dołączonego modelu transkrypcji czy generatora obrazów. Dostępne interfejsy można rozszerzać o własnych dostawców.

Presety nie zastępują reżyserii. Pola `grain`, `vignette`, `motion` i `stroke` są punktami rozszerzenia, a nie globalnie działającymi efektami. Research, zgodność faktów, dobór materiałów i ocena filmu nadal wymagają decyzji redakcyjnych.

## Licencje

Kod: [MIT](LICENSE). Zdjęcia, fonty, dane i nagrania mają odrębne zasady opisane w [MEDIA_LICENSE.md](MEDIA_LICENSE.md) oraz [liście źródeł](examples/SOURCES.md). Film demonstracyjny i oryginalne elementy graficzne są udostępnione na CC BY-SA 4.0 z zachowaniem przypisań. Licencja kodu nie zmienia licencji materiałów zewnętrznych.
