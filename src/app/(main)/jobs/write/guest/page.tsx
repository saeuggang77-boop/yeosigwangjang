"use client";

import Link from "next/link";

export default function GuestJobWritePage() {
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl font-bold mb-4">비회원 구인글 등록</h1>
      <p className="text-gray-400 mb-6">
        비회원도 구인글을 등록할 수 있습니다.
        <br />
        이메일과 연락처만 입력하면 됩니다.
      </p>
      <p className="text-sm text-gray-500 mb-8">
        등록 후 수정/삭제는 이메일로 발송되는 링크를 이용해주세요.
      </p>
      <Link href="/jobs/write" className="btn-primary py-3 px-6">
        구인글 작성하기
      </Link>
      <p className="text-xs text-gray-600 mt-6">
        업소 회원가입 시 대시보드에서 편리하게 관리할 수 있습니다.
        <br />
        <Link
          href="/auth/register/biz"
          className="text-primary-light hover:underline"
        >
          업소 회원가입 &rarr;
        </Link>
      </p>
    </div>
  );
}
