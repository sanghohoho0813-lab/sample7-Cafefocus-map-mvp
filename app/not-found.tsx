import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={MapPin}
        title="찾으시는 페이지가 없어요"
        description="지도로 돌아가서 작업하기 좋은 카페를 찾아보세요."
        action={
          <Link href="/" className="btn-primary h-11">
            지도로 돌아가기
          </Link>
        }
      />
    </div>
  );
}
