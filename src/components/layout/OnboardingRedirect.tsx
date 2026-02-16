"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function OnboardingRedirect() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 소셜 로그인 유저이고 임시 닉네임인 경우 온보딩으로 리다이렉트
    if (
      session?.user.userType === "USER" &&
      session.user.nickname?.startsWith("여시_")
    ) {
      router.replace("/auth/onboarding");
    }
  }, [session, router]);

  return null;
}
