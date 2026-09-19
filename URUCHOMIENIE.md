# Uruchomienie SociAI Media Studio

Aktualna oferta z kartą i abonamentem: [BILLING.md](BILLING.md). Poniższy opis zachowuje historię wcześniejszego pilota; w zakresie kredytów i płatności obowiązuje BILLING.md.

Aktualizacja: samodzielny pilot z warsztatem bez logowania opisany w [PILOT.md](PILOT.md).

## Stan tej wersji

Lokalnie poprawiony prototyp do przygotowania pilota. Zachowano kosmiczny interfejs, DNA marki, planety/platformy, studio i ForceCredits. Nie wdrożono zmian na sociaimedia.studio ani reguł do Firebase. Nie wykonano płatnych wywołań AI.

## Co poprawiono

- API wymaga tokenu Firebase; identyfikator użytkownika i workspace wynikają z tokenu. Klient nie może wybierać cudzego konta.
- Kredyty startowe są przyznawane jednokrotnie. Koszt jest rezerwowany transakcyjnie przed wywołaniem AI, a przy obsłużonym błędzie zwracany. Klient nie może zmieniać salda ani roli.
- Klucze użytkowników zapisuje serwer w osobnej kolekcji workspaceSecrets. Przy inicjalizacji konta przenosi istniejący klucz z dokumentu workspace. Z frontendu usunięto wstrzykiwanie klucza Gemini.
- Usunięto zdjęcia stockowe i demonstracyjne filmy zwracane po błędzie generowania. Błąd jest widoczny zamiast pozornego sukcesu.
- Plan tygodnia generuje siedem tekstowych szkiców, z datami. Grafiki powstają na żądanie; awaria jednej grafiki nie kasuje całego planu. Koszt planu: 10 FC.
- Prompty uwzględniają DNA marki, język, kierunek wizualny platformy, słownictwo i referencje. Studio obsługuje przełącznik palety. Format obrazu zależy od platformy.
- Naprawiono wybór image-to-video, walidację wejścia, eksport plików oraz nakładanie faktycznego logo, tekstu i podpisu na pobierany obraz.
- Wygenerowane multimedia serwer zapisuje w Firebase Storage; dokumenty otrzymują URL zamiast wielomegabajtowego base64.
- Poprawiono zapisy kolejnych postów, daty i nawigację kalendarza. Nowy plan dopisywany jest do istniejących postów.
- Usunięto domyślny obcy webhook, fikcyjne wyniki kampanii i pozornie działające zakupy. Eksport sprawdza odpowiedź HTTP.

## Konfiguracja

1. Zainstaluj Node.js 22+ i pnpm. W katalogu projektu wykonaj `pnpm install --frozen-lockfile`. Źródłem odtwarzalnej instalacji tej wersji jest pnpm-lock.yaml.
2. Skopiuj `.env.example` do `.env.local`. Plik ten jest ignorowany przez Git i nie powinien trafić do paczki ani frontendu.
3. Ustaw `GEMINI_MASTER_KEY` z dostępem do generowania tekstu i obrazów. Modele możesz zmieniać przez `GEMINI_TEXT_MODEL`, `GEMINI_IMAGE_MODEL`, `GEMINI_VIDEO_MODEL`. Dostępność i limity zależą od konta dostawcy.
4. Ustaw `AI_ENCRYPTION_KEY` na trwały losowy sekret długości przynajmniej 32 znaków. Zmiana klucza unieważnia możliwość odczytu wcześniej zapisanych kluczy użytkowników. Nie zastępuj go przy każdym restarcie. Przy migracji zachowaj istniejący poprawny sekret albo poproś użytkowników o ponowne wpisanie ich kluczy.
5. Sprawdź publiczną konfigurację `firebase-applet-config.json`. Firebase Auth, frontend, backend, baza i bucket muszą należeć do właściwego projektu. Zmiana samego FIREBASE_PROJECT_ID nie zmienia konfiguracji frontendu.
6. Ustaw `FIREBASE_PROJECT_ID`. `FIRESTORE_DATABASE_ID` i `VITE_FIRESTORE_DATABASE_ID` muszą wskazywać tę samą istniejącą bazę. Dla bazy domyślnej wpisz `(default)` w obu. Zmienne VITE wymagają ponownego builda.
7. Nadaj serwerowi uprawnienia do Firestore i Firebase Storage poprzez konto usługi. Preferuj Application Default Credentials w środowisku hostingu; lokalnie można ustawić `GOOGLE_APPLICATION_CREDENTIALS` na ścieżkę do prywatnego pliku JSON. Alternatywnie `FIREBASE_SERVICE_ACCOUNT` przyjmuje cały JSON konta usługi. Nigdy nie umieszczaj go w konfiguracji przeglądarki.
8. Utwórz/włącz Firebase Storage i ustaw `FIREBASE_STORAGE_BUCKET` na jego nazwę. Wyniki otrzymują link z tokenem pobierania: każdy posiadacz takiego linku może pobrać plik. Dla eksportów canvas skonfiguruj CORS bucketa dla własnych domen i localhost, metod GET/HEAD. Nie otwieraj publicznego zapisu.
9. W Firebase Auth włącz Google i dodaj localhost oraz docelową domenę do dozwolonych domen.
10. Wdróż zawartość `firestore.rules` do właściwej bazy. To konieczny element zabezpieczeń, nie wystarczy zmiana lokalnego pliku. Przed migracją istniejących danych wykonaj kopię. Stare klucze w dokumentach workspace przenoszą się przy logowaniu; przed publicznym startem trzeba sprawdzić także nieaktywne konta.

## Uruchomienie

Development: `pnpm dev`.

Produkcja: `pnpm build`, następnie `pnpm start` z `NODE_ENV=production` i portem wskazanym przez hosting (`PORT`). W PowerShell:

```powershell
$env:NODE_ENV = 'production'
$env:PORT = '3000'
pnpm start
```

Hosting musi uruchamiać Express i obsługiwać dłuższe żądania generowania. `pnpm preview` uruchamia tylko podgląd frontendu, bez API. Nie usuwaj zależności tsx, których używa start serwera.

`GET /api/health` potwierdza uruchomienie HTTP, nie poprawność klucza AI ani dostępu do bazy.

## Test odbiorczy po konfiguracji

1. Zaloguj się kontem testowym. Potwierdź utworzenie workspace i jednorazowe 500 FC. Ponowne logowanie nie może uzupełniać salda.
2. Uzupełnij DNA marki ręcznie: oferta, język, odbiorcy, ton, paleta, kierunek platformy. Skan strony jest opcjonalny; przy jego błędzie nie tworzymy fikcyjnego opisu firmy.
3. Wygeneruj plan siedmiu postów; sprawdź język, daty i zapis po odświeżeniu. Następnie wygeneruj jedną grafikę.
4. Sprawdź wariant z referencją produktu, pobranie PNG z własnym logo i podpisem oraz zapis w bibliotece. Link w Firestore powinien wskazywać plik Storage.
5. Sprawdź brak dostępu konta B do danych konta A i odmowę API bez tokenu.
6. Sprawdź kontrolowany błąd dostawcy i zwrot rezerwacji FC. Osobno zweryfikuj video, jeśli konto ma dostęp do Veo.
7. Webhook testuj na własnym odbiorniku; dopiero odpowiedź docelowej platformy pozwala potwierdzić publikację.

## Weryfikacja lokalna

Wynik: TypeScript OK, 18/18 testów w 4 plikach OK, build produkcyjny OK.

Polecenia: `pnpm lint`, `pnpm test`, `pnpm build`. Testy obejmują autoryzację API, walidację wyników i akcji, plan tygodniowy, propagację błędów obrazów/video, daty oraz start interfejsu. Sprawdzono także podgląd w przeglądarce, health HTTP i odrzucenie anonimowego żądania generowania kodem 401.

Nie wykonano pełnego testu: logowanie → rzeczywiste AI → Storage → odczyt po ponownym logowaniu. Wymaga konfiguracji dostępu; testy z atrapą dostawcy nie zastępują tego odbioru.

## Co pozostaje przed publiczną sprzedażą

- Płatności: rzeczywisty checkout, potwierdzany podpisem webhook płatniczy, idempotentne naliczanie kredytów. Przyciski zakupów są obecnie wyłączone.
- Publikowanie: OAuth i API platform lub własna integracja webhook. Obecna wersja przygotowuje i eksportuje treści; nie potwierdza automatycznej publikacji.
- Odporność operacyjna: wspólne limity żądań przy skalowaniu (limit w procesie już dodany), ochrona przed wielokrotnym zakładaniem kont po darmowe kredyty, idempotencja zleceń i odzyskiwanie rezerwacji po restarcie serwera. Obecny zwrot obejmuje obsłużone błędy, nie awarię procesu w trakcie zadania. Dla video docelowo kolejka zadań zamiast długiego HTTP.
- Walidacja semantyczna tekstu odbywa się w przeglądarce; gdy dostawca zwróci nieprawidłowy JSON, ale niepustą odpowiedź, operacja tekstowa może zostać rozliczona. Warto przenieść walidację schematów na serwer przed rozliczeniem.
- Nakładki logo/tekstu/podpisu są wypalane przy pobieraniu PNG. Biblioteka i planer przechowują obraz źródłowy; nakładki nie są wypalane w video.
- Ręcznie przesyłane referencje i logo wymagają docelowo pełnego uploadu do Storage zamiast przechowywania obrazów w dokumentach. Sprawdź limity i jakość przy większych plikach.
- Statystyki zasięgu wymagają integracji z platformami. Obecny panel pokazuje rzeczywiste dane lokalnego planu, bez fikcyjnych wyników.
- Reguły Firestore wymagają osobnego testu w emulatorze przed publicznym wdrożeniem. Nie przeprowadzono testów obciążeniowych ani kompletnego audytu bezpieczeństwa.

## Rekomendowany pierwszy produkt

Pilot: „Od DNA marki do tygodnia gotowych treści”. Jedna marka, plan siedmiu postów, wybrane grafiki, edycja i eksport. Misje mogą uczyć hooków, CTA i pracy z referencjami w trakcie tworzenia. To spójne z istniejącym kokpitem i daje konkretny rezultat bez obietnic popularności. Video, płatności i autopublikację uruchamiaj jako kolejne, odrębnie sprawdzone etapy.
