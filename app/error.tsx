"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import Illustration from "@/components/Illustration";

/** 화면 단위 오류 경계 — 앱 전체가 하얗게 멈추지 않고, 다시 시도하거나 지도로 돌아갈 수 있게 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center bg-cream-50 px-6">
      <div className="w-full max-w-sm text-center">
        <Illustration variant="error" className="mx-auto w-full max-w-[260px]" />
        <h1 className="mt-6 text-page text-coffee-900">화면을 불러오지 못했어요</h1>
        <p className="mt-2 text-body text-coffee-500">
          일시적인 문제일 수 있어요. 다시 시도해도 계속되면 내 작업 → 데모 데이터 초기화를 눌러주세요.
        </p>
        <div className="mt-7 flex flex-col gap-2.5">
          <button type="button" onClick={reset} className="btn-primary">
            <RotateCcw size={16} />
            다시 시도
          </button>
          <Link href="/" className="btn-secondary">
            지도로 가기
          </Link>
        </div>
        {error.digest && <p className="mt-4 text-caption text-coffee-400">오류 코드 {error.digest}</p>}
      </div>
    </div>
  );
}
