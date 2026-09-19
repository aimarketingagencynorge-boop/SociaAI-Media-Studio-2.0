export interface WorkshopBrief { name: string; offer: string; audience: string }
export const WORKSHOP_STORAGE_KEY = 'sociai-workshop-v1';
export const missions = [
  ['Poznajmy się', 'Powiedz, komu i w czym pomagasz.'],
  ['Jedna wskazówka', 'Podziel się radą, którą odbiorca może dziś zastosować.'],
  ['Za kulisami', 'Pokaż prawdziwy fragment swojej pracy.'],
  ['Częste pytanie', 'Odpowiedz na pytanie, które słyszysz od klientów.'],
  ['Twoje podejście', 'Wyjaśnij jedną rzecz, którą robisz po swojemu.'],
  ['Zaproszenie', 'Przedstaw ofertę i jeden prosty następny krok.'],
  ['Rozmowa', 'Zapytaj społeczność, czego potrzebuje.'],
] as const;

export function workshopPost(brief: WorkshopBrief, day: number) {
  const name = brief.name.trim() || 'Twoja marka';
  const offer = brief.offer.trim() || '[opisz swoją ofertę]';
  const audience = brief.audience.trim() || '[opisz swoich odbiorców]';
  return [
    `Cześć, tu ${name}!\n\nNasza oferta: ${offer}. Tworzymy ją z myślą o: ${audience}.\n\nCo chcielibyście wiedzieć na początek?`,
    `Jedna mała zmiana, od której warto zacząć.\n\n[Wpisz konkretną wskazówkę związaną z Twoją ofertą: ${offer}. Dodaj przykład zastosowania.]\n\nZapisz ten post, żeby wrócić do wskazówki.`,
    `Tak wygląda praca w ${name} od środka.\n\n[Opisz prawdziwy etap pracy i pokaż własne zdjęcie lub krótkie nagranie.]\n\nKtóry etap pokazać dokładniej?`,
    `Często pytacie: [wpisz prawdziwe pytanie klienta].\n\n[Odpowiedz jasno w 2–3 zdaniach. Dodaj ważny warunek lub ograniczenie.]\n\nMasz kolejne pytanie? Napisz w komentarzu.`,
    `W ${name} zwracamy uwagę na jeden szczegół.\n\n[Opisz swój sposób pracy i pokaż konkretny przykład — bez niepotwierdzonych obietnic.]\n\nNa co Ty zwracasz uwagę przy wyborze?`,
    `${offer}\n\nDla kogo? ${audience}.\n\n[Dodaj zakres oferty, cenę lub sposób jej ustalenia i dostępność.]\n\nNapisz do nas, jeśli chcesz poznać szczegóły.`,
    `Pomóż nam wybrać kolejny temat.\n\nCo najbardziej interesuje Cię w tym, co robi ${name}?\n\n1. [temat A]\n2. [temat B]\n3. [temat C]\n\nWpisz numer w komentarzu.`,
  ][Math.max(0, Math.min(6, day))];
}

const xml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
export function graphicSvg(name: string, headline: string, color: string, portrait: boolean) {
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : '#34e0f7';
  const height = portrait ? 1350 : 1080;
  // Hard-wrap long tokens too, so a pasted URL cannot escape the canvas.
  const chunks = headline.slice(0, 100).match(/.{1,22}(?:\s|$)|.{1,22}/g) || ['Twój następny krok'];
  const lines = chunks.slice(0, 5).map((s, i) => `<tspan x="90" dy="${i ? 92 : 0}">${xml(s.trim())}</tspan>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}"><rect width="1080" height="${height}" fill="#090b19"/><circle cx="980" cy="180" r="300" fill="${safeColor}" opacity=".12"/><circle cx="980" cy="180" r="210" fill="none" stroke="${safeColor}" stroke-width="2"/><circle cx="100" cy="${height - 90}" r="260" fill="none" stroke="${safeColor}" opacity=".3"/><rect x="90" y="120" width="70" height="8" rx="4" fill="${safeColor}"/><text x="90" y="195" fill="${safeColor}" font-family="Arial,sans-serif" font-size="32" letter-spacing="3">${xml(name.slice(0, 35))}</text><text x="90" y="${portrait ? 460 : 370}" fill="white" font-family="Arial,sans-serif" font-size="76" font-weight="700">${lines}</text><path d="M90 ${height - 175} H990" stroke="${safeColor}" opacity=".4"/><text x="90" y="${height - 105}" fill="#cbd5e1" font-family="Arial,sans-serif" font-size="27">POZNAJ NAS BLIŻEJ</text></svg>`;
}

export function saveDownload(body: Blob, filename: string) {
  const url = URL.createObjectURL(body);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadGraphic(svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Nie udało się przygotować grafiki.')); image.src = url; });
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Ta przeglądarka nie obsługuje eksportu PNG.');
    ctx.drawImage(image, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Eksport nie powiódł się.')), 'image/png'));
    saveDownload(blob, 'sociai-pierwsza-grafika.png');
  } finally { URL.revokeObjectURL(url); }
}
