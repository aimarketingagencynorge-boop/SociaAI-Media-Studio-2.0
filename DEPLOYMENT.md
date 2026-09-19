# Wdrożenie SociAI Studio

Stan: 19 września 2026. Publiczna aplikacja (Stripe LIVE):
https://sociai-studio-app-3hq6ea4cyq-uw.a.run.app

Kod: gałąź `codex/sociai-launch`, PR #1. Główna gałąź nie została zmieniona.
Kod bazowy wdrożenia: `5f8bfd1`; poprawka komunikatu anulowania: `fc613aa`.

## Infrastruktura

- Google Cloud: `gen-lang-client-0893574157` (video), region `us-west1`.
- Cloud Run: `sociai-studio-app`, konfiguracja LIVE aktywowana w rewizji `sociai-studio-app-00005-srj`. Następne wydania zachowują tę konfigurację.
- Dedykowane konto wykonawcze: `sociai-studio-runtime@gen-lang-client-0893574157.iam.gserviceaccount.com`.
- Firestore: `ai-studio-da2c7ce8-8cbd-4a4d-a1f0-c740600206e8`; uprawnienie konta usługi ograniczone warunkiem do tej bazy.
- Grafiki: `gen-lang-client-0893574157-sociai-media`, zapis przez serwer; reguły Storage blokują bezpośredni dostęp klienta. Wygenerowane pliki udostępnia serwer przez adresy z tokenem pobierania.
- Sekrety Gemini, Stripe, szyfrowania i odcisków kart są w Secret Manager. Nie umieszczać ich w repozytorium ani w kodzie przeglądarki.
- Domeny Cloud Run, socialmediastudio.pl i www.socialmediastudio.pl są dozwolone w Firebase Authentication. Własność domeny zweryfikowano przez Google Search Console, mapowania Cloud Run utworzono, DNS A/AAAA/CNAME wskazuje Google. Certyfikaty HTTPS w trakcie wystawiania przy ostatniej kontroli; APP_URL pozostaje na działającym adresie Cloud Run do potwierdzenia HTTPS.
- Poprzednia usługa `sociai-media-studio` pozostała bez zmian.

## Rozliczenia — Stripe LIVE

Oferta: 7 dni i maksymalnie 500 FC gratis dla nowego uprawnionego konta i karty, następnie 49 zł brutto miesięcznie za 500 FC. Powtórnie użyta karta/konto rozpoczyna płatny okres dopiero po zaakceptowaniu oferty. Wyczerpanie FC nie przyspiesza opłaty.

- Konto: acct_1QYtS9GCTUVg4lvl; charges_enabled i payouts_enabled potwierdzone przez LIVE API.
- Produkt: prod_VHveL2i5lgmXoy.
- Cena: price_1UHLn2GCTUVg4lvlsNuohL7V (4900 PLN cents, month, inclusive).
- Portal: bpc_1UHLn2GCTUVg4lvleBkwPBQf; anulowanie na koniec okresu, zmiana karty i faktury.
- Webhook: we_1UHLn3GCTUVg4lvlsAdycgdJ; API 2026-08-26.dahlia, checkout.session.completed, invoice.paid, customer.subscription.updated/deleted.
- Endpoint: https://sociai-studio-app-3hq6ea4cyq-uw.a.run.app/api/billing/webhook.
- Sekrety klucza Stripe i podpisu webhooka: wersja 2. Wersja 1 zawiera wcześniejszą konfigurację TEST; nie zamieniać ich niezależnie od ceny i portalu.
- LIVE używa oddzielnych kolekcji billingPrivateLive/cardTrialsLive/billingInvoicesLive.
- Nie wykonano prawdziwego obciążenia karty. Test podpisanego nieszkodliwego zdarzenia z sekretem LIVE zwrócił 200.

Sprzedawca: Webfabrikk Maciej Rydz, 934 291 735, Transistorfaret 2, 1396 Billingstad, Norwegia. Kontakt: aimarketingagencynorge@gmail.com. Publiczne dokumenty: /regulamin i /prywatnosc.

## Sprawdzone i pozostałe testy

- Publiczna strona i warsztat: HTTP 200; `/api/health`: HTTP 200.
- Chroniony status abonamentu bez logowania: HTTP 401.
- Podpisany, nieszkodliwy test webhooka: HTTP 200; żądanie bez podpisu: HTTP 400.
- TypeScript: poprawny. Pełny zestaw 28 testów przeszedł; dodatkowy test cancel_at przeszedł wraz z 5 pozostałymi testami webhooków.
- Potwierdzone w publicznej wersji po zalogowaniu użytkownika: plan postów oraz generowanie, zapis i wyświetlenie grafiki 1024 × 1024. Checkout TEST, karta 4242, abonament 49 PLN, portal i anulowanie przeszły. Po poprawce nowego pola invoice.status ponowiono autentyczny invoice.paid: saldo 500 FC, drugi replay bez duplikacji. Testowy abonament kończy się 19.10.2026 (cancel_at).

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
