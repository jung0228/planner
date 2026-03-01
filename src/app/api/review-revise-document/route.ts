import { NextRequest, NextResponse } from "next/server";

/** 사용자 피드백으로 rebuttal 문서 수정 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const { document, feedback } = await req.json();
    if (!document || typeof document !== "string") {
      return NextResponse.json(
        { error: "document 필드가 필요합니다." },
        { status: 400 }
      );
    }
    if (!feedback || typeof feedback !== "string" || !feedback.trim()) {
      return NextResponse.json(
        { error: "feedback 필드가 필요합니다." },
        { status: 400 }
      );
    }

    const systemPrompt = `너는 Author Response(rebuttal) 문서를 수정하는 전문가야.
사용자가 **현재 문서**와 **수정 피드백**을 주면, 피드백에 맞게 문서를 수정해서 돌려줘.

원칙:
1. 피드백이 지시한 부분만 수정해. 나머지는 그대로 유지.
2. 마크다운 형식 유지 (##, **W1**, 등)
3. 전문적이고 건설적인 톤 유지
4. **수정된 전체 문서만** 반환. 설명 없이.`;

    const userContent = `현재 문서:
---
${document}
---

수정 피드백: ${feedback.trim()}

위 피드백에 따라 문서를 수정해줘. 수정된 전체 문서만 반환해.`;

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
    const revised =
      data.choices?.[0]?.message?.content?.trim() ?? document;

    return NextResponse.json({ revised });
  } catch (e) {
    console.error("review-revise-document error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }
}
