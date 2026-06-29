// WhatsApp Cloud API (Meta) sender for OTP codes. SERVER ONLY.
//
// Requires these env vars (set in Vercel → Project → Settings → Environment):
//   WHATSAPP_PHONE_NUMBER_ID   the Cloud API phone-number id (NOT the phone number)
//   WHATSAPP_ACCESS_TOKEN      a permanent system-user token with whatsapp_business_messaging
//   WHATSAPP_OTP_TEMPLATE      name of an APPROVED "authentication"-category template
//   WHATSAPP_OTP_LANG          template language code (default "en_US", e.g. "id")
//
// The template must be the authentication category with a one body variable (the
// code) and a copy-code button — Meta only allows OTP delivery via such templates.

const GRAPH = 'https://graph.facebook.com/v21.0';

export function whatsappConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_OTP_TEMPLATE
  );
}

// Normalize to the digits Cloud API expects (E.164 without the leading +).
export function normalizePhone(raw: string): string {
  return (raw ?? '').replace(/\D/g, '');
}

export function maskPhone(digits: string): string {
  if (!digits) return '';
  const last = digits.slice(-4);
  return `••••••${last}`;
}

// Send the OTP via an authentication template. Returns ok/error (never throws).
export async function sendWhatsAppOtp(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const template = process.env.WHATSAPP_OTP_TEMPLATE;
  const lang = process.env.WHATSAPP_OTP_LANG || 'en_US';
  if (!id || !token || !template) return { ok: false, error: 'whatsapp not configured' };

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: template,
      language: { code: lang },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: code }] },
        // Copy-code button required by authentication templates.
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
      ],
    },
  };

  try {
    const res = await fetch(`${GRAPH}/${id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `whatsapp ${res.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'whatsapp network error' };
  }
}
