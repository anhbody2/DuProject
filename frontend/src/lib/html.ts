import DOMPurify from 'dompurify';

// Everything the description editor can produce; anything else is stripped on render.
const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'hr'];
const ALLOWED_ATTR = ['href'];

const TAG = /<\/?[a-z][\s\S]*?>/i;

/** Older descriptions are plain text (line breaks meaningful); newer ones are editor HTML. */
export const isHtml = (s: string) => TAG.test(s);

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Plain text -> paragraphs, so legacy descriptions open in the editor with their line breaks. */
export const textToHtml = (s: string) =>
  s.split(/\n{2,}/).map((para) => `<p>${escape(para).replace(/\n/g, '<br>')}</p>`).join('');

/** Safe HTML for dangerouslySetInnerHTML: whitelisted tags only, links open in a new tab. */
export function sanitizeHtml(html: string): string {
  const clean = DOMPurify.sanitize(isHtml(html) ? html : textToHtml(html), { ALLOWED_TAGS, ALLOWED_ATTR });
  return clean.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer nofollow" ');
}
