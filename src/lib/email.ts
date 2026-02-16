const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "여시광장 <noreply@yeosigwangjang.com>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY가 설정되지 않았습니다. 이메일 전송 건너뜀.");
    return { success: false, error: "API key not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("이메일 전송 실패:", error);
    return { success: false, error };
  }

  return { success: true };
}

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: "[여시광장] 비밀번호 재설정",
    html: `
      <div style="max-width:480px;margin:0 auto;padding:32px;font-family:sans-serif;background:#1A1A2E;color:#F5F5F5;border-radius:12px;">
        <h2 style="color:#8B5CF6;margin-bottom:24px;">비밀번호 재설정</h2>
        <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요.</p>
        <p style="color:#999;font-size:13px;">이 링크는 1시간 동안 유효합니다.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#6B21A8;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
          비밀번호 재설정
        </a>
        <p style="color:#666;font-size:12px;">본인이 요청하지 않았다면 이 이메일을 무시하세요.</p>
      </div>
    `,
  };
}
