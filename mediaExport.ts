import type { BrandData } from './types';

async function loadImage(url: string) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Nie udało się wczytać grafiki do eksportu.'));
    image.src = url;
  });
  return image;
}

export async function renderBrandedImage(url: string, brand: BrandData, options: { logo: boolean; signature: boolean; text: string }) {
  const image = await loadImage(url);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Eksport obrazu nie jest dostępny w tej przeglądarce.');
  ctx.drawImage(image, 0, 0);
  const padding = canvas.width * .05;
  if (options.logo && brand.logos.main) {
    const logo = await loadImage(brand.logos.main);
    const size = canvas.width * .14;
    const scale = Math.min(size / logo.width, size / logo.height);
    ctx.drawImage(logo, canvas.width - padding - logo.width * scale, padding, logo.width * scale, logo.height * scale);
  }
  if (options.text.trim()) {
    await document.fonts.ready;
    ctx.font = `bold ${Math.round(canvas.width * .038)}px Inter, sans-serif`;
    const lines: string[] = [];
    let line = '';
    for (const word of options.text.split(/\s+/)) {
      if (line && ctx.measureText(`${line} ${word}`).width > canvas.width * .75) { lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
    const height = canvas.width * .055;
    const top = (canvas.height - lines.length * height) / 2;
    ctx.fillStyle = 'rgba(0,0,0,.65)';
    ctx.fillRect(padding, top - padding / 2, canvas.width - padding * 2, lines.length * height + padding);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((text, i) => ctx.fillText(text, canvas.width / 2, top + (i + .5) * height, canvas.width * .8));
  }
  if (options.signature) {
    ctx.font = `${Math.round(canvas.width * .018)}px Inter, sans-serif`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(0,0,0,.7)';
    ctx.fillRect(0, canvas.height - padding * 1.5, canvas.width, padding * 1.5);
    ctx.fillStyle = '#fff';
    ctx.fillText([brand.name, brand.ctaLink].filter(Boolean).join(' · '), canvas.width-padding, canvas.height-padding/2, canvas.width-padding*2);
  }
  return canvas.toDataURL('image/png');
}

export async function downloadMedia(url: string, filename: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Nie udało się pobrać pliku.');
  const objectURL = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = objectURL; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(objectURL), 60000);
}
