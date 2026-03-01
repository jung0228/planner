import { NextRequest, NextResponse } from "next/server";

const TEMPLATE_PROMPTS: Record<string, string> = {
  neurips:
    "NeurIPS/ICML 스타일: Summary, Strengths, Weaknesses, Questions, Ethics 등 섹션으로 구성. 전문적이고 건설적인 어조.",
  iclr:
    "ICLR 스타일: Summary, Strengths, Limitations, Questions 등. 명확하고 객관적인 표현.",
  acl:
    "ACL/EMNLP 스타일: Summary, Strengths, Weaknesses 등. 학술 리뷰 톤 유지.",
  custom: "자유 형식. 문맥에 맞게 자연스럽고 전문적으로 다듬어줘.",
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const { text, template = "neurips" } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text 필드가 필요합니다." },
        { status: 400 }
      );
    }

    const styleHint = TEMPLATE_PROMPTS[template] ?? TEMPLATE_PROMPTS.custom;

    const systemPrompt = `너는 AI/ML 학술 논문을 리뷰하는 전문가야.
사용자가 작성한 리뷰 초안을 받으면, 다음 원칙으로 **다듬어서** 돌려줘:
1. **형식**: ${styleHint}
2. **어조**: 전문적, 건설적, 객관적. 비난보다는 개선 제안.
3. **언어**: 입력이 영어면 영어로, 한국어면 한국어로 유지. 섞여 있으면 주된 언어로 통일.
4. **내용 보존**: 의미를 바꾸지 말고, 문장만 다듬어줘. 핵심 포인트는 유지.
5. **출력**: 다듬은 텍스트만 그대로 반환해. 설명이나 주석 없이 순수 텍스트만.`;

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
            content: `아래 리뷰 초안을 다듬어줘. 설명 없이 다듬은 텍스트만 반환해.\n\n---\n${text}`,
          },
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
    const polished = data.choices?.[0]?.message?.content?.trim() ?? text;

    return NextResponse.json({ polished });
  } catch (e) {
    console.error("review-polish error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }
}
