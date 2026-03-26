// --- SKRYPT DIAGNOSTYCZNY DO SPRAWDZENIA KLUCZA API GEMINI ---
// Ten skrypt jest przeznaczony do uruchomienia w środowisku Node.js.
// Uwaga: Twoja aplikacja to Vite SPA, więc ten skrypt służy jedynie do testów po stronie serwera/lokalnie.

const { GoogleGenAI } = require("@google/genai");

// 1. ZDEFINIUJ OCZEKIWANĄ NAZWĘ ZMIENNEJ ŚRODOWISKOWEJ
// W Twoim projekcie geminiService.ts szuka głównie 'GEMINI_API_KEY'.
const OCZEKIWANA_NAZWA_ZMIENNEJ = 'GEMINI_API_KEY'; 

console.log("--- ROZPOCZYNAM TEST DIAGNOSTYCZNY KLUCZA API ---");
console.log(`1. Sprawdzam obecność zmiennej środowiskowej: ${OCZEKIWANA_NAZWA_ZMIENNEJ}`);

// 2. ODCZYTAJ WARTOŚĆ ZMIENNEJ ZE ŚRODOWISKA
const apiKey = process.env[OCZEKIWANA_NAZWA_ZMIENNEJ];

// 3. WERYFIKACJA OBECNOŚCI KLUCZA
if (!apiKey) {
  console.error("BŁĄD KRYTYCZNY: Nie znaleziono klucza API!");
  console.error(`Upewnij się, że zmienna środowiskowa o nazwie '${OCZEKIWANA_NAZWA_ZMIENNEJ}' jest ustawiona.`);
  console.error("W AI Studio klucz powinien być automatycznie dostępny w trybie Preview.");
  console.error("NA CLOUD RUN: Musisz dodać tę zmienną ręcznie w panelu 'Variables & Secrets'.");
  process.exit(1); 
} else {
  console.log("SUKCES: Zmienna środowiskowa została znaleziona.");
  const maskedKey = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
  console.log(`Wartość klucza (zamaskowana): ${maskedKey}`);
}

// 4. PRÓBA UŻYCIA KLUCZA (TEST GENEROWANIA)
console.log("\n--- ROZPOCZYNAM TEST GENEROWANIA (PRÓBA POŁĄCZENIA Z API) ---");

async function runTest() {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Napisz jedno krótkie zdanie: 'Test połączenia z Gemini udany.'"
    });

    console.log("SUKCES: Połączenie z API Gemini udane!");
    console.log("Odpowiedź modelu: ", response.text);
    console.log("\nPODSUMOWANIE: Twój klucz API działa poprawnie w tym środowisku.");
    console.log("WAŻNE DLA CLOUD RUN:");
    console.log(`Upewnij się, że w konsoli Cloud Run dodałeś zmienną środowiskową o NAZWIE: '${OCZEKIWANA_NAZWA_ZMIENNEJ}'`);

  } catch (error) {
    console.error("BŁĄD PODCZAS GENEROWANIA:", error);
    process.exit(1);
  }
}

runTest();
