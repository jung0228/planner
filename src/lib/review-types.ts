export type FeedbackItem = {
  id: string;
  type: "meta" | "ae" | "other";
  text: string;
  addedAt: string;
};

/** 리뷰어 지적/언급 사항 (W1, W2, C1 등 점별) */
export type ReviewPoint = {
  id: string;
  reviewerIndex: number; // 0-based, 리뷰어 번호
  label: string; // "W1", "W2" (Weaknesses), "C1", "C2" (Comments)
  reviewerText: string; // 리뷰어 원문 (엔터 기준 한 줄 = 한 점)
  myRebuttal: string; // 해당 점에 대한 내 답변
  section?: string; // "Summary Of Weaknesses" | "Comments Suggestions And Typos"
};

export type ReviewProject = {
  id: string;
  paperId: string;
  /** 받은 리뷰들 (리뷰어1, 2, 3... 텍스트) */
  incomingReviews: string[];
  /** 점별 구조 (W1, Q1... 리뷰어 원문 + 내 답변) */
  reviewPoints: ReviewPoint[];
  /** 최종 rebuttal 마크다운 문서 (점별 합친 결과, 피드백 반영 수정) */
  myResponse?: string;
  /** 메타리뷰, AE 코멘트 등 추가 피드백 */
  feedbacks: FeedbackItem[];
  updatedAt: string;
};
