import { supabase } from "./supabase";

export type Event = {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  category: string;
  color: string;
  is_all_day: boolean;
  created_at?: string;
  updated_at?: string;
};

export type EventInput = Omit<Event, "id" | "created_at" | "updated_at">;

const STORAGE_KEY = "personal-site-events";
const SEEDED_KEY = "personal-site-events-seeded";

const SEED_EVENTS: Omit<Event, "created_at" | "updated_at">[] = [
  {
    id: "seed-author-response",
    title: "Author Response",
    description: "Meta-reviews",
    start_date: "2026-02-15T00:00:00.000Z",
    end_date: "2026-02-21T23:59:59.000Z",
    category: "work",
    color: "#3B82F6",
    is_all_day: true,
  },
  {
    id: "seed-meta-reviews-release",
    title: "Meta-reviews release date",
    description: "Cycle End March 15",
    start_date: "2026-03-10T00:00:00.000Z",
    end_date: "2026-03-10T23:59:59.000Z",
    category: "work",
    color: "#3B82F6",
    is_all_day: true,
  },
  {
    id: "seed-cycle-end",
    title: "Cycle End",
    description: "Meta-reviews cycle end",
    start_date: "2026-03-15T00:00:00.000Z",
    end_date: "2026-03-15T23:59:59.000Z",
    category: "work",
    color: "#3B82F6",
    is_all_day: true,
  },
  // 서울대학교 대학원 2026 가을학기 (후기모집) — 2025년 일정 기준 추정
  {
    id: "seed-snu-grad-notice",
    title: "🔔 서울대 대학원 후기모집 공지 확인",
    description: "2026학년도 가을학기(후기) 모집 공고 발표 예정일 (2025년에는 3월 11일 공지)\nhttps://admission.snu.ac.kr/graduate/general/notice",
    start_date: "2026-03-10T00:00:00.000Z",
    end_date: "2026-03-10T23:59:59.000Z",
    category: "study",
    color: "#8B5CF6",
    is_all_day: true,
  },
  {
    id: "seed-snu-grad-apply",
    title: "서울대 대학원 원서접수 (예상)",
    description: "2026학년도 가을학기 후기모집 원서접수 기간 (예상)\n• 2025년 실제: 4월 14일(월) 10:00 ~ 4월 18일(금) 17:00\nhttps://admission.snu.ac.kr/graduate/general/fall/guide",
    start_date: "2026-04-13T00:00:00.000Z",
    end_date: "2026-04-17T23:59:59.000Z",
    category: "study",
    color: "#8B5CF6",
    is_all_day: true,
  },
  {
    id: "seed-snu-grad-docs",
    title: "서울대 대학원 서류제출 마감 (예상)",
    description: "2026학년도 가을학기 서류제출 마감 (예상)\n• 2025년 실제: 4월 21일(월) 17:00까지",
    start_date: "2026-04-20T00:00:00.000Z",
    end_date: "2026-04-20T23:59:59.000Z",
    category: "study",
    color: "#8B5CF6",
    is_all_day: true,
  },
  {
    id: "seed-snu-grad-result",
    title: "서울대 대학원 최종합격자 발표 (예상)",
    description: "2026학년도 가을학기 최종합격자 발표 (예상)\n• 2025년 실제: 6월 12일(목) 18:00 이후",
    start_date: "2026-06-11T00:00:00.000Z",
    end_date: "2026-06-11T23:59:59.000Z",
    category: "study",
    color: "#8B5CF6",
    is_all_day: true,
  },
  {
    id: "seed-snu-grad-register",
    title: "서울대 대학원 합격자 등록 (예상)",
    description: "2026학년도 가을학기 합격자 등록 기간 (예상)\n• 2025년 실제: 8월 4일(월) ~ 8월 8일(금)",
    start_date: "2026-08-03T00:00:00.000Z",
    end_date: "2026-08-07T23:59:59.000Z",
    category: "study",
    color: "#8B5CF6",
    is_all_day: true,
  },
  // KAIST 대학원 2026 가을학기 — 2025년 일정 기준 추정
  {
    id: "seed-kaist-grad-notice",
    title: "🔔 카이스트 대학원 가을학기 공지 확인",
    description: "2026학년도 가을학기 모집 공고 발표 예정일 확인\nhttps://apply.kaist.ac.kr/gradapply",
    start_date: "2026-03-16T00:00:00.000Z",
    end_date: "2026-03-16T23:59:59.000Z",
    category: "study",
    color: "#8B5CF6",
    is_all_day: true,
  },
  {
    id: "seed-kaist-grad-apply",
    title: "카이스트 대학원 원서접수 (예상)",
    description: "2026학년도 가을학기 원서접수 기간 (예상)\n• 2025년 실제: 4월 10일(목) 10:00 ~ 4월 16일(수) 17:30\nhttps://apply.kaist.ac.kr/gradapply",
    start_date: "2026-04-09T00:00:00.000Z",
    end_date: "2026-04-15T23:59:59.000Z",
    category: "study",
    color: "#8B5CF6",
    is_all_day: true,
  },
  {
    id: "seed-kaist-grad-docs",
    title: "카이스트 대학원 서류제출 마감 (예상)",
    description: "2026학년도 가을학기 서류제출 마감 (예상)\n• 2025년 실제: 4월 16일(수) 18:00까지",
    start_date: "2026-04-15T00:00:00.000Z",
    end_date: "2026-04-15T23:59:59.000Z",
    category: "study",
    color: "#8B5CF6",
    is_all_day: true,
  },
  {
    id: "seed-kaist-grad-pass1",
    title: "카이스트 대학원 1단계 합격자 발표 (예상)",
    description: "2026학년도 가을학기 1단계 합격자 발표 (예상)\n• 2025년 실제: 5월 12일(월) 14:00 이후",
    start_date: "2026-05-11T00:00:00.000Z",
    end_date: "2026-05-11T23:59:59.000Z",
    category: "study",
    color: "#8B5CF6",
    is_all_day: true,
  },
  {
    id: "seed-kaist-grad-interview",
    title: "카이스트 대학원 면접 (예상)",
    description: "2026학년도 가을학기 면접심사 기간 (예상)\n• 2025년 실제: 5월 15일(목) ~ 5월 25일(일)",
    start_date: "2026-05-14T00:00:00.000Z",
    end_date: "2026-05-24T23:59:59.000Z",
    category: "study",
    color: "#8B5CF6",
    is_all_day: true,
  },
  {
    id: "seed-kaist-grad-result",
    title: "카이스트 대학원 최종합격자 발표 (예상)",
    description: "2026학년도 가을학기 최종합격자 발표 (예상)\n• 2025년 실제: 6월 19일(목) 14:00 이후",
    start_date: "2026-06-18T00:00:00.000Z",
    end_date: "2026-06-18T23:59:59.000Z",
    category: "study",
    color: "#8B5CF6",
    is_all_day: true,
  },
];

// 시드 이벤트 추가 (누락된 seed만 추가)
function seedInitialEvents() {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalEvents();
    const existingIds = new Set(existing.map((e) => e.id));
    const now = new Date().toISOString();
    const toAdd = SEED_EVENTS.filter((e) => !existingIds.has(e.id)).map((e) => ({
      ...e,
      created_at: now,
      updated_at: now,
    })) as Event[];
    if (toAdd.length > 0) {
      setLocalEvents([...existing, ...toAdd]);
    }
    localStorage.setItem(SEEDED_KEY, "true");
  } catch {
    // ignore
  }
}

// localStorage에서 이벤트 로드
function getLocalEvents(): Event[] {
  if (typeof window === "undefined") return [];
  try {
    seedInitialEvents();
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// localStorage에 이벤트 저장
function setLocalEvents(events: Event[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // ignore
  }
}

export async function getEvents(
  startDate: Date,
  endDate: Date
): Promise<Event[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("start_date", startDate.toISOString())
      .lte("end_date", endDate.toISOString())
      .order("start_date", { ascending: true });

    if (!error) return (data ?? []) as Event[];
  }

  const events = getLocalEvents();
  return events.filter((e) => {
    const start = new Date(e.start_date);
    const end = new Date(e.end_date);
    return start <= endDate && end >= startDate;
  });
}

export async function getAllEvents(): Promise<Event[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: true });

    if (!error) return (data ?? []) as Event[];
  }

  return getLocalEvents();
}

export async function createEvent(input: EventInput): Promise<Event> {
  const event: Event = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase.from("events").insert(event).select().single();
    if (!error) return data as Event;
  }

  const events = getLocalEvents();
  events.push(event);
  setLocalEvents(events);
  return event;
}

export async function updateEvent(id: string, input: Partial<EventInput>): Promise<Event | null> {
  const updates = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (!error) return data as Event;
  }

  const events = getLocalEvents();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  events[idx] = { ...events[idx], ...updates };
  setLocalEvents(events);
  return events[idx];
}

export async function deleteEvent(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (!error) return true;
  }

  const events = getLocalEvents().filter((e) => e.id !== id);
  setLocalEvents(events);
  return true;
}
