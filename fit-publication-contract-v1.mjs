// Fixed projection of the immutable V1 member-facing content. Worker-safe.
export function fitOriginalContent(data,title) {
  return {title,canonical_movement:data.canonical_movement,movement_group:data.movement_group,dosage:data.dosage,instructions:data.instructions,form_cues:data.form_cues,safety_cues:data.safety_cues,equipment:data.equipment,locations:data.locations,limitations:data.limitations,regressions:data.regressions,progressions:data.progressions,visual:data.visual};
}
