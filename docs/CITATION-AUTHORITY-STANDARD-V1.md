# SHIFT citation authority standard v1

## Purpose

Make every public health page easy for a reader, search engine or answer engine to verify. This standard covers evidence SHIFT cites. It does not pretend that an outbound source link is an independent endorsement of SHIFT.

## Required on public health pages

1. A truthful named writer/researcher byline linked to a real profile.
2. A visible evidence-checked or materially-updated date.
3. A plain boundary between general information and individual clinical decisions.
4. A visible `Sources & evidence` section containing sources that directly support material claims.
5. At least one appropriate primary or authoritative source. Prefer MHRA/product information for medicine status and safety, NICE for UK recommendations, NHS for public pathways and urgent-help instructions, and primary trials or systematic reviews for quantified outcomes.
6. `Article`, `NewsArticle`, `BlogPosting` or `MedicalWebPage` JSON-LD with truthful `author`, `publisher`, `datePublished` and `dateModified` values where those values are known.

## Source hierarchy

| Tier | Use | Examples |
|---|---|---|
| 1 | Regulatory status, warnings, licensed directions and UK policy | MHRA/GOV.UK, current SmPC or PIL, NICE, NHS/NHS England |
| 2 | Quantified benefits, harms and uncertainty | Peer-reviewed primary trials, systematic reviews, Cochrane, major medical journals |
| 3 | Useful professional interpretation | Relevant UK professional or specialist bodies with transparent authorship |
| 4 | Context only, never the sole support for a material medical claim | Reputable journalism and commercial provider content |

Commercial competitors, affiliate pages, unsourced summaries, social posts and AI output are not evidence sources.

## Claim rules

- Put the source close enough to the claim that its support is unambiguous; a source list does not rescue unrelated copy.
- Report the population, duration and uncertainty with numerical trial outcomes. Never turn a study average into a personal forecast.
- Medicine-specific dose, missed-dose, contraindication and safety copy must be bound to the exact medicine source, not borrowed from another GLP-1 medicine.
- A new publication date must represent publication. A changed review date must represent an actual evidence check or material update.
- Matt's lived experience is valid first-hand experience when labelled as such. It is not clinical expertise and must not support general medical claims.
- Do not claim clinical review unless a suitably qualified named reviewer actually reviewed the exact copy.

## Independent authority

Backlinks, unlinked brand mentions, press references and citations of original SHIFT work are measured separately. They must be earned and must never be bought, swapped at scale or fabricated. The preferred route is original anonymised insight, useful tools, transparent methodology, founder commentary and genuine partner recognition.

## Release gate

Run `node citation-authority-audit.mjs --base=https://shiftsometimber.co.uk --out=citation-authority-live-report.json` against production. A flagged page needs human resolution: correct the page, record a justified exception, or remove it from the health index until it meets the standard.

