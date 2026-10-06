"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";

/** 화면 단위 오류 경계 — 앱 전체가 하얗게 멈추지 않고, 다시 시도하거나 지도로 돌아갈 수 있게 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center bg-cream-50 px-6">
      <div className="max-w-sm text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream-200 text-coffee-500">
          <TriangleAlert size={22} />
        </span>
        <h1 className="mt-4 text-section text-coffee-900">화면을 불러오지 못했어요</h1>
        <p className="mt-1.5 text-meta text-coffee-500">
          일시적인 문제일 수 있어요. 다시 시도해도 계속되면 내 작업 → 데모 데이터 초기화를 눌러주세요.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="btn-primary h-11">
            <RotateCcw size={16} />
            다시 시도
          </button>
          <Link href="/" className="btn-secondary h-11">
            지도로 가기
          </Link>
        </div>
        {error.digest && <p className="mt-4 text-caption text-coffee-400">오류 코드 {error.digest}</p>}
      </div>
    </div>
  );
}
