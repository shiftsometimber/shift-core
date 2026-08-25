-- Synthetic, clearly-labelled staging conversations. Never run against production.
DELETE FROM tap_room_reports; DELETE FROM tap_room_events; DELETE FROM tap_room_posts; DELETE FROM tap_room_blocks; DELETE FROM tap_room_hosts;
INSERT OR IGNORE INTO users(email,first_name,last_name) VALUES
('taproom-linda@example.test','Linda','O''Brien'),('taproom-ava@example.test','Ava','O''Brien'),('taproom-isla@example.test','Isla','O''Brien'),('taproom-finley@example.test','Finley','O''Brien');
INSERT OR IGNORE INTO user_auth(user_id,password_hash,email_verified,email_verified_at) SELECT id,'preview-host-no-login',1,CURRENT_TIMESTAMP FROM users WHERE email LIKE 'taproom-%@example.test';
INSERT OR IGNORE INTO member_status(user_id,lifecycle_stage,membership_status,source,last_activity_at) SELECT id,'registered','none','tap_room_staging',CURRENT_TIMESTAMP FROM users WHERE email LIKE 'taproom-%@example.test';
INSERT OR IGNORE INTO member_state(user_id) SELECT id FROM users WHERE email LIKE 'taproom-%@example.test';
INSERT OR REPLACE INTO tap_room_profiles(user_id,display_name,bio,joined_at,treatment_rules_ack_at,privacy_prompt_seen_at,status,updated_at)
SELECT id,first_name||' O''Brien','Consented Phase 1 host · staging demonstration',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'active',CURRENT_TIMESTAMP FROM users WHERE email LIKE 'taproom-%@example.test';
INSERT OR IGNORE INTO tap_room_hosts(user_id,invited_by,status,invited_at,accepted_at) SELECT id,'Matt O''Brien','accepted',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM users WHERE email LIKE 'taproom-%@example.test';

-- Three genuine founding prompts in each locked room, posted from Matt's staging account.
INSERT INTO tap_room_posts(room_slug,user_id,body,status,is_founder_prompt,created_at,updated_at) VALUES
('sport-banter',(SELECT id FROM users WHERE email='taproom-review@example.test'),'What result ruined your weekend before it had properly started? Mine usually manages it by half three.','visible',1,datetime('now','-18 minutes'),CURRENT_TIMESTAMP),
('sport-banter',(SELECT id FROM users WHERE email='taproom-review@example.test'),'Best sporting day you have actually been there for — not one you watched from the sofa?','visible',1,datetime('now','-17 minutes'),CURRENT_TIMESTAMP),
('sport-banter',(SELECT id FROM users WHERE email='taproom-review@example.test'),'Which player did you swear was useless, only for him to make you look a complete mug?','visible',1,datetime('now','-16 minutes'),CURRENT_TIMESTAMP),
('treatment-experiences',(SELECT id FROM users WHERE email='taproom-review@example.test'),'What surprised you most when you actually started treatment — good, bad or just plain odd? Your own experience only; no dose instructions.','visible',1,datetime('now','-15 minutes'),CURRENT_TIMESTAMP),
('treatment-experiences',(SELECT id FROM users WHERE email='taproom-review@example.test'),'What practical thing made treatment days easier for you? Not medical advice — just the ordinary stuff that helped your day.','visible',1,datetime('now','-14 minutes'),CURRENT_TIMESTAMP),
('treatment-experiences',(SELECT id FROM users WHERE email='taproom-review@example.test'),'What do you wish somebody had explained in normal English before you began?','visible',1,datetime('now','-13 minutes'),CURRENT_TIMESTAMP),
('food-everyday',(SELECT id FROM users WHERE email='taproom-review@example.test'),'What meal keeps the whole house happy without turning Tuesday night into a military operation?','visible',1,datetime('now','-12 minutes'),CURRENT_TIMESTAMP),
('food-everyday',(SELECT id FROM users WHERE email='taproom-review@example.test'),'What is your emergency tea when the day has gone completely sideways?','visible',1,datetime('now','-11 minutes'),CURRENT_TIMESTAMP),
('food-everyday',(SELECT id FROM users WHERE email='taproom-review@example.test'),'Which supposedly healthy food can you simply not pretend to enjoy?','visible',1,datetime('now','-10 minutes'),CURRENT_TIMESTAMP),
('confidence-setbacks',(SELECT id FROM users WHERE email='taproom-review@example.test'),'What is one ordinary thing you can do now that felt harder six months ago?','visible',1,datetime('now','-9 minutes'),CURRENT_TIMESTAMP),
('confidence-setbacks',(SELECT id FROM users WHERE email='taproom-review@example.test'),'Anyone else had a week where the plan disappeared by Monday lunchtime? What helped you get back into it without punishing yourself?','visible',1,datetime('now','-8 minutes'),CURRENT_TIMESTAMP),
('confidence-setbacks',(SELECT id FROM users WHERE email='taproom-review@example.test'),'What changed first for you: the scales, your clothes, your energy, or how you felt walking into a room?','visible',1,datetime('now','-7 minutes'),CURRENT_TIMESTAMP),
('travel-breaks',(SELECT id FROM users WHERE email='taproom-review@example.test'),'Best away day or sports trip you have done — and what would you do differently next time?','visible',1,datetime('now','-6 minutes'),CURRENT_TIMESTAMP),
('travel-breaks',(SELECT id FROM users WHERE email='taproom-review@example.test'),'Where have you taken the family that was genuinely worth the money?','visible',1,datetime('now','-5 minutes'),CURRENT_TIMESTAMP),
('travel-breaks',(SELECT id FROM users WHERE email='taproom-review@example.test'),'Has anyone done a solo trip without it feeling like a corporate mindfulness retreat? Where worked?','visible',1,datetime('now','-4 minutes'),CURRENT_TIMESTAMP),
('general-life',(SELECT id FROM users WHERE email='taproom-review@example.test'),'What is taking up far too much space in your head this week?','visible',1,datetime('now','-3 minutes'),CURRENT_TIMESTAMP),
('general-life',(SELECT id FROM users WHERE email='taproom-review@example.test'),'What did nobody warn you would become expensive when you became a proper adult?','visible',1,datetime('now','-2 minutes'),CURRENT_TIMESTAMP),
('general-life',(SELECT id FROM users WHERE email='taproom-review@example.test'),'What is one thing you have finally sorted that you had been putting off for months?','visible',1,datetime('now','-1 minutes'),CURRENT_TIMESTAMP);

-- Clearly synthetic review examples from the consented host identities.
INSERT INTO tap_room_posts(room_slug,user_id,body,status,created_at,updated_at) VALUES
('sport-banter',(SELECT id FROM users WHERE email='taproom-finley@example.test'),'Staging example: We won 8–0 and I still spent the drive home thinking about the chance I should have buried. Football is ridiculous.','visible',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('treatment-experiences',(SELECT id FROM users WHERE email='taproom-linda@example.test'),'Staging example: The first thing that surprised me was how quickly normal portion sizes felt enormous. Smaller plates helped me personally.','visible',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('food-everyday',(SELECT id FROM users WHERE email='taproom-ava@example.test'),'Staging example: Emergency tea is wraps, whatever is in the fridge, and absolutely no complaints accepted.','visible',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('confidence-setbacks',(SELECT id FROM users WHERE email='taproom-isla@example.test'),'Staging example: A bad day used to become a bad week. Starting again at the next meal feels much less dramatic.','visible',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('travel-breaks',(SELECT id FROM users WHERE email='taproom-linda@example.test'),'Staging example: Book the early flight only if the saving is worth everybody hating you at 3am. It usually is not.','visible',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('general-life',(SELECT id FROM users WHERE email='taproom-ava@example.test'),'Staging example: Nobody warned me that choosing what everyone eats every night would become a full-time management role.','visible',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO tap_room_posts(room_slug,user_id,parent_id,body,status,created_at,updated_at)
SELECT room_slug,(SELECT id FROM users WHERE email='taproom-review@example.test'),id,'Staging reply from Matt: That is exactly the sort of honest answer this place needs. No lecture, no pretending — just what actually happened.', 'visible',datetime('now','+1 minute'),CURRENT_TIMESTAMP FROM tap_room_posts WHERE body LIKE 'Staging example:%';
