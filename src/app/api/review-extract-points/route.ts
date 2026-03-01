import { NextRequest, NextResponse } from "next/server";

/**
 * "Summary Of Weaknesses:" 와 "Comments Suggestions And Typos:" 섹션만 파싱.
 * 빈 줄(paragraph) 기준으로 하나의 포인트. 한 문단 = 한 점.
 */
function parseReviewBySections(
  text: string,
  reviewerIndex: number
): { reviewerIndex: number; label: string; reviewerText: string; section: string }[] {
  const points: { reviewerIndex: number; label: string; reviewerText: string; section: string }[] = [];
  const t = String(text || "").trim();
  if (!t) return points;

  const sectionPatterns = [
    {
      key: "W",
      regex: /Summary\s+Of\s+Weaknesses\s*:?\s*\n?([\s\S]*?)(?=Comments\s+Suggestions\s+And\s+Typos\s*:?|$)/i,
    },
    {
      key: "C",
      regex: /Comments\s+Suggestions\s+And\s+Typos\s*:?\s*\n?([\s\S]*?)(?=Summary\s+Of\s+Weaknesses\s*:?|$)/i,
    },
  ];

  for (const { key, regex } of sectionPatterns) {
    const m = t.match(regex);
    if (!m) continue;
    const content = (m[1] || "").trim();
    const section = key === "W" ? "Summary Of Weaknesses" : "Comments Suggestions And Typos";

    // 빈 줄(paragraph) 기준으로 분리 - 한 문단 = 한 포인트. 단일 엔터는 하나로 유지.
    const blocks = content
      .split(/\n\s*\n/)
      .map((b) => b.replace(/\r\n/g, "\n").trim())
      .filter((b) => b.length > 0);

    blocks.forEach((block, i) => {
      points.push({
        reviewerIndex,
        label: `${key}${i + 1}`,
        reviewerText: block,
        section,
      });
    });
  }

  return points;
}

export async function POST(req: NextRequest) {
  try {
    const { reviews } = await req.json();
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json(
        { error: "reviews 배열이 필요합니다." },
        { status: 400 }
      );
    }

    const allPoints: { reviewerIndex: number; label: string; reviewerText: string; section: string }[] = [];

    reviews.forEach((r: string, reviewerIndex: number) => {
      const parsed = parseReviewBySections(String(r || "").trim(), reviewerIndex);
      parsed.forEach((p) => {
        allPoints.push({
          reviewerIndex: p.reviewerIndex,
          label: p.label,
          reviewerText: p.reviewerText,
          section: p.section,
        });
      });
    });

    return NextResponse.json({
      points: allPoints.slice(0, 120).map((p) => ({
        reviewerIndex: p.reviewerIndex,
        label: p.label,
        reviewerText: p.reviewerText,
        section: p.section,
      })),
    });
  } catch (e) {
    console.error("review-extract-points error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }
}
