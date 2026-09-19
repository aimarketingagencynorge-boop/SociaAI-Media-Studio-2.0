// Bound inline assets below Firestore's document size limit, including metadata.
export async function prepareBrandImage(file: File, logo = false): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Wybierz obraz PNG, JPG lub WebP.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Maksymalny rozmiar obrazu to 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Nie udało się przygotować obrazu.');
    let edge = logo ? 800 : 1600;
    for (let attempt = 0; attempt < 8; attempt++) {
      const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL(logo ? 'image/png' : 'image/jpeg', 0.82);
      if (data.length <= (logo ? 200_000 : 700_000)) return data;
      edge = Math.floor(edge * 0.75);
    }
    throw new Error('Obraz jest zbyt złożony. Wybierz mniejszy plik.');
  } finally { URL.revokeObjectURL(url); }
}
