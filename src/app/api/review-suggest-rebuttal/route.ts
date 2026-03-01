import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const { label, reviewerText, userPrompt } = await req.json();
    if (!reviewerText || typeof reviewerText !== "string") {
      return NextResponse.json(
        { error: "reviewerText 필드가 필요합니다." },
        { status: 400 }
      );
    }

    const extraInstruction =
      typeof userPrompt === "string" && userPrompt.trim()
        ? `\n\n[사용자 추가 지시] ${userPrompt.trim()}`
        : "";

    const systemPrompt = `너는 학술 논문 rebuttal 작성 전문가야.
리뷰어의 **한 점 지적**에 대해 **건설적이고 전문적인 답변**을 제안해줘.

원칙:
1. 방어적이기보다는 설명·보완하는 톤
2. "We thank the reviewer..." 로 시작하거나, 바로 핵심 답변으로
3. 구체적으로 답하되, 과장하지 말고
4. 수정 예정이면 "We will add/clarify..." 등 명시
5. **한 점에 대한 답변만** 반환. 설명 없이 rebuttal 텍스트만.`;

    const userContent = `[${label || "지적"}] 리뷰어: ${reviewerText}

위 지적에 대한 rebuttal을 제안해줘. 전문적이고 건설적으로.${extraInstruction}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.4,
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
    const suggested =
      data.choices?.[0]?.message?.content?.trim() ?? "제안을 생성하지 못했습니다.";

    return NextResponse.json({ suggested });
  } catch (e) {
    console.error("review-suggest-rebuttal error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }
}
