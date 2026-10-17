import sanitize from 'sanitize-html';

// Mirrors what the storefront's description editor produces (frontend/src/lib/html.ts).
const OPTIONS: sanitize.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'hr'],
  // target/rel are always overwritten by transformTags below, never taken from input.
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitize.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer nofollow' }),
  },
};

/** Same test as the frontend's isHtml(): anything else is plain text and rendered escaped. */
const TAG = /<\/?[a-z][\s\S]*?>/i;

/**
 * Rich-text fields (product description) are stored as HTML: strip everything
 * outside the editor's whitelist before it reaches the DB. Plain text (legacy
 * descriptions) is kept as-is since clients escape it; empty markup becomes null.
 */
export function sanitizeRichText(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (!TAG.test(value)) return value.trim() || null;
  const clean = sanitize(value, OPTIONS).trim();
  return clean.replace(/<[^>]*>/g, '').trim() ? clean : null;
}
