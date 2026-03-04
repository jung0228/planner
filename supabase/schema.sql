-- 일정 테이블
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  category TEXT DEFAULT 'default',
  color TEXT DEFAULT '#3B82F6',
  is_all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화 (나중에 인증 추가 시)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 개발용: 모든 접근 허용 (프로덕션에서는 user_id 기준으로 제한)
CREATE POLICY "Allow all" ON events FOR ALL USING (true) WITH CHECK (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);

-- 퀘스트 테이블
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  date TEXT NOT NULL,
  xp INTEGER NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON quests FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_quests_date ON quests(date);

-- 퀘스트 스탯 (싱글턴)
CREATE TABLE IF NOT EXISTS quest_stats (
  id TEXT PRIMARY KEY,
  total_xp INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  dates_with_completion TEXT[] DEFAULT '{}'
);
ALTER TABLE quest_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON quest_stats FOR ALL USING (true) WITH CHECK (true);

-- 루틴 테이블
CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL,
  "order" INTEGER NOT NULL
);
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON routines FOR ALL USING (true) WITH CHECK (true);

-- 루틴 완료 기록
CREATE TABLE IF NOT EXISTS routine_completions (
  routine_id TEXT NOT NULL,
  date TEXT NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (routine_id, date)
);
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON routine_completions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_routine_completions_date ON routine_completions(date);
