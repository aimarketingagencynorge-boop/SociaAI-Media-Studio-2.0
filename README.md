# SociAI Media Studio

Kosmiczny kokpit do planowania treści i tworzenia grafik zgodnych z DNA marki.

Nowy pilot: [PILOT.md](PILOT.md) — warsztat bez konta i szybki start marki.

Aktualna oferta AI: [BILLING.md](BILLING.md) — 7 dni / maks. 500 FC po rejestracji karty, potem 49 zł/mies. za 500 FC.

Instrukcja konfiguracji, zakres poprawek i ograniczenia: [URUCHOMIENIE.md](URUCHOMIENIE.md).

Wymagany jest serwer Node.js 22+ oraz Firebase. Sam hosting statycznego katalogu `dist` nie uruchomi API.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Najpierw przygotuj `.env.local` zgodnie z instrukcją. Klucz Gemini ustaw jako `GEMINI_MASTER_KEY`; nigdy jako zmienną `VITE_*`.
