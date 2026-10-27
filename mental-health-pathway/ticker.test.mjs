import test from 'node:test';
import assert from 'node:assert/strict';
import {stripMentalHealthTicker} from './ticker.mjs';

test('removes the inherited ticker, its dedicated stylesheet and client only', () => {
  const head = '<!doctype html><html><head><style data-final-pages-style>header{display:block}</style>';
  const tail = '</head><body><header>SHIFT</header>';
  const content = '<main id="main-content"><h1>What do you need right now?</h1><aside class="ft-urgent"><a href="/mental-health/urgent-mental-health-help">Find urgent support</a></aside><p data-support-followthrough><a href="/member/support">My saved step</a></p></main><script src="/mens-mental-health/pathway.js" defer></script></body></html>';
  const ticker = '<section id="shift-public-news" data-shift-news-ticker="public-news-20260917-r4"><a href="/shift-newsroom">SHIFT News:</a><div>Stories</div></section>';
  const style = '<style data-shift-public-news>#shift-public-news{display:grid!important}</style>';
  const client = '<script defer src="/assets/public-news-ticker-v1.js?v=public-news-20260917-r4"></script>';
  assert.equal(stripMentalHealthTicker(head + style + tail + ticker + content + client), head + tail + content);
});

test('handles legacy markup and is idempotent without touching ordinary newsroom links', () => {
  const page = "<section class='medicine-ticker-v138'><span>News</span></section><a href='/shift-newsroom'>Newsroom</a><script src='/assets/newsroom-ticker-v2.js'></script>";
  const expected = "<a href='/shift-newsroom'>Newsroom</a>";
  assert.equal(stripMentalHealthTicker(page), expected);
  assert.equal(stripMentalHealthTicker(expected), expected);
});

test('leaves support content, private notes and unrelated scripts exactly intact', () => {
  const page = '<main><label>My notes<textarea>Something I want to discuss</textarea></label><p>Free. Always.</p></main><style data-support>main{color:#050505}</style><script src="/member/support/client.js"></script>';
  assert.equal(stripMentalHealthTicker(page), page);
});
