PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS players(id TEXT PRIMARY KEY,name TEXT NOT NULL,divisions TEXT NOT NULL,disciplines TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,discipline TEXT NOT NULL,label TEXT NOT NULL,starts TEXT NOT NULL,fee INTEGER NOT NULL CHECK(fee>=0),capacity INTEGER CHECK(capacity BETWEEN 1 AND 24),open INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS eligibility(player_id TEXT NOT NULL REFERENCES players(id),discipline TEXT NOT NULL,allowance INTEGER NOT NULL CHECK(allowance>0),PRIMARY KEY(player_id,discipline));
CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,token_hash TEXT NOT NULL,payload_hash TEXT NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS entries(id TEXT PRIMARY KEY,request_id TEXT NOT NULL REFERENCES requests(id),player_id TEXT NOT NULL REFERENCES players(id),event_id TEXT NOT NULL REFERENCES events(id),contact_name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','waitlisted','cancelled')),paid INTEGER NOT NULL DEFAULT 0 CHECK(paid IN (0,1)),checked_in INTEGER NOT NULL DEFAULT 0 CHECK(checked_in IN (0,1)),created TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS active_player_event ON entries(player_id,event_id) WHERE status!='cancelled';
CREATE TRIGGER IF NOT EXISTS entry_allowance_insert BEFORE INSERT ON entries WHEN NEW.status!='cancelled' BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM entries n JOIN events e ON e.id=n.event_id WHERE n.player_id=NEW.player_id AND n.status!='cancelled' AND e.discipline=(SELECT discipline FROM events WHERE id=NEW.event_id)) >= COALESCE((SELECT allowance FROM eligibility WHERE player_id=NEW.player_id AND discipline=(SELECT discipline FROM events WHERE id=NEW.event_id)),0) THEN RAISE(ABORT,'qualifying_entry_limit') END;
END;
CREATE TRIGGER IF NOT EXISTS entry_allowance_update BEFORE UPDATE OF status,player_id,event_id ON entries WHEN NEW.status!='cancelled' BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM entries n JOIN events e ON e.id=n.event_id WHERE n.id!=OLD.id AND n.player_id=NEW.player_id AND n.status!='cancelled' AND e.discipline=(SELECT discipline FROM events WHERE id=NEW.event_id)) >= COALESCE((SELECT allowance FROM eligibility WHERE player_id=NEW.player_id AND discipline=(SELECT discipline FROM events WHERE id=NEW.event_id)),0) THEN RAISE(ABORT,'qualifying_entry_limit') END;
END;
CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,actor TEXT NOT NULL,entry_id TEXT NOT NULL,action TEXT NOT NULL,created TEXT NOT NULL);
