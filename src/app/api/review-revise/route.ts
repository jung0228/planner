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
    const { myResponse, feedbacks } = await req.json();
    if (!myResponse || typeof myResponse !== "string") {
      return NextResponse.json(
        { error: "myResponse 필드가 필요합니다." },
        { status: 400 }
      );
    }

    const feedbackList = Array.isArray(feedbacks)
      ? feedbacks
          .filter((f: { text?: string }) => f?.text?.trim())
          .map((f: { type?: string; text?: string }) => `${f.type ?? "피드백"}: ${f.text}`)
      : [];

    const feedbackBlock =
      feedbackList.length > 0
        ? `\n\n**추가된 피드백 (이 내용을 반영해서 수정해줘)**:\n${feedbackList.join("\n\n")}`
        : "";

    const systemPrompt = `너는 학술 논문 rebuttal/author response를 작성하는 전문가야.
사용자가 **내 답변 초안**과 **추가 피드백**(메타리뷰, AE 코멘트 등)을 주면:
1. 피드백에서 지적한 사항을 반영해서 답변을 **수정**해줘
2. 기존 답변의 좋은 부분은 유지하고, 피드백 관련 부분만 보완해줘
3. 전문적이고 건설적인 톤 유지
4. **수정된 전체 답변 텍스트만** 반환해. 설명 없이.`;

    const userContent = `아래 내 답변 초안을, 추가 피드백을 반영해서 수정해줘.

--- 내 답변 초안 ---
${myResponse}
${feedbackBlock}`;

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
    const revised = data.choices?.[0]?.message?.content?.trim() ?? myResponse;

    return NextResponse.json({ revised });
  } catch (e) {
    console.error("review-revise error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }
}
