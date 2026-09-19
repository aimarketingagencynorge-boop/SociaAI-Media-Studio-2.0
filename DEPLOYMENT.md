# Wdrożenie SociAI Studio

Stan: 19 września 2026. Publiczna wersja do testów:
https://sociai-studio-app-3hq6ea4cyq-uw.a.run.app

Kod: gałąź `codex/sociai-launch`, PR #1. Główna gałąź nie została zmieniona.
Obraz aplikacji zbudowano z commitu `f210d31`; późniejsze commity dotyczą skryptów wdrożenia, dokumentacji i usunięcia nieaktualnego lockfile npm.

## Infrastruktura

- Google Cloud: `gen-lang-client-0893574157` (video), region `us-west1`.
- Cloud Run: `sociai-studio-app`, rewizja `sociai-studio-app-00003-s8r`, 100% ruchu.
- Dedykowane konto wykonawcze: `sociai-studio-runtime@gen-lang-client-0893574157.iam.gserviceaccount.com`.
- Firestore: `ai-studio-da2c7ce8-8cbd-4a4d-a1f0-c740600206e8`; uprawnienie konta usługi ograniczone warunkiem do tej bazy.
- Grafiki: `gen-lang-client-0893574157-sociai-media`, zapis przez serwer; reguły Storage blokują bezpośredni dostęp klienta. Wygenerowane pliki udostępnia serwer przez adresy z tokenem pobierania.
- Sekrety Gemini, Stripe, szyfrowania i odcisków kart są w Secret Manager. Nie umieszczać ich w repozytorium ani w kodzie przeglądarki.
- Domena Cloud Run została dodana do Firebase Authentication. Własna domena nie została podłączona.
- Poprzednia usługa `sociai-media-studio` pozostała bez zmian.

## Rozliczenia — wyłącznie tryb testowy

Oferta aplikacji: 7 dni i maksymalnie 500 FC gratis dla uprawnionej karty, następnie 49 zł/miesiąc za 500 FC. Karta wykorzystana wcześniej rozpoczyna płatny okres zgodnie z zaakceptowaną ofertą. Wyczerpanie kredytów samo nie przyspiesza pobrania opłaty.

Stripe używa klucza testowego, ceny `price_1UHKXYGCTUVg4lvlywKVg2iv` i portalu `bpc_1UHKanGCTUVg4lvloyk7QvFh`. Webhook testowy `we_1UHKpEGCTUVg4lvloYQsty2J`:
https://sociai-studio-app-3hq6ea4cyq-uw.a.run.app/api/billing/webhook

Prawdziwe płatności nie są uruchomione. Przed przejściem na live trzeba przetestować cały Checkout, przydzielanie kredytów, ponowne użycie karty i anulowanie, a następnie skonfigurować osobne zasoby oraz sekrety Stripe live.

## Sprawdzone i pozostałe testy

- Publiczna strona i warsztat: HTTP 200; `/api/health`: HTTP 200.
- Chroniony status abonamentu bez logowania: HTTP 401.
- Podpisany, nieszkodliwy test webhooka: HTTP 200; żądanie bez podpisu: HTTP 400.
- TypeScript: poprawny. Lokalna seria testów: 25 testów zaliczonych i jeden timeout testu UI; samodzielne powtórzenie tego testu UI zakończyło się powodzeniem.
- Potwierdzone w publicznej wersji po zalogowaniu użytkownika: plan postów oraz generowanie, zapis i wyświetlenie grafiki 1024 × 1024. Pełen cykl testowego abonamentu pozostaje do sprawdzenia.

### Naprawa Storage (19 września 2026)

Generowanie obrazu przez Gemini kończyło się sukcesem, ale pobranie adresu pliku przez Firebase zwracało 403. Jawnie wykonano `buckets:addFirebase` i dodano kontu wykonawczemu `roles/storage.legacyBucketReader` wyłącznie na magazynie SociAI, obok istniejącego `roles/storage.objectAdmin`. Skrypty uwzględniają oba kroki. Sam GET zasobu bucketu zwracał 200 z nazwą i nie wystarczał do potwierdzenia gotowości pobierania.

Weryfikacja po naprawie: pobranie istniejącego pliku przez token Firebase zwróciło HTTP 200 i `image/png`; nowa generacja z kokpitu wyświetliła załadowany obraz 1024 × 1024 bez błędu. Nie zmieniono obrazu Cloud Run ani klucza Gemini.

## Kolejne wydania

`scripts/cloud-prepare.sh` służy do pierwszego przygotowania: ustawia początkowe zmienne i wyłącza dostęp publiczny. Nie uruchamiać go ponownie na skonfigurowanej usłudze bez przeglądu, bo nadpisze konfigurację.

Po sprawdzeniu zmian i wybraniu właściwego commitu zwykłe wdrożenie istniejącej usługi zachowujące zmienne, sekrety i IAM:

```sh
gcloud run deploy sociai-studio-app --source=. --project=gen-lang-client-0893574157 --region=us-west1
```

Sprawdzić wynik budowania, gotowość rewizji, publiczną stronę oraz działanie po zalogowaniu. Zmiany Firestore/Storage/IAM wykonywać osobno i świadomie. Konfigurator sekretów tworzy nowe wersje sekretów przy każdym uruchomieniu; nie jest wymagany przy zwykłym wydaniu kodu.
