-- Apply only AFTER acceptance-base.sql, timber-shed-forums.sql and timber-shed-private.sql in the fresh synthetic DB.
INSERT INTO timber_shed_adult_access VALUES(1,'verified-adult-account','fictional-acceptance-1',3,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now','+1 day'),NULL);
INSERT INTO timber_shed_adult_access VALUES(2,'verified-adult-account','fictional-acceptance-2',3,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now','+1 day'),NULL);
INSERT INTO timber_shed_adult_access VALUES(3,'verified-adult-account','fictional-acceptance-3',3,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now','+1 day'),NULL);
INSERT INTO timber_shed_adult_access VALUES(6,'verified-adult-account','fictional-acceptance-6',3,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now','+1 day'),NULL);
INSERT INTO timber_shed_forum_moderators VALUES(3,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
INSERT INTO timber_shed_forum_moderators VALUES(6,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
-- Participation consent and maintenance heartbeat are deliberately not fabricated: use the protected session UI and run the actual maintenance endpoint.
