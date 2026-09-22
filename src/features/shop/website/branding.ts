import type { WebsiteSettings } from './types';

// Defaults used when an organisation has not configured storefront branding.
// The logo lives in this app public folder (mirrors damorex public/sample_images/rx.ico),
// so the path is stable in dev and in production builds.
export const DEFAULT_WEBSITE_NAME = 'Damorex';
export const DEFAULT_WEBSITE_LOGO_URL = '/sample_images/rx.ico';

export const DEFAULT_CONTACT_PHONE = '+2348022224166';
export const DEFAULT_CONTACT_EMAIL = 'info@damorex.com';
export const DEFAULT_CONTACT_WHATSAPP = '+2348022224166';
export const DEFAULT_CONTACT_ADDRESS = 'Lagos, Nigeria';

export function resolveBranding(settings?: WebsiteSettings) {
  return {
    websiteName: settings?.websiteName?.trim() || DEFAULT_WEBSITE_NAME,
    logoUrl: settings?.logoUrl?.trim() || DEFAULT_WEBSITE_LOGO_URL,
  };
}

export function resolveContact(settings?: WebsiteSettings) {
  return {
    contactPhone: settings?.contactPhone?.trim() || DEFAULT_CONTACT_PHONE,
    contactEmail: settings?.contactEmail?.trim() || DEFAULT_CONTACT_EMAIL,
    contactWhatsApp: settings?.contactWhatsApp?.trim() || DEFAULT_CONTACT_WHATSAPP,
    contactAddress: settings?.contactAddress?.trim() || DEFAULT_CONTACT_ADDRESS,
  };
}
