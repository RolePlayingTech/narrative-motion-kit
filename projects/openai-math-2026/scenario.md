# Świadek Dziejów — AI zaczyna robić nową matematykę

## Założenia
- długość: ok. 3:00–3:30
- format: 16:9
- styl: techniczny dokument Świadka Dziejów; `theme: technical`, z wybranymi scenami `tone: paper`
- rytm: Świadek → plansza/diagram → dialog → plansza → Świadek
- zasada: jedna dominująca myśl na scenę; liczby i procesy pełnoekranowo
- ważne zastrzeżenie: publikacja OpenAI zawiera wyniki na różnych etapach weryfikacji; nie wszystkie mają formalizację Lean i część niesformalizowanych wyników może zawierać błędy

## Scena 1 — Hook
**Obraz:** Ciemne tło. Świadek stoi przed olbrzymią tablicą pełną równań. Jedno równanie znika, a w jego miejscu pojawia się napis: „TEGO ROZWIĄZANIA WCZEŚNIEJ NIE BYŁO”.

**ŚWIADEK:**
„Do tej pory zachwycaliśmy się tym, że sztuczna inteligencja potrafi rozwiązać bardzo trudne zadanie. Tylko że nadal było to zadanie, na które człowiek znał odpowiedź. Teraz wydarzyło się coś znacznie ciekawszego.”

**Plansza końcowa:** „AI nie tylko odtwarza matematykę. Zaczyna proponować nową.”

---

## Scena 2 — Co opublikowało OpenAI
**Obraz:** Interfejs przypominający repozytorium. Licznik rośnie: 1 → 100 → 372 → 722.

**LEKTOR:**
„6 października OpenAI opublikowało zbiór wyników matematycznych wygenerowanych przez niewydany jeszcze model. W repozytorium znalazły się 722 manuskrypty, pogrupowane w 372 rodziny powiązanych wyników.”

**Na ekranie:**
- ~4000 problemów zadanych modelowi
- 722 manuskrypty
- 372 rodziny wyników
- średnio ~3 godziny ChatGPT Pro thinking compute na wynik

**Źródło:** OpenAI, openai/math

---

## Scena 3 — Najważniejsza różnica
**Obraz:** Ekran dzieli się na pół.

Lewa strona:
„STARY TEST AI”
zadanie → AI → znana odpowiedź → sprawdzenie

Prawa strona:
„BADANIE NAUKOWE”
otwarty problem → AI → nowa hipoteza/dowód → weryfikacja

**ŚWIADEK:**
„I właśnie tutaj jest cała różnica. Jeśli dam AI zadanie olimpijskie, możemy od razu sprawdzić wynik w kluczu. Ale przy otwartym problemie… klucza nie ma.”

**MATEMATYK:**
„Czyli model może napisać bardzo przekonujący dowód i jednocześnie popełnić błąd, którego nikt od razu nie zauważy.”

**ŚWIADEK:**
„Dokładnie. Dlatego najciekawsze nie jest samo generowanie odpowiedzi. Najciekawsze jest to, czy potrafimy je zweryfikować.”

---

## Scena 4 — Lean: komputer sprawdza dowód
**Obraz:** Prosty diagram budowany krok po kroku.

Twierdzenie → dowód AI → formalizacja Lean → komputer sprawdza każdy krok → ✓ / błąd

**LEKTOR:**
„Dlatego część dowodów została przepisana do Lean. To system, w którym matematyczny dowód zapisuje się tak precyzyjnie, że komputer może mechanicznie sprawdzić, czy kolejne kroki rzeczywiście wynikają jeden z drugiego.”

**MATEMATYK:**
„Czyli komputer potwierdza, że dowód jest poprawny?”

**ŚWIADEK:**
„Jeżeli został prawidłowo sformalizowany — tak. Nie sprawdza jednak automatycznie, czy wynik jest ważny, nowy ani czy formalizacja dokładnie oddaje pierwotne twierdzenie.”

**Plansza:** „Lean ≠ recenzent naukowy. Lean = bardzo precyzyjny kontroler logiki.”

---

## Scena 5 — Skala eksperymentu
**Obraz:** Około 4000 kropek reprezentujących problemy. Większość wygasa. Pozostające grupują się w 372 klastry, z których wychodzą 722 dokumenty.

**LEKTOR:**
„Modelowi zadano około czterech tysięcy otwartych problemów. Po selekcji wyników pod kątem znaczenia i po zgrupowaniu powiązanych prac powstał katalog 372 rodzin i 722 manuskryptów.”

**ŚWIADEK:**
„To jest ważniejsze niż pojedynczy efektowny przykład. OpenAI próbuje pokazać, że nie był to jeden szczęśliwy strzał, tylko zdolność pojawiająca się w wielu różnych dziedzinach matematyki.”

---

## Scena 6 — Jakie problemy
**Obraz:** Szybka, elegancka karuzela nazw; bez próby tłumaczenia wszystkich.

- wykładnik irracjonalności π
- hipotezy Mahlera
- ciągi arytmetyczne
- spin glasses
- algebry operatorowe
- relatywistyczny układ Vlasova–Maxwella

**MATEMATYK:**
„Czy przeciętny człowiek musi rozumieć te wszystkie nazwy?”

**ŚWIADEK:**
„Nie. Wystarczy zrozumieć, że to nie jest szkolny test z całek. To problemy z matematyki badawczej, nad którymi pracują specjaliści.”

---

## Scena 7 — Dlaczego to może być przełom
**Obraz:** Diagram wzrostu możliwości:
kalkulator → CAS → chatbot → solver → współpracownik badacza

**LEKTOR:**
„Jeśli ta zdolność okaże się powtarzalna, zmieni się rola AI w nauce. Nie będzie już tylko narzędziem do wyszukiwania literatury, liczenia czy pisania kodu. Może stać się systemem, który sam proponuje nowe twierdzenia, dowody i kierunki badań.”

**ŚWIADEK:**
„Matematyk nie musi wtedy spędzać miesięcy na każdej ślepej uliczce. Może dostać dziesiątki kandydatów, sprawdzić najlepsze i pójść dalej.”

**Plansza:** „Największa zmiana: od automatyzacji pracy → do automatyzacji części odkrycia.”

---

## Scena 8 — Ale ostrożnie
**Obraz:** Duży napis „722 ≠ 722 potwierdzone przełomy”. Pod spodem dokumenty rozdzielają się na:
formalized / under verification / possible issues

**LEKTOR:**
„I tu trzeba bardzo uważać. Samo OpenAI zaznacza, że wyniki znajdują się na różnych etapach weryfikacji. Nie wszystkie mają formalizację w Lean, a część niesformalizowanych prac może zawierać błędy.”

**ŚWIADEK:**
„Czyli nie: ‘AI rozwiązała 722 wielkie problemy matematyki’. Raczej: ‘AI wygenerowała setki kandydatów na nowe wyniki, z których wiele wygląda na wystarczająco wartościowe, żeby je publikować, sprawdzać i formalizować’.”

---

## Scena 9 — Puenta
**Obraz:** Świadek w pustej, ciemnej przestrzeni. Za nim równanie zapisuje się samo, następnie przechodzi w drzewo kolejnych twierdzeń.

**ŚWIADEK:**
„Największym wydarzeniem nie jest więc liczba 722. Jest nim moment, w którym zaczynamy na serio pytać, czy maszyna może nie tylko nauczyć się całej znanej matematyki… ale również dopisywać do niej następne strony.”

Krótka pauza.

„Jeżeli odpowiedź brzmi ‘tak’, to właśnie obserwujemy początek zupełnie nowego sposobu uprawiania nauki.”

**Plansza końcowa:** „AI jako narzędzie odkrycia — nie tylko odpowiedzi.”

## Źródła do filmu
- https://openai.com/index/sharing-ai-progress-in-mathematics/
- https://github.com/openai/math

## Uwagi produkcyjne
- Nie przedstawiać 722 jako liczby „rozwiązanych wielkich problemów”.
- W scenie z Lean wyraźnie odróżnić logiczną poprawność formalnego dowodu od nowości/znaczenia naukowego.
- W scenach 3–5 użyć `flow`, `statistic` i `breakdown/custom`; to ważniejsze niż dekoracyjne B-roll.
- Autentyczny screenshot strony OpenAI/GitHub może pojawić się krótko w scenie 2, ale główne wyjaśnienie powinno być zbudowane z własnych diagramów.
- Świadek pełni rolę ambasadora widza: zadaje krótkie pytania i formułuje mocne puenty; matematyk koryguje uproszczenia.
- Rekomendowany czas filmu: około 3:10 przy naturalnym, dość dynamicznym lektorze.
