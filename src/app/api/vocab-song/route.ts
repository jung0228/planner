import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `너는 영어 단어 암기를 도와주는 재미있는 랩 가사 작가야.
사용자가 TEPS 영어 단어 목록을 주면, 그 단어들을 모두 자연스럽게 녹여넣은 짧고 재미있는 랩/노래 가사를 만들어줘.

규칙:
- 영어 단어는 반드시 원형 그대로 사용 (한국어 뜻은 괄호로 옆에 표기)
- 라임(rhyme)이 있어서 리듬감 있게 읽힐 것
- 4~8줄 정도의 짧은 가사
- 재미있고 기억에 남을 것
- 가사 앞에 제목(🎵 제목:)을 붙일 것
- 가사만 출력하고 다른 설명 없이`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
  }

  try {
    const { words } = await req.json();
    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: "words 배열이 필요합니다." }, { status: 400 });
    }

    const wordList = words
      .map((w: { word: string; meaning: string }) => `${w.word} (${w.meaning})`)
      .join(", ");

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
          { role: "user", content: `다음 단어들로 랩 가사 만들어줘: ${wordList}` },
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenAI 오류: ${response.status}`, details: err }, { status: response.status });
    }

    const data = await response.json();
    const lyrics = data.choices?.[0]?.message?.content?.trim();
    if (!lyrics) {
      return NextResponse.json({ error: "응답이 없습니다." }, { status: 500 });
    }

    return NextResponse.json({ lyrics });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "서버 오류" }, { status: 500 });
  }
}
