// General exercise education, not a claim about why the planner selected a record.
// Reviewed against NHS activity/strength guidance and BHF weight-management guidance.
export const purposeSources={
 activity:'https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/',
 strength:'https://www.nhs.uk/live-well/exercise/strength-exercises/',
 walking:'https://www.nhs.uk/live-well/exercise/walking-for-health/',
 bodyFat:'https://www.bhf.org.uk/informationsupport/heart-matters-magazine/activity/best-exercise-to-lose-belly-fat'
};
const weight={
 strength:'Strength work helps build and maintain muscle as part of a balanced activity routine. Weight loss depends on your overall activity and energy intake over time.',
 cardio:'Regular activity uses energy and supports overall weight management alongside eating habits. The effect depends on how often, how long and how hard you move.',
 mobility:'This is mobility work. Its role is to practise comfortable movement, rather than provide a large calorie burn.',
 balance:'This practises balance and control. It supports movement confidence; it is not intended as a calorie-burning workout.',
 core:'This trains your abdominal muscles. It does not selectively remove belly fat; fat loss happens across the body, influenced by overall activity and energy intake.'
};
const entry=(focus,benefit,kind='strength')=>({focus,benefit,weightLoss:weight[kind],sources:[purposeSources[kind==='cardio'?'activity':kind==='strength'?'strength':'activity'],purposeSources.bodyFat]});
export const exercisePurpose={
 'sit-to-stand':entry('Leg strength for everyday movement','Practises standing up and sitting down under control, using your thighs and glutes.'),
 squat:entry('Leg and hip strength','Trains your thighs and glutes through a squat pattern used in everyday lowering and lifting.'),
 'reverse-lunge':entry('Single-leg strength and control','Works each leg through a stepping pattern, with your front thigh and glute doing much of the work.'),
 'hip-hinge':entry('Hip movement and strength','Practises moving through your hips while controlling your trunk; loaded versions challenge your glutes and hamstrings.'),
 'glute-bridge':entry('Glute and hip strength','Trains your glutes as you lift and lower your hips under control.'),
 'calf-raise':entry('Calf strength','Works the lower-leg muscles used when pushing off the ground during walking and climbing steps.'),
 'push-up':entry('Upper-body pushing strength','Works your chest, shoulders and triceps while your trunk holds position.'),
 'chest-press':entry('Upper-body pushing strength','Trains the chest, shoulders and triceps through a controlled pushing movement.'),
 row:entry('Upper-body pulling strength','Works the upper back and arms through a pulling movement.'),
 'overhead-press':entry('Shoulder and arm strength','Trains a controlled overhead pushing movement using your shoulders and triceps.'),
 'lat-pulldown':entry('Back and pulling strength','Trains your back and arms through a downward pulling movement.'),
 'triceps-extension':entry('Upper-arm strength','Works the triceps, which straighten your elbows during pushing movements.'),
 plank:entry('Trunk strength and endurance','Challenges your trunk muscles to hold your body steady.','core'),
 'dead-bug':entry('Trunk control and coordination','Practises keeping your trunk controlled as your arms and legs move.','core'),
 'loaded-carry':entry('Grip and whole-body control','Challenges your grip and trunk while you carry a load and walk.'),
 'step-up':entry('Leg strength for steps','Trains your thighs and glutes through the action of stepping up onto a raised surface.'),
 walk:{...entry('Everyday activity and stamina','Adds movement to your day. Regular brisk walking can improve fitness; an easy walking break is a gentler activity option.','cardio'),sources:[purposeSources.walking,purposeSources.bodyFat]},
 'stationary-bike':entry('Aerobic fitness and stamina','Provides repeatable aerobic activity using a stationary bike; the training demand changes with duration and resistance.','cardio'),
 'rowing-erg':entry('Aerobic fitness and whole-body effort','Combines repeated leg drive and pulling movements; sustained rowing can challenge your heart and lungs.','cardio'),
 'low-impact-march':entry('Gentle activity and coordination','Adds rhythmic movement in one place and can raise your breathing as the pace increases.','cardio'),
 'shadow-boxing':entry('Activity and coordination','Combines arm movements and footwork; sustained combinations can challenge your stamina.','cardio'),
 'chair-balance-reach':entry('Balance and movement control','Practises shifting your weight and reaching, with a chair available for support.','balance'),
 'hamstring-mobility':entry('Comfortable movement at the back of the thigh','Practises a gentle hamstring stretch within your comfortable range.','mobility'),
 'hip-flexor-mobility':entry('Comfortable hip movement','Practises a gentle stretch at the front of the hip.','mobility'),
 'thoracic-rotation':entry('Upper-back movement','Practises turning through the upper back with controlled movement.','mobility'),
 'wall-slides':entry('Shoulder movement and control','Practises raising and lowering your arms through a comfortable range.','mobility'),
 'short-range-curl-up':entry('Abdominal strength and endurance','Works your abdominal muscles through a small, controlled curl of the trunk.','core'),
 'cross-body-crunch':entry('Abdominal strength and control','Challenges your abdominal muscles through a controlled curling and turning movement.','core'),
 'reverse-crunch':entry('Abdominal strength and control','Challenges your abdominal muscles as you control the movement of your pelvis.','core')
};
