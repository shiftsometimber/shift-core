// Opening a saved Fit plan is not a request to scroll to the session controls.
export function fitEntryNavigation(source) {
  const hooks = [
    ['  function render(result) {', '  function render(result, reveal = false) {'],
    ['    (document.getElementById("fitTodayHandoff") || output.querySelector(".sf-difficulty"))?.scrollIntoView({behavior:"auto",block:"start"});', '    if (reveal) output.querySelector(".sf-session")?.scrollIntoView({behavior:"auto",block:"start"});'],
    ['      render(result);', '      render(result, true);'],
  ];
  for (const [before, after] of hooks) {
    if (source.split(before).length !== 2) throw new Error('Fit entry navigation hook changed; reconcile the source before publishing.');
    source = source.replace(before, after);
  }
  return source;
}
