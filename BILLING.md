# Abonament z weryfikacją karty

Ten dokument zastępuje wcześniejsze warunki pilota bez karty i bez terminu ważności.

## Uzgodniona oferta

- Nowe konto i karta: 7 dni oraz maks. 500 FC gratis.
- Następnie 49 zł miesięcznie za 500 FC, z automatycznym odnowieniem.
- Karta lub konto z wykorzystaną próbą: płatny plan od aktywacji, bez kolejnego gratisu.
- Wcześniejsze wyczerpanie FC nie przyspiesza opłaty. Niewykorzystane FC nie przechodzą na kolejny okres.
- Anulowanie odnowienia przed końcem próby pozwala uniknąć pierwszej opłaty. Zapisane materiały pozostają dostępne do eksportu.

Rejestracja tworzy konto z 0 FC. Dotychczasowe salda nie są usuwane i nie stają się automatycznie płatnym abonamentem. Również istniejący użytkownicy muszą zaakceptować warunki płatności.

## Przepływ

1. Logowanie Google i opis marki.
2. Rejestracja karty w Stripe Checkout (setup). Sama ta czynność nie uruchamia opłaty.
3. Podpisany webhook potwierdza kartę. Aplikacja zapisuje HMAC fingerprint, nie numer karty ani CVC.
4. Panel pokazuje próbę albo płatny plan. Klient akceptuje warunki i przechodzi do Checkout subscription, gdzie potwierdza cenę i termin obciążenia.
5. Próba otrzymuje kredyty po potwierdzeniu subskrypcji i zgodności użytej karty. Inna karta powoduje anulowanie próby przed płatnym odnowieniem.
6. Płatny okres otrzymuje 500 FC wyłącznie po invoice.paid. Nieudana płatność lub samo przekierowanie do aplikacji nie daje kredytów.
7. Zarządzanie i anulowanie przez Stripe Customer Portal.

Drugie konto nie powoduje ukrytej opłaty karnej: klient akceptuje abonament z pierwszą opłatą przy aktywacji.

## Ochrona

Rezerwacja karty jest transakcyjna. Domyślnie można rozpocząć 25 nowych rezerwacji prób dziennie UTC (STARTER_DAILY_LIMIT); porzucona sesja może zajmować rezerwację, ale nie nalicza opłaty. Otwarte sesje są używane ponownie, a operacje Stripe mają klucze idempotencji. Numer faktury i początek okresu chronią przed ponownym uzupełnieniem salda przez stare lub powtórzone webhooki. Termin dostępu AI sprawdza backend.

Kolekcje billingPrivate, cardTrials i billingInvoices nie są dostępne dla klienta. Fingerprint rozpoznaje kartę, nie osobę. Inne karty, nowe numery i wyjątki regionalne ograniczają skuteczność. Portfele cyfrowe mogą używać innych identyfikatorów, dlatego weryfikacja próby wymaga bezpośredniego wpisania karty w Stripe. Nie jest to gwarancja jednej próby na osobę.

## Konfiguracja

W konfiguracji serwera ustaw STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID, STRIPE_FINGERPRINT_SECRET i APP_URL. Zacznij od trybu testowego. Sekret fingerprint musi być stały, losowy i mieć co najmniej 32 znaki; jego zmiana wymaga migracji.

Cena Stripe musi wynosić dokładnie 4900 groszy, PLN, co miesiąc, per_unit / licensed, tax_behavior=inclusive. Inna cena blokuje zakup. APP_URL wskazuje publiczny adres HTTPS bez końcowego ukośnika; localhost jest dopuszczony do testów.

Webhook: POST /api/billing/webhook. Zdarzenia: checkout.session.completed, invoice.paid, customer.subscription.updated, customer.subscription.deleted. Weryfikacja podpisu używa surowego body przed parserem JSON. Użyj wersji zdarzeń zgodnej z zainstalowanym SDK Stripe.

W Customer Portal włącz zarządzanie kartą, faktury i anulowanie na koniec okresu. Wyłącz dowolne zmiany planu i ilości: pilot obsługuje jeden plan 49 zł / 500 FC. Przed publikacją sprawdź działanie anulowania, dane sprzedawcy, warunki usługi, konfigurację podatków i komunikaty o końcu próby.

## Odbiór

Sprawdź w Stripe test mode: nowe konto i kartę, tę samą kartę na drugim koncie, nowe karty na starym koncie, odmowę i 3DS, zamknięcie checkoutu, zmianę karty w drugim kroku, równoległe żądania, powtórne webhooki, anulowanie oraz Test Clock obejmujący koniec próby i odnowienie miesiąca. Wymagany jest pełny test z Firestore i Customer Portal.

Lokalne testy sprawdzają reguły ceny i karty, podpisy, replay próby i faktury, starszą fakturę, nieopłaconą fakturę, obcego klienta i zmianę karty. Nie zastępują odbioru w Stripe test mode ani testów współbieżności na rzeczywistym Firestore.

19 września 2026 utworzono w Stripe konta `acct_1QYtS9GCTUVg4lvl` (usetheforce.ai), wyłącznie w trybie testowym, produkt `prod_VHuMQ5nwTeFwhu` i cenę `price_1UHKXYGCTUVg4lvlywKVg2iv`: 49 PLN miesięcznie, lookup key `sociai_pln49_500_month_v1`. Przez API potwierdzono livemode=false, 4900 PLN, monthly/licensed oraz ustawiono tax_behavior=inclusive. Próba 7 dni jest nadawana przez aplikację w Checkout, nie przez domyślną cenę produktu.

Istniejący klucz testowy zapisano w ignorowanym pliku .env.local, razem z ID ceny, losowym stałym sekretem fingerprint i lokalnym APP_URL. Utworzono osobną konfigurację Customer Portal `bpc_1UHKanGCTUVg4lvloyk7QvFh`: historia faktur, zmiana karty, anulowanie na koniec okresu; zmiany planu i ilości wyłączone. Serwer przekazuje STRIPE_PORTAL_CONFIGURATION_ID podczas tworzenia sesji portalu.

Webhook nadal wymaga publicznego adresu HTTPS wdrożonego serwera i zapisu jego sekretu. Nie należy wpisywać fikcyjnego sekretu, żeby wymusić aktywację płatności. Nie utworzono realnych subskrypcji i nikogo nie obciążono. Interfejs pozostaje nieaktywny płatniczo do zakończenia konfiguracji. Pozostaje także konfiguracja serwerowego dostępu do Firebase oraz pełne testy Checkout/webhook/próba/odnowienie.

Źródła: [SetupIntent](https://docs.stripe.com/api/setup_intents), [subskrypcje](https://docs.stripe.com/api/subscriptions/create), [podpis webhooka](https://docs.stripe.com/webhooks/signature), [fingerprint](https://docs.stripe.com/api/tokens/object?api-version=2024-06-20).
