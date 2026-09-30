# Clinical declarations — draft for provider review

Status: prepared for review; not approved for production. No clinical or legal sign-off is implied.

## Patient wording

    <input name="consentVersion" type="hidden" value="medicine-clinical-intake-v2-draft-2026-09-30">
    <fieldset><legend>Before you begin</legend>
      <p>Accurate information helps the clinical team assess whether treatment is safe for you. SHIFT does not prescribe medicines. Your assessment is sent to the commissioned pharmacy partner.</p>
      <label><input name="assessmentForSelf" type="checkbox" required> I am completing this assessment for myself.</label>
      <label><input name="safetyAcknowledged" type="checkbox" required> I will give complete and accurate information about my health, medicines, supplements and any weight-loss treatment I use, including treatment obtained elsewhere. I understand that missing or inaccurate information could put my health at risk.</label>
      <p>Tell the clinical team about current treatment and when you last took it. Do not combine weight-loss medicines or change treatment without advice from your prescriber.</p>
      <p>Read our <a href="/terms">Terms and Conditions</a> and <a href="/privacy">Privacy Notice</a>, including how your health information is used. Clinical-provider terms must be shown before its consultation begins.</p>
    </fieldset>

## Behaviour

Both assessment entry points present required declarations before the health fields. Existing image, GP and final accuracy confirmations remain. The API rejects missing confirmations and an out-of-date wording version before sending anything to the pharmacy. Successful intake records the version, individual acknowledgements, member, intake reference and acceptance time in the existing audit log. No health answers or images are copied into this audit record.

## Release blockers

- Clinical partner approves the assessment wording, medicine combination/switching instruction and suitability of the consultation process.
- Identify the actual commissioned provider to the patient and link its current consultation terms. Replace the provider-terms placeholder sentence with the agreed terms and acceptance behaviour.
- Legal/privacy review confirms the SHIFT terms, any applicable terms of sale, health-data information and the appropriate separate acceptance requirements. Reading a privacy notice is not bundled into contractual or marketing consent.
- Coordinate web form and API release; stale open forms must refresh and re-acknowledge.
- Run browser/mobile accessibility and regression checks in one isolated preview before production approval.

The declaration does not replace independent clinical verification or prescriber review. Reference: GPhC February 2025 guidance on distance pharmacy services, sections 4.2 j–k.
