import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `너는 할 일을 퀘스트로 변환하는 AI야.
사용자가 자유롭게 적은 할 일 목록을 받으면, 각각을 RPG 퀘스트 형태로 변환해줘.

응답은 반드시 JSON 배열만 출력해. 다른 설명 없이.
형식: [{"title": "퀘스트제목", "rarity": "normal|rare|epic|legendary"}, ...]

rarity 기준:
- normal: 일상적인 일 (운동, 독서, 정리, 메일 등) - 10 XP
- rare: 조금 더 의미 있는 일 (프로젝트 진행, 학습, 회의 등) - 25 XP  
- epic: 중요한 일 (발표, 마감 작업, 시험 준비 등) - 50 XP
- legendary: 매우 중요한 일 (면접, 제출 마감, 큰 프로젝트 완료 등) - 100 XP

퀘스트 제목은 구체적이고 행동으로 끝나게 (예: "30분 운동하기", "이메일 5통 답장하기").
최대 10개까지만.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다. .env.local에 추가해주세요." },
      { status: 500 }
    );
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message 필드가 필요합니다." }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        temperature: 0.3,
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
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "응답 내용이 없습니다." }, { status: 500 });
    }

    // JSON 파싱 (```json ... ``` 감싸임 처리)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: "올바른 배열 형식이 아닙니다." }, { status: 500 });
    }

    const quests = parsed
      .filter(
        (q: unknown) =>
          q &&
          typeof q === "object" &&
          "title" in q &&
          typeof (q as { title: unknown }).title === "string"
      )
      .map((q: { title: string; rarity?: string }) => ({
        title: String(q.title).trim(),
        rarity: ["normal", "rare", "epic", "legendary"].includes(String(q.rarity || ""))
          ? q.rarity
          : "normal",
      }))
      .slice(0, 10);

    return NextResponse.json({ quests });
  } catch (e) {
    console.error("generate-quests error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }
}
