import {fitRuntime as baseFitRuntime} from './fit-runtime.mjs';

const approvedArt = `
  function art(item = {}) {
    const canonical = String(
      item.canonical_movement || item.visual?.canonical_movement || "",
    )
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(canonical)) return "";
    const alt =
      item.visual?.alt_text ||
      \`\${item.name || "Exercise"}: start, movement and finish positions.\`;
    return \`<img class="sf-approved-exercise-image" src="/fit-v3-images/\${esc(canonical)}.png" alt="\${esc(alt)}" loading="lazy" decoding="async" width="1280" height="720">\`;
  }
`.trimEnd();

const artBlock = /  function art\(item = \{\}\) \{[\s\S]*?\n  \}\n  function brief/;
if (!artBlock.test(baseFitRuntime)) {
  throw new Error('Fit approved-image integration could not find the legacy art renderer.');
}

export const fitRuntime = baseFitRuntime.replace(
  artBlock,
  `${approvedArt}\n  function brief`,
);
