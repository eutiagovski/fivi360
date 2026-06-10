const WEBSITE_PREFIX = 'https://';
const INSTAGRAM_PREFIX = 'https://instagram.com/';
const YOUTUBE_PREFIX = 'https://youtube.com/';
const LINKEDIN_PREFIX = 'https://linkedin.com/in/';
const WHATSAPP_BASE = 'https://wa.me/';
const BRAZIL_COUNTRY_CODE = '55';

/**
 * @param {string} value
 * @returns {string}
 */
function trimValue(value) {
  return (value ?? '').trim();
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isFullUrl(value) {
  return /^https?:\/\//i.test(trimValue(value));
}

/**
 * Extrai o path após um host conhecido, preservando URLs não reconhecidas.
 *
 * @param {string} value
 * @param {RegExp} hostPattern
 * @returns {string | null}
 */
function extractPathAfterHost(value, hostPattern) {
  const trimmed = trimValue(value);
  const match = trimmed.match(hostPattern);

  if (!match) {
    return null;
  }

  return match[1].replace(/\/$/, '');
}

/**
 * @param {string} value
 * @returns {string}
 */
export function parseWebsiteForDisplay(value) {
  const trimmed = trimValue(value);

  if (!trimmed) {
    return '';
  }

  if (isFullUrl(trimmed)) {
    return trimmed.replace(/^https?:\/\//i, '');
  }

  return trimmed;
}

/**
 * @param {string} input
 * @returns {string}
 */
export function normalizeWebsiteForSave(input) {
  const trimmed = trimValue(input);

  if (!trimmed) {
    return '';
  }

  if (isFullUrl(trimmed)) {
    return trimmed;
  }

  const withoutLeadingSlashes = trimmed.replace(/^\/+/, '');
  return `${WEBSITE_PREFIX}${withoutLeadingSlashes}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function parseInstagramForDisplay(value) {
  const trimmed = trimValue(value);

  if (!trimmed) {
    return '';
  }

  const path = extractPathAfterHost(
    trimmed,
    /^https?:\/\/(?:www\.)?instagram\.com\/([^?#]*)/i,
  );

  if (path !== null) {
    return path;
  }

  if (isFullUrl(trimmed)) {
    return trimmed;
  }

  return trimmed.replace(/^@+/, '');
}

/**
 * @param {string} input
 * @returns {string}
 */
export function normalizeInstagramForSave(input) {
  const trimmed = trimValue(input);

  if (!trimmed) {
    return '';
  }

  if (isFullUrl(trimmed)) {
    return trimmed;
  }

  const handle = trimmed.replace(/^@+/, '').replace(/^\/+/, '');
  return `${INSTAGRAM_PREFIX}${handle}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function parseYoutubeForDisplay(value) {
  const trimmed = trimValue(value);

  if (!trimmed) {
    return '';
  }

  const path = extractPathAfterHost(
    trimmed,
    /^https?:\/\/(?:www\.)?youtube\.com\/([^?#]*)/i,
  );

  if (path !== null) {
    return path;
  }

  const shortPath = extractPathAfterHost(
    trimmed,
    /^https?:\/\/youtu\.be\/([^?#]*)/i,
  );

  if (shortPath !== null) {
    return shortPath;
  }

  if (isFullUrl(trimmed)) {
    return trimmed;
  }

  return trimmed.replace(/^@+/, '');
}

/**
 * @param {string} input
 * @returns {string}
 */
export function normalizeYoutubeForSave(input) {
  const trimmed = trimValue(input);

  if (!trimmed) {
    return '';
  }

  if (isFullUrl(trimmed)) {
    return trimmed;
  }

  const identifier = trimmed.replace(/^@+/, '').replace(/^\/+/, '');
  return `${YOUTUBE_PREFIX}${identifier}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function parseLinkedinForDisplay(value) {
  const trimmed = trimValue(value);

  if (!trimmed) {
    return '';
  }

  const inPath = extractPathAfterHost(
    trimmed,
    /^https?:\/\/(?:[\w-]+\.)?linkedin\.com\/in\/([^?#]*)/i,
  );

  if (inPath !== null) {
    return inPath;
  }

  const companyPath = extractPathAfterHost(
    trimmed,
    /^https?:\/\/(?:[\w-]+\.)?linkedin\.com\/company\/([^?#]*)/i,
  );

  if (companyPath !== null) {
    return `company/${companyPath}`;
  }

  if (isFullUrl(trimmed)) {
    return trimmed;
  }

  return trimmed.replace(/^\/+/, '');
}

/**
 * @param {string} input
 * @returns {string}
 */
export function normalizeLinkedinForSave(input) {
  const trimmed = trimValue(input);

  if (!trimmed) {
    return '';
  }

  if (isFullUrl(trimmed)) {
    return trimmed;
  }

  const identifier = trimmed.replace(/^\/+/, '');

  if (identifier.startsWith('company/')) {
    return `https://linkedin.com/${identifier}`;
  }

  return `${LINKEDIN_PREFIX}${identifier}`;
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isBrazilWhatsappStored(value) {
  const trimmed = trimValue(value);

  if (!trimmed) {
    return true;
  }

  return /^https?:\/\/(?:api\.)?wa\.me\/55\d{10,11}$/i.test(trimmed);
}

/**
 * @param {string} value
 * @returns {string}
 */
function extractWhatsAppDigits(value) {
  const trimmed = trimValue(value);

  if (!trimmed) {
    return '';
  }

  const waMeMatch = trimmed.match(/^https?:\/\/(?:api\.)?wa\.me\/(\d+)/i);

  if (waMeMatch) {
    return waMeMatch[1];
  }

  const telMatch = trimmed.match(/^tel:\+?(\d+)/i);

  if (telMatch) {
    return telMatch[1];
  }

  return trimmed.replace(/\D/g, '');
}

/**
 * @param {string} value
 * @returns {string}
 */
export function parseWhatsappForDisplay(value) {
  const trimmed = trimValue(value);

  if (!trimmed) {
    return '';
  }

  if (isFullUrl(trimmed) && !/^https?:\/\/(?:api\.)?wa\.me\//i.test(trimmed)) {
    return trimmed;
  }

  const digits = extractWhatsAppDigits(trimmed);

  if (!digits) {
    return trimmed;
  }

  if (digits.startsWith(BRAZIL_COUNTRY_CODE) && digits.length > BRAZIL_COUNTRY_CODE.length + 8) {
    return digits.slice(BRAZIL_COUNTRY_CODE.length);
  }

  return digits;
}

/**
 * @param {string} input
 * @param {{ assumeBrazilLocal?: boolean }} [options]
 * @returns {string}
 */
export function normalizeWhatsappForSave(input, options = {}) {
  const { assumeBrazilLocal = true } = options;
  const trimmed = trimValue(input);

  if (!trimmed) {
    return '';
  }

  if (isFullUrl(trimmed) && !/^https?:\/\/(?:api\.)?wa\.me\//i.test(trimmed)) {
    return trimmed;
  }

  let digits = extractWhatsAppDigits(trimmed);

  if (!digits) {
    return trimmed;
  }

  if (
    assumeBrazilLocal &&
    !digits.startsWith(BRAZIL_COUNTRY_CODE) &&
    (digits.length === 10 || digits.length === 11)
  ) {
    digits = `${BRAZIL_COUNTRY_CODE}${digits}`;
  }

  return `${WHATSAPP_BASE}${digits}`;
}

/**
 * Garante href válido para exibição pública, inclusive perfis legados.
 *
 * @param {'websiteUrl' | 'instagramUrl' | 'youtubeUrl' | 'linkedinUrl' | 'whatsappUrl'} field
 * @param {string} value
 * @returns {string}
 */
export function resolveSocialLinkHref(field, value) {
  const trimmed = trimValue(value);

  if (!trimmed) {
    return '';
  }

  switch (field) {
    case 'websiteUrl':
      return normalizeWebsiteForSave(trimmed);
    case 'instagramUrl':
      return normalizeInstagramForSave(trimmed);
    case 'youtubeUrl':
      return normalizeYoutubeForSave(trimmed);
    case 'linkedinUrl':
      return normalizeLinkedinForSave(trimmed);
    case 'whatsappUrl':
      if (/^https?:\/\/(?:api\.)?wa\.me\//i.test(trimmed)) {
        return trimmed;
      }

      return normalizeWhatsappForSave(trimmed, {
        assumeBrazilLocal: isBrazilWhatsappStored(trimmed),
      });
    default:
      return trimmed;
  }
}

export const SOCIAL_LINK_PREFIXES = {
  websiteUrl: WEBSITE_PREFIX,
  instagramUrl: INSTAGRAM_PREFIX,
  youtubeUrl: YOUTUBE_PREFIX,
  linkedinUrl: LINKEDIN_PREFIX,
};
