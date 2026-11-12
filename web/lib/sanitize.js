const HTML_TAG_PATTERN = /<[^>]*>?/g;
const ANGLE_BRACKET_PATTERN = /[<>]/g;
const WHITESPACE_RUN_PATTERN = /\s+/g;

export function stripHtml(value) {
  return String(value)
    .replace(HTML_TAG_PATTERN, "")
    .replace(ANGLE_BRACKET_PATTERN, "")
    .replace(WHITESPACE_RUN_PATTERN, " ")
    .trim();
}
