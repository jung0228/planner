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
    const { reviews } = await req.json();
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json(
        { error: "reviews 배열이 필요합니다." },
        { status: 400 }
      );
    }

    const reviewsText = reviews
      .map((r: string, i: number) => `[리뷰 ${i + 1}]\n${String(r).trim()}`)
      .join("\n\n---\n\n");

    const systemPrompt = `너는 학술 논문 리뷰를 구조적으로 분석하는 전문가야.
사용자가 **받은 리뷰들**을 주면, 다음 형식으로 **구조적 분석**을 작성해줘:

1. **요약 (Summary)**: 전체 리뷰를 2-3문장으로 요약
2. **공통 지적 사항**: 여러 리뷰어가 공통으로 지적한 점
3. **리뷰별 핵심 포인트**: 리뷰어별로 요약 (리뷰1: ..., 리뷰2: ...)
4. **추천 대응 전략**: rebuttal 작성 시 우선 다뤄야 할 것들
5. **점수 추정** (있다면): 각 리뷰에서 읽을 수 있는 sentiment (긍정/중립/부정)

- 한국어로 작성해줘.
- 마크다운 형식 사용 (##, -, 등)
- 입력 리뷰가 영어면 그 핵심 내용을 한국어로 요약해줘.`;

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
          {
            role: "user",
            content: `아래 받은 리뷰들을 구조적으로 분석해줘.\n\n---\n\n${reviewsText}`,
          },
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
    const analysis = data.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ analysis });
  } catch (e) {
    console.error("review-analyze error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }
}
