import { prisma } from "@/lib/prisma";

// ==========================================
// 알림 생성 헬퍼
// ==========================================

export type NotificationType =
  | "COMMENT"
  | "REPLY"
  | "LIKE"
  | "POPULAR"
  | "REPORT_RESOLVED"
  | "AD_INQUIRY"
  | "SYSTEM";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
}

/** 단일 알림 생성 */
export async function createNotification({
  userId,
  type,
  message,
  link,
}: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: { userId, type, message, link: link || null },
    });
  } catch (error) {
    console.error("알림 생성 실패:", error);
  }
}

/** 여러 사용자에게 알림 생성 */
export async function createNotifications(
  userIds: string[],
  type: NotificationType,
  message: string,
  link?: string
) {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        message,
        link: link || null,
      })),
    });
  } catch (error) {
    console.error("알림 일괄 생성 실패:", error);
  }
}

// ==========================================
// 알림 시나리오별 헬퍼
// ==========================================

/** 내 게시글에 댓글이 달렸을 때 */
export async function notifyNewComment(
  postAuthorId: string,
  commenterNickname: string,
  postTitle: string,
  postId: string,
  boardSlug: string
) {
  await createNotification({
    userId: postAuthorId,
    type: "COMMENT",
    message: `${commenterNickname}님이 "${postTitle}" 글에 댓글을 남겼습니다.`,
    link: `/community/${boardSlug}/${postId}`,
  });
}

/** 내 댓글에 답글이 달렸을 때 */
export async function notifyNewReply(
  commentAuthorId: string,
  replierNickname: string,
  postTitle: string,
  postId: string,
  boardSlug: string
) {
  await createNotification({
    userId: commentAuthorId,
    type: "REPLY",
    message: `${replierNickname}님이 "${postTitle}" 글에서 내 댓글에 답글을 남겼습니다.`,
    link: `/community/${boardSlug}/${postId}`,
  });
}

/** 내 게시글이 인기글이 되었을 때 */
export async function notifyPostPopular(
  postAuthorId: string,
  postTitle: string,
  postId: string,
  boardSlug: string
) {
  await createNotification({
    userId: postAuthorId,
    type: "POPULAR",
    message: `"${postTitle}" 글이 인기글로 선정되었습니다! 🎉`,
    link: `/community/${boardSlug}/${postId}`,
  });
}

/** 내 게시글에 좋아요가 달렸을 때 (N번째 알림) */
export async function notifyPostLike(
  postAuthorId: string,
  likeCount: number,
  postTitle: string,
  postId: string,
  boardSlug: string
) {
  // 5, 10, 50, 100번째 좋아요만 알림
  if (![5, 10, 50, 100].includes(likeCount)) return;
  await createNotification({
    userId: postAuthorId,
    type: "LIKE",
    message: `"${postTitle}" 글이 좋아요 ${likeCount}개를 달성했습니다!`,
    link: `/community/${boardSlug}/${postId}`,
  });
}

/** 신고 처리 결과 알림 */
export async function notifyReportResolved(
  reporterId: string,
  status: "RESOLVED" | "DISMISSED"
) {
  const statusText = status === "RESOLVED" ? "처리 완료" : "기각";
  await createNotification({
    userId: reporterId,
    type: "REPORT_RESOLVED",
    message: `회원님의 신고가 ${statusText} 되었습니다.`,
  });
}
