"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  { key: "CLOTHING", label: "의상" },
  { key: "BAG", label: "가방" },
  { key: "SHOES", label: "신발" },
  { key: "ACCESSORY", label: "소품" },
  { key: "ETC", label: "기타" },
];

export default function MarketWritePage() {
  return (
    <Suspense>
      <MarketWriteContent />
    </Suspense>
  );
}

function MarketWriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 수정 모드: 기존 데이터 로드
  const fetchExisting = useCallback(async () => {
    if (!editId) return;
    try {
      const res = await fetch(`/api/market/${editId}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title);
        setCategory(data.category);
        setPrice(data.price.toString());
        setDescription(data.description);
        setImages(data.images);
      }
    } catch {
      /* ignore */
    }
  }, [editId]);

  useEffect(() => {
    fetchExisting();
  }, [fetchExisting]);

  const canWrite =
    session?.user.userType === "USER" &&
    (session.user.grade === "REGULAR" || session.user.role === "ADMIN");

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 5 - images.length;
    if (remaining <= 0) {
      alert("이미지는 최대 5장까지 등록할 수 있습니다.");
      return;
    }

    const selected = Array.from(files).slice(0, remaining);

    // 클라이언트 사이즈 체크
    for (const f of selected) {
      if (f.size > 5 * 1024 * 1024) {
        alert(`파일 크기가 5MB를 초과합니다: ${f.name}`);
        return;
      }
      if (!f.type.startsWith("image/")) {
        alert(`이미지 파일만 업로드할 수 있습니다: ${f.name}`);
        return;
      }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      selected.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setImages((prev) => [...prev, ...data.urls]);
      } else {
        alert(data.error || "이미지 업로드에 실패했습니다.");
      }
    } catch {
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!category) {
      alert("카테고리를 선택해주세요.");
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      alert("올바른 가격을 입력해주세요.");
      return;
    }
    if (!description.trim()) {
      alert("상품 설명을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        title: title.trim(),
        category,
        price: Number(price),
        description: description.trim(),
        images,
      };

      const url = editId ? `/api/market/${editId}` : "/api/market";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/market/${editId || data.id}`);
      } else {
        alert(data.error || "등록 중 오류가 발생했습니다.");
      }
    } catch {
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return <div className="text-center py-20 text-gray-500">로딩 중...</div>;
  }

  if (!canWrite) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-2">정회원만 글을 작성할 수 있습니다.</p>
        <p className="text-xs text-gray-600 mb-4">
          정회원 승급 조건을 확인해주세요.
        </p>
        <Link href="/market" className="text-primary-light hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">
        {editId ? "중고 상품 수정" : "중고 상품 등록"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            카테고리 <span className="text-urgent">*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === c.key
                    ? "bg-primary text-white"
                    : "bg-dark-card text-gray-400 hover:text-white border border-dark-border"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            제목 <span className="text-urgent">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="상품명을 입력하세요"
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* 가격 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            가격 (원) <span className="text-urgent">*</span>
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
            placeholder="0 입력 시 나눔"
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            이미지 ({images.length}/5)
          </label>
          <div className="flex gap-3 flex-wrap">
            {images.map((url, i) => (
              <div
                key={i}
                className="relative w-20 h-20 rounded-lg overflow-hidden bg-dark-card group"
              >
                <Image
                  src={url}
                  alt={`이미지 ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  &times;
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-dark-border hover:border-primary/50 flex flex-col items-center justify-center text-gray-500 hover:text-primary transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <span className="text-xs">업로드중</span>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-[10px] mt-0.5">추가</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <p className="text-xs text-gray-600 mt-1">
            JPG, PNG, WebP, GIF · 각 5MB 이하
          </p>
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            상품 설명 <span className="text-urgent">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="상품 상태, 사용 기간, 거래 방법 등을 자세히 적어주세요."
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* 제출 */}
        <div className="flex gap-3">
          <Link
            href="/market"
            className="flex-1 py-3 rounded-lg text-sm font-medium text-center bg-dark-border text-gray-300 hover:bg-dark-card transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="flex-1 py-3 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting
              ? "처리 중..."
              : editId
                ? "수정하기"
                : "등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
