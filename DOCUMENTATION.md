# Dokumentacja Aplikacji: SociAI STUDIO

## 1. PRZEWODNIK PO INTERFEJSIE UŻYTKOWNIKA (UI & Style Guide)

Aplikacja SociAI STUDIO została zaprojektowana w estetyce **Cyberpunk / Sci-Fi**, łącząc głęboką czerń kosmosu z neonowymi akcentami. Interfejs ma sprawiać wrażenie kokpitu statku kosmicznego lub terminala dowodzenia.

### Paleta Kolorów
| Kategoria | Kolor HEX | Nazwa Tailwind | Zastosowanie |
| :--- | :--- | :--- | :--- |
| **Tło Główne** | `#0A0A12` | `bg-[#0A0A12]` | Główne tło aplikacji, głęboki granat/czerń. |
| **Primary (Fiolet)** | `#8C4DFF` | `text-[#8C4DFF]` | Główne przyciski akcji, akcenty marki, poświata fioletowa. |
| **Secondary (Cyjan)** | `#34E0F7` | `text-[#34E0F7]` | Elementy interaktywne, statusy, linki, poświata błękitna. |
| **Accent (Magenta)** | `#C74CFF` | `text-[#C74CFF]` | Dodatkowe akcenty wizualne, wyróżnienia, błędy krytyczne. |
| **Tekst Główny** | `#FFFFFF` | `text-white` | Nagłówki i kluczowe informacje. |
| **Tekst Wtórny** | `rgba(255,255,255,0.6)` | `text-white/60` | Opisy, teksty pomocnicze, etykiety. |
| **Tekst Wyciszony** | `rgba(255,255,255,0.2)` | `text-white/20` | Metadane, nieaktywne elementy, placeholder-y. |

### Typografia
*   **Nagłówki (H1-H6):** Czcionka **Orbitron**. Styl futurystyczny, wysoki kontrast, szerokie światło między literami (`tracking-tighter` lub `tracking-widest`). Wszystkie nagłówki są domyślnie pisane wielkimi literami (Uppercase).
*   **Tekst Główny (Body):** Czcionka **Inter**. Bezszeryfowa, zapewniająca wysoką czytelność na ciemnym tle. Używana w wagach 400 (Regular) i 600 (Semi-bold).
*   **Dane i Kod:** Czcionka **JetBrains Mono**. Używana do wyświetlania kredytów, statusów systemowych, logów oraz wartości liczbowych.

### Komponenty UI
#### Przyciski (NeonButton)
*   **Główny Przycisk Akcji (Purple):** Fioletowy neon, używany do kluczowych akcji (np. "Generuj", "Zapisz", "Start Misji").
*   **Przycisk Nawigacyjny (Cyan):** Cyjanowy neon, używany do nawigacji, filtrów i akcji pomocniczych.
*   **Przycisk Specjalny (Magenta):** Magentowy neon, używany do akcji "Premium" lub destrukcyjnych (np. "Usuń").
*   **Stany:**
    *   *Normalny:* Delikatna poświata (glow), przezroczyste tło (10% opacity koloru), obramowanie 2px.
    *   *Hover:* Skalowanie (1.05x), uniesienie (y: -2px), pełne wypełnienie kolorem, wzmocniona poświata.
    *   *Active (Tap):* Zmniejszenie skali (0.95x).
    *   *Disabled:* Przezroczystość 30%, skala szarości, kursor `not-allowed`.

#### Formularze (Inputy i Selecty)
*   **Pola Tekstowe:** Ciemne tło (`bg-white/5`), obramowanie `border-white/10`, zaokrąglenie `rounded-xl`. Focus aktywuje cyjanowe obramowanie i delikatny cień zewnętrzny.
*   **Sygnalizacja Błędów:** Tekst błędu pojawia się pod polem w kolorze czerwonym (`text-red-500`). Pole może pulsować na czerwono przy próbie wysłania błędnych danych.

#### Karty (Cards)
*   **Karta Posta:** Szklany panel (`glass-panel`) z podglądem grafiki, tekstem posta i przyciskami "Edytuj" / "Transmituj". Zawiera ikonę platformy w rogu.
*   **Karta Marki:** Kompaktowy panel z logo marki, nazwą i krótkim opisem. Kliknięcie otwiera pełny Brand Kit.

### Ikony
Używamy zestawu **Lucide React**.
*   **Zasady:** Ikony są zawsze monochromatyczne, dopasowane do koloru tekstu lub akcentu (np. cyjanowe ikony w menu bocznym).
*   **Przykłady:** `Zap` dla kredytów, `LayoutDashboard` dla pulpitu, `Dna` dla Brand Kit.

### Layout i Responsywność
*   **Desktop:** Stały Sidebar po lewej stronie (320px), centralny obszar treści (`main`) z efektem `backdrop-blur`.
*   **Mobile:** Sticky Header (wysokość 64px) z logo i przyciskiem Menu. Menu boczne wysuwa się jako pełnoekranowy Drawer z animacją `framer-motion`.
*   **Efekty Tła:** `starfield` (animowane gwiazdy) oraz `grid-overlay` (subtelna siatka), które pozostają nieruchome podczas przewijania treści.

---

## 2. PRZEWODNIK PO FUNKCJONALNOŚCI (UX & Logic)

### Nawigacja (Sidebar)
1.  **Centrum Dowodzenia (Dashboard):** Podgląd aktywnej misji (tygodnia), szybkie statystyki i lista zadań na dziś.
2.  **Planer Misji (Planner):** Widok kalendarza, gdzie można przeciągać i upuszczać posty między dniami.
3.  **Visual Forge (Studio):** Laboratorium generowania treści. Tu dzieje się magia AI.
4.  **Media Lab:** Archiwum wszystkich wygenerowanych obrazów i wideo.
5.  **DNA Marki (Brand Kit):** Miejsce definiowania tożsamości.
6.  **Fuel Station (Store):** Sklep z kredytami.
7.  **Ustawienia (Settings):** Zarządzanie profilem i kluczami API.

### Główne Procesy Użytkownika

#### Rejestracja i Logowanie (Onboarding)
1.  **Landing Page:** Użytkownik widzi futurystyczny ekran powitalny z przyciskiem "ROZPOCZNIJ MISJĘ".
2.  **Autoryzacja:** Logowanie przez Google (Firebase Auth).
3.  **Pierwszy Start:** System automatycznie tworzy dokument użytkownika w Firestore i przypisuje **500 kredytów ForceCredits (FC)**.
4.  **Szybki Skan:** Użytkownik jest zachęcany do podania URL swojej strony, aby AI mogło "zeskanować DNA" i przygotować pierwszy Brand Kit.

#### Skanowanie Marki (Core Feature)
1.  **Wejście:** Sekcja Brand Kit -> "SCAN UNIVERSE".
2.  **Proces:** Użytkownik wpisuje URL.
3.  **Animacja:** Wyświetlane są komunikaty: "Wysyłanie dronów skanujących...", "Ekstrakcja Meta-DNA...".
4.  **Wynik:** AI analizuje tekst strony i zwraca:
    *   Nazwę i opis marki.
    *   3 Persony zakupowe (np. "Przedsiębiorczy Marek", "Eko-świadoma Anna").
    *   Ton głosu (np. "Profesjonalny, ale z poczuciem humoru").
5.  **Zapis:** Dane są zapisywane w Firestore i stają się bazą dla wszystkich przyszłych postów.

#### Generowanie Posta (AI Studio)
1.  **Konfiguracja:** Wybór marki, platformy (np. Instagram) i tematu.
2.  **Generowanie:** Kliknięcie "GENERUJ". AI łączy DNA marki z tematem posta.
3.  **Wynik:** Użytkownik otrzymuje tekst posta, propozycję grafiki (prompt) i hashtagi.
4.  **Koszty:** Każda generacja odejmuje 10 FC z salda użytkownika (chyba że aktywny jest Neural Link).

#### Zarządzanie Kredytami
*   **Widoczność:** Saldo FC jest zawsze widoczne w dolnej części Sidebaru.
*   **Brak Paliwa:** Gdy saldo spadnie do 0, przyciski generowania zostają zablokowane, a użytkownik widzi czerwony komunikat "BRAK_PALIWA_FORCE".
*   **Neural Link (BYOK):** Użytkownik może wkleić własny klucz Gemini API w ustawieniach. Wtedy system przestaje pobierać kredyty platformy, a operacje są darmowe (rozliczane bezpośrednio z Google).

### Obsługa Błędów i Powiadomienia (Toasts)
Aplikacja komunikuje się za pomocą dyskretnych, ale wyraźnych powiadomień w rogu ekranu:
*   **Sukces:** "DNA ZSYNCHRONIZOWANE" - po poprawnym zapisaniu marki.
*   **Błąd:** "BŁĄD_ŁĄCZA_NEURONOWEGO" - gdy klucz API jest nieprawidłowy.
*   **Informacja:** "TRANSMISJA W TOKU" - podczas generowania treści.

---

## 3. SŁOWNIK POJĘĆ (Glossary)

*   **Marka (Brand):** Cyfrowy profil firmy, zawierający jej "DNA" (opis, styl, wartości).
*   **Persona:** Szczegółowy profil idealnego odbiorcy treści, stworzony przez AI na podstawie analizy marki.
*   **Ton Głosu (Tone of Voice):** Zbiór zasad komunikacji (słownictwo, emocje), które AI stosuje w generowanych tekstach.
*   **Kredyt (FC - ForceCredit):** Jednostka energii w aplikacji. 1 generacja posta = 10 FC.
*   **Post:** Kompletny pakiet treści (tekst + grafika + hashtagi) gotowy do wysłania do social mediów.
*   **Plan Tygodniowy (Mission Plan):** Strategia publikacji na 7 dni, generowana automatycznie przez AI.
*   **Neural Link:** Funkcja "Bring Your Own Key", pozwalająca na użycie własnego klucza API Gemini.
*   **Visual Forge:** Moduł AI Studio odpowiedzialny za generowanie warstwy wizualnej (grafik i wideo).
