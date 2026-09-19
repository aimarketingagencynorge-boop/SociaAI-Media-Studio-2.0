# SociAI — samodzielny pilot

## Oferta

Aktualna oferta: karta wymagana, 7 dni / maks. 500 FC gratis, następnie automatyczny abonament 49 zł/mies. za 500 FC. Konto lub karta z wykorzystaną próbą nie otrzymują kolejnego gratisu. Pełne warunki i konfiguracja: [BILLING.md](BILLING.md). Wersja AI wymaga jeszcze konfiguracji Stripe i serwerowego dostępu do Firebase.

Przykład: plan siedmiu postów kosztuje 10 FC. Siedem obrazów z osobnym przygotowaniem promptów po 30 FC daje razem 220 FC. Skan strony (opcjonalny) kosztuje 50 FC. Pozostaje miejsce na poprawki; kolejne iteracje również zużywają kredyty. FC to wewnętrzne jednostki produktu, nie kwota w złotówkach ani gwarancja stałego kosztu dostawcy.

## Co można wypróbować teraz

Uruchom aplikację według URUCHOMIENIE.md. Publiczny warsztat znajduje się pod `/?workshop=1`. Działa bez logowania i bez wywołań AI:

- brief marki przechowywany lokalnie;
- siedem misji z edytowalnymi szkicami i wskazówkami dotyczącymi CTA;
- kopiowanie tekstu i pobranie siedmiu szkiców TXT;
- autorski szablon graficzny z własną nazwą, nagłówkiem i kolorem;
- eksport PNG 1080 × 1080 lub 1080 × 1350, bez znaku wodnego;
- kopiowanie linku do polecenia warsztatu.

Warsztat jest jawnie opisany jako szablonowy, bez AI. Nie udaje generowania. Edycje postów i grafiki pozostają tylko w bieżącej sesji; przed wyjściem należy je pobrać. Brief pozostaje w localStorage tej przeglądarki.

Wersja AI korzysta z istniejącego generatora i zapisu w Firebase. Uproszczony start pyta o nazwę, ofertę, odbiorców, platformę i język. Brief z warsztatu jest proponowany w formularzu. Zapis marki i zakończenie onboardingu są wykonywane jednym batchem; przy błędzie użytkownik pozostaje w formularzu. Pełny konfigurator nadal jest dostępny.

Kokpit prowadzi przez pierwszą misję i pokazuje prawdziwe saldo. Polecenie aplikacji kopiuje publiczny link; nie wysyła wiadomości ani nie nalicza fikcyjnych bonusów za polecenia.

## Ochrona pakietu startowego

- Rejestracja tworzy portfel z 0 FC. Kredyty przyznają zweryfikowane zdarzenia rozliczeniowe. Stare saldo nie jest uzupełniane przy logowaniu.
- Wymagane jest zweryfikowane konto e-mail w Firebase Auth; stan weryfikacji pochodzi z tokenu.
- `STARTER_DAILY_LIMIT=25` ogranicza rezerwacje nowych prób na dzień UTC, wspólnie dla instancji serwera dzięki licznikowi Firestore. Wartość 0 wstrzymuje nowe rezerwacje. Dotychczasowe konta nadal działają.
- AI: maksymalnie 20 żądań/minutę i 2 aktywne żądania na konto w procesie serwera. Przy skalowaniu limiter należy przenieść do wspólnego magazynu. To podstawowa ochrona pilota, nie kompletna ochrona przed tworzeniem wielu kont.
- Klient nie może samodzielnie dopisywać kredytów. Reguły Firestore trzeba wdrożyć przed otwarciem wersji AI.

## Wdrożenie niezależne od strony firmowej

Aplikacja może działać na osobnej domenie albo subdomenie. Link do pomocy prowadzi na socialmediastudio.pl. Kod nie wymaga działania strony firmowej.

Dołączony Dockerfile uruchamia frontend i serwer Express razem. Konfiguracja Firebase frontendu znajduje się w firebase-applet-config.json; sprawdź ją przed budową. Dla innej bazy przekaż build argument VITE_FIRESTORE_DATABASE_ID, zgodny z FIRESTORE_DATABASE_ID serwera.

```sh
docker build -t sociai-pilot .
docker run --rm -p 3000:3000 --env-file .env.local sociai-pilot
```

Kontener potrzebuje serwerowych poświadczeń Firebase. W hostingu nadaj tożsamość konta usługi albo wstrzyknij sekret FIREBASE_SERVICE_ACCOUNT. Ścieżka GOOGLE_APPLICATION_CREDENTIALS z hosta nie jest automatycznie dostępna w kontenerze; prywatny plik trzeba zamontować tylko do odczytu. Nie kopiuj sekretów do obrazu. Dockerfile został przygotowany, ale obrazu kontenera nie testowano.

Lokalny adres localhost działa tylko na tym komputerze. Aby polecać narzędzie innym, trzeba wdrożyć je pod adresem HTTPS i dodać domenę do Firebase Auth. Nie opublikowano zmian na działających stronach ani w repozytoriach GitHub.

## Weryfikacja i blokady

18 testów w 4 plikach, TypeScript i build produkcyjny przeszły. W przeglądarce sprawdzono działanie warsztatu i faktycznie pobrano PNG 1080 × 1350. Testy obejmują brak odnawiania starego salda, izolację szkiców, escaping SVG, brak wywołań sieciowych przez warsztat, autoryzację oraz limit równoległych żądań.

Klucz socialstudiopl w projekcie video został utworzony przez użytkownika i zapisany jako GEMINI_MASTER_KEY w lokalnym .env.local (ignorowanym przez Git). Zweryfikowano dostęp przez listę modeli Gemini: HTTP 200; modele tekstowe, obrazowe i Veo z konfiguracji są dostępne. Nie wykonano płatnego generowania. Wartość klucza nie jest dołączona do paczki.

Rzeczywiste generowanie AI i pełny przebieg logowanie → grant → AI → Storage pozostają niezweryfikowane do czasu konfiguracji poświadczeń. Sama obecność publicznej konfiguracji Firebase nie daje serwerowi uprawnień do bazy. Zasady i dalsze ograniczenia: URUCHOMIENIE.md.
