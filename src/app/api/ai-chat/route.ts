import { NextRequest, NextResponse } from "next/server";
import { parseAiQuests } from "@/lib/ai-quest-schema";
import { parseAiEvents } from "@/lib/ai-event-schema";

function buildSystemPrompt(questContext?: {
  date: string;
  quests: { title: string; completed: boolean; isRoutine?: boolean }[];
}) {
  let contextBlock = "";
  if (questContext) {
    const done = questContext.quests?.filter((q) => q.completed) ?? [];
    const left = questContext.quests?.filter((q) => !q.completed) ?? [];
    contextBlock = `
**현재 선택된 날짜: ${questContext.date}** (퀘스트/일정 추가 시 "오늘", "이날" 등은 이 날짜로 해석해줘)
${(questContext.quests?.length ?? 0) > 0 ? `
**퀘스트 현황**:
- 전체 ${questContext.quests!.length}개 / 완료 ${done.length}개
- 미완료: ${left.map((q) => q.title + (q.isRoutine ? " (루틴)" : "")).join(", ") || "없음"}
- 완료: ${done.map((q) => q.title).join(", ") || "없음"}

이 정보로 "뭐 해야 해?", "조언해줘" 같은 요청에 구체적으로 답해줘.
` : ""}
`;
  }

  return `너는 친절한 AI 어시스턴트이자 퀘스트 도우미야.
${contextBlock}
**일반 대화**: 자유롭게 대화해줘. 질문에 답하고, 조언해주고, 수다도 떨어줘.

**찡찡대기·스트레스 받아주기**: 사용자가 힘들다, 하기 싫다, 짜증나, 귀찮아 하는 식으로 털어놓으면, 딱딱한 조언보다 **먼저 공감**해줘. "그랬구나", "진짜 힘들겠다", "그럴 수 있어" 같은 반응으로 마음을 받아주고, 그 다음에 부담 덜어주는 말이나 작은 제안을 해줘. 설교하지 말고 편한 친구처럼.

**퀘스트 조언**: "뭐 할까?", "조언해줘" 하면 현재 퀘스트 현황을 보고 구체적으로 추천해줘. 하나만 골라도 되고, 쉬운 것부터 하라고 권하기도 해.

**퀘스트 생성**: 사용자가 할 일을 말하면 (예: "오늘 운동하고 책 읽어야 해", "이거 퀘스트로 만들어줘"), create_quests 함수를 호출해서 퀘스트 목록을 넘겨줘. 
- 퀘스트 제목: 구체적이고 행동형으로 (예: "30분 운동하기", "1시간 독서하기")
- rarity: normal(일상), rare(의미있는 일), epic(중요한 일), legendary(매우 중요)
- 일반 대화 응답도 같이 해줘. 예: "알겠어! 이런 퀘스트들 만들어봤어~"

**일정 생성**: 사용자가 일정/회의/약속을 추가해달라고 하면 (예: "3월 10일에 메타리뷰 릴리즈 날짜 일정 추가해줘", "다음주 월요일 점심 약속"), create_events 함수를 호출해줘.
- title: 일정 제목
- date: YYYY-MM-DD 형식 (시작일)
- endDate: YYYY-MM-DD 형식 (선택, 기간 일정일 때만. 없으면 date와 같게)
- 오늘 날짜가 맥락에 있으면 그걸 기준으로 해석해줘. "오늘", "내일", "다음 주 월요일" 등 자연어 해석.
- 일반 대화 응답도 같이 해줘. 예: "일정 추가해뒀어!"`;
}

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_quests",
      description: "할 일 목록을 RPG 퀘스트 형태로 변환할 때 호출",
      parameters: {
        type: "object",
        properties: {
          quests: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "퀘스트 제목" },
                rarity: {
                  type: "string",
                  enum: ["normal", "rare", "epic", "legendary"],
                  description: "난이도/중요도",
                },
              },
              required: ["title", "rarity"],
            },
          },
        },
        required: ["quests"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_events",
      description: "일정/회의/약속을 캘린더에 추가할 때 호출",
      parameters: {
        type: "object",
        properties: {
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "일정 제목" },
                date: {
                  type: "string",
                  description: "YYYY-MM-DD 형식 시작일",
                },
                endDate: {
                  type: "string",
                  description: "YYYY-MM-DD 형식 종료일 (기간 일정일 때만, 없으면 date와 동일)",
                },
              },
              required: ["title", "date"],
            },
          },
        },
        required: ["events"],
      },
    },
  },
];

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const { messages, questContext } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages 배열이 필요합니다." }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(questContext);

    const fullMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: fullMessages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `OpenAI API 오류: ${response.status}`, details: err },
        { status: response.status }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    let text = message?.content?.trim() || "";
    let quests: { title: string; rarity: "normal" | "rare" | "epic" | "legendary" }[] = [];
    let events: { title: string; date: string; endDate?: string }[] = [];

    if (message?.tool_calls?.length) {
      for (const tc of message.tool_calls) {
        try {
          const args = JSON.parse(tc.function?.arguments || "{}");
          if (tc.function?.name === "create_quests") {
            quests = parseAiQuests(args.quests || []);
          } else if (tc.function?.name === "create_events") {
            events = parseAiEvents(args.events || []);
          }
        } catch {
          // ignore parse error
        }
      }
    }

    return NextResponse.json({
      message: text,
      quests: quests.length > 0 ? quests : undefined,
      events: events.length > 0 ? events : undefined,
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }
}
