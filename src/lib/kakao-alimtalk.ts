/**
 * 카카오 알림톡 API 연동 모듈 (준비 단계)
 *
 * 실제 연동 시 필요:
 * 1. 카카오 비즈니스 채널 개설
 * 2. 알림톡 발신 프로필 등록
 * 3. 메시지 템플릿 등록 및 검수
 * 4. 발송 API 키 발급
 *
 * 환경변수 (.env):
 * KAKAO_ALIMTALK_API_KEY=
 * KAKAO_ALIMTALK_SENDER_KEY=
 * KAKAO_ALIMTALK_ENABLED=false
 */

interface AlimtalkParams {
  phone: string; // 수신자 전화번호 (010-xxxx-xxxx)
  templateCode: string; // 등록된 템플릿 코드
  variables: Record<string, string>; // 템플릿 변수
}

// 템플릿 코드 정의
export const ALIMTALK_TEMPLATES = {
  /** 회원가입 완료 */
  WELCOME: "WELCOME_001",
  /** 댓글 알림 */
  NEW_COMMENT: "COMMENT_001",
  /** 인기글 선정 */
  POST_POPULAR: "POPULAR_001",
  /** 신고 처리 결과 */
  REPORT_RESULT: "REPORT_001",
  /** 광고 만료 예정 */
  AD_EXPIRING: "AD_EXPIRE_001",
  /** 결제 완료 */
  PAYMENT_COMPLETE: "PAYMENT_001",
} as const;

/**
 * 카카오 알림톡 발송 (스텁)
 *
 * 실제 연동 시 이 함수 내부만 교체하면 됩니다.
 * 현재는 로그만 출력합니다.
 */
export async function sendAlimtalk({
  phone,
  templateCode,
  variables,
}: AlimtalkParams): Promise<{ success: boolean; messageId?: string }> {
  const enabled = process.env.KAKAO_ALIMTALK_ENABLED === "true";

  if (!enabled) {
    console.log(
      `[알림톡 스텁] 수신: ${phone}, 템플릿: ${templateCode}, 변수:`,
      variables
    );
    return { success: true, messageId: `stub_${Date.now()}` };
  }

  // ─── 실제 API 연동 코드 (추후 구현) ───
  // const API_KEY = process.env.KAKAO_ALIMTALK_API_KEY;
  // const SENDER_KEY = process.env.KAKAO_ALIMTALK_SENDER_KEY;
  //
  // const res = await fetch("https://api-alimtalk.kakao.com/v2/sender/send", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     senderKey: SENDER_KEY,
  //     templateCode,
  //     recipientList: [
  //       {
  //         recipientNo: phone.replace(/-/g, ""),
  //         templateParameter: variables,
  //       },
  //     ],
  //   }),
  // });
  //
  // const data = await res.json();
  // return {
  //   success: data.statusCode === "1000",
  //   messageId: data.messageId,
  // };
  // ─── 여기까지 ───

  return { success: false };
}

// ==========================================
// 시나리오별 알림톡 발송 헬퍼
// ==========================================

/** 회원가입 환영 알림톡 */
export async function sendWelcomeAlimtalk(phone: string, nickname: string) {
  return sendAlimtalk({
    phone,
    templateCode: ALIMTALK_TEMPLATES.WELCOME,
    variables: { nickname },
  });
}

/** 댓글 알림톡 */
export async function sendCommentAlimtalk(
  phone: string,
  postTitle: string,
  commenter: string
) {
  return sendAlimtalk({
    phone,
    templateCode: ALIMTALK_TEMPLATES.NEW_COMMENT,
    variables: { postTitle, commenter },
  });
}

/** 인기글 선정 알림톡 */
export async function sendPopularAlimtalk(phone: string, postTitle: string) {
  return sendAlimtalk({
    phone,
    templateCode: ALIMTALK_TEMPLATES.POST_POPULAR,
    variables: { postTitle },
  });
}

/** 광고 만료 예정 알림톡 */
export async function sendAdExpiringAlimtalk(
  phone: string,
  bizName: string,
  daysLeft: string
) {
  return sendAlimtalk({
    phone,
    templateCode: ALIMTALK_TEMPLATES.AD_EXPIRING,
    variables: { bizName, daysLeft },
  });
}

/** 결제 완료 알림톡 */
export async function sendPaymentAlimtalk(
  phone: string,
  productName: string,
  amount: string
) {
  return sendAlimtalk({
    phone,
    templateCode: ALIMTALK_TEMPLATES.PAYMENT_COMPLETE,
    variables: { productName, amount },
  });
}
