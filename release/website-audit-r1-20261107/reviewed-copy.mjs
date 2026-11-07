// Review candidates. Apply to the owning templates only after this revision is approved.
const comparePath = '/shift-health/blood-tests';
const panels = ['baseline', 'advanced', 'complete'];
const serviceSentence = 'You can use My Timber free alongside your own clinic and keep using it after treatment ends.';

const homeBrowseMarkup = '<p class="sst-free-browse"><a href="/recipes">Browse recipes</a><a href="/exercises">Browse exercises</a></p>';
const homeBrowseStyle = `<style id="sst-free-browse-css">
#sst-home-route .sst-free-browse { display:flex; justify-content:center; flex-wrap:wrap; gap:0 1rem; margin:0 0 .75rem; }
#sst-home-route .sst-free-browse a { display:inline-flex; align-items:center; min-height:44px; color:inherit; text-decoration:underline; text-underline-offset:.2em; font:700 .9rem/1.4 system-ui,sans-serif; }
#sst-home-route .sst-free-browse a:focus-visible { outline:2px solid currentColor; outline-offset:3px; }
</style>`;

function replaceExpected(text, oldText, newText, count = 1) {
  const oldCount = text.split(oldText).length - 1;
  const newCount = text.split(newText).length - 1;
  if (newCount === count && oldCount === (newText.includes(oldText) ? count : 0)) return text;
  if (oldCount !== count || newCount !== 0) throw new Error('Review baseline changed: ' + oldText);
  return text.replaceAll(oldText, newText);
}

function applyPublicCandidate(path, input) {
  if (path === '/') {
    const note = '<p class="sst-free-promise">';
    const html = replaceExpected(input, note, homeBrowseMarkup + note);
    return replaceExpected(html, '</head>', homeBrowseStyle + '</head>');
  }
  if (path === comparePath) {
    let html = input;
    for (const panel of panels) {
      const href = 'href="' + comparePath + '/' + panel + '/your-test">';
      html = replaceExpected(html, href + 'Choose this test', href + 'Preview this test');
    }
    return replaceExpected(html, 'Coming soon. Choosing does not place an order.', 'Ordering is closed. This is a preview.', panels.length);
  }
  if (path === '/llms.txt') {
    const canonical = replaceExpected(input, '[Explore knowledge](https://shiftsometimber.co.uk/explore-knowledge)', '[Knowledge](https://shiftsometimber.co.uk/knowledge)');
    const section = '## My Timber support and continuity\n';
    return replaceExpected(canonical, section, section + serviceSentence + '\n\n');
  }
  throw new Error('Route is outside this review: ' + path);
}

export function applyWebsiteAuditCopy(path, source) {
  if (path !== '/' && path !== comparePath && path !== '/llms.txt') return source;
  try {
    return applyPublicCandidate(path, source);
  } catch {
    // A changed template should continue to serve without a partial edit.
    return source;
  }
}
