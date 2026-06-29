// Read a 2FA QR code from an image the user picks (screenshot or photo) and
// pull out the TOTP secret. Uses the browser's BarcodeDetector — no camera
// stream, no upload: the image is decoded entirely on-device.

export function qrSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

// Decode the first QR code found in an image file. Returns its raw text, or null.
export async function decodeQrFromImage(file: File): Promise<string | null> {
  try {
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: ImageBitmapSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!BD) return null;
    const detector = new BD({ formats: ['qr_code'] });
    const bitmap = await createImageBitmap(file);
    const codes = await detector.detect(bitmap);
    (bitmap as ImageBitmap).close?.();
    return codes?.[0]?.rawValue ?? null;
  } catch {
    return null;
  }
}

// Pull a base32 TOTP secret out of an otpauth:// URI, or accept a raw secret
// string. Returns the normalised (uppercased, separators stripped) secret, or null.
export function parseOtpauthSecret(text: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();

  const m = trimmed.match(/[?&]secret=([^&]+)/i);
  if (m) {
    const secret = decodeURIComponent(m[1]).replace(/[\s=-]/g, '').toUpperCase();
    return /^[A-Z2-7]+$/.test(secret) && secret.length >= 8 ? secret : null;
  }

  // An otpauth URI with no secret param is unusable.
  if (/^otpauth:/i.test(trimmed)) return null;

  // The QR may have held just the raw base32 secret.
  const raw = trimmed.replace(/[\s=-]/g, '').toUpperCase();
  return /^[A-Z2-7]+$/.test(raw) && raw.length >= 8 ? raw : null;
}
