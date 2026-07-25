/**
 * Shared image upload helper with base64 fallback.
 *
 * Strategy:
 *  1. POST the file to `/api/upload` as multipart/form-data.
 *  2. If the API returns `{ url }`, use that URL (preferred — file persisted on disk).
 *  3. If the API fails for any reason (network, 4xx/5xx, parse error), fall back to a
 *     base64 data URL via FileReader so the user's image is never silently dropped.
 *
 * Returns the resulting URL string (either `/uploads/<uuid>.<ext>` or `data:image/...`).
 * Throws only if FileReader itself fails (extremely rare — indicates a corrupt file).
 */
export async function uploadImage(file: File): Promise<string> {
  // Step 1: try the upload API
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.url === 'string' && data.url.length > 0) {
        return data.url;
      }
    } else {
      console.warn(
        `uploadImage: /api/upload responded with ${res.status}, falling back to base64`
      );
    }
  } catch (e) {
    console.error('uploadImage: /api/upload failed, falling back to base64:', e);
  }

  // Step 2: fallback to base64 data URL via FileReader
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not produce a string result'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}
