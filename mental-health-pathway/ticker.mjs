// Good to Talk is excluded from the public news ticker. Apply this before
// the existing follow-through marker check, including already-enhanced pages.
export function stripMentalHealthTicker(html) {
  return html
    .replace(/<section\b(?=[^>]*(?:\bid=["']shift-public-news["']|\bmedicine-ticker-v138\b|\bdata-shift-ai-full-wire\b))[^>]*>[\s\S]*?<\/section>/gi, '')
    .replace(/<script\b[^>]*\bsrc=["'][^"']*\/(?:public-news-ticker-v1|newsroom-ticker-v2)\.js(?:\?[^"']*)?["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*\bdata-shift-public-news(?:\s|=|>)[\s\S]*?<\/style>/gi, '');
}
