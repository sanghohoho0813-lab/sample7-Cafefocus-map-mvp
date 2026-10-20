import Link from "next/link";
import { Target } from "lucide-react";
import { AREAS } from "@/lib/data/cafes";
import Illustration from "@/components/Illustration";

/** 없는 주소 — 막다른 길 대신, 다시 고를 수 있는 길을 바로 보여준다 */
export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-cream-50 px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <Illustration variant="lost" className="mx-auto w-full max-w-[280px]" />
        <h1 className="mt-6 text-page text-coffee-900">찾으시는 페이지가 없어요</h1>
        <p className="mt-2 text-body text-coffee-500">주소가 바뀌었거나 없는 카페예요. 지도에서 다시 골라볼까요?</p>
        <div className="mt-7 flex flex-col gap-2.5">
          <Link href="/" className="btn-primary">
            지도로 돌아가기
          </Link>
          <Link href="/recommend" className="btn-secondary">
            <Target size={17} aria-hidden />
            맞춤 추천 받기
          </Link>
        </div>
        <nav aria-label="지역으로 바로 가기" className="mt-8">
          <p className="text-caption font-semibold text-coffee-400">지역으로 바로 가기</p>
          <ul className="mt-2.5 flex flex-wrap justify-center gap-2">
            {AREAS.map((a) => (
              <li key={a.key}>
                <Link href={`/?area=${a.key}`} className="chip chip-idle h-9">
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
