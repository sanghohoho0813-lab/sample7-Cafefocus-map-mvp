import { Suspense } from "react";
import PlanView from "@/components/PlanView";

export const metadata = { title: "작업 일정 — CafeFocus" };

/** 계획 ID는 브라우저에서 만들어지므로 요청 시 렌더링하고, 내용은 클라이언트 저장소에서 읽는다 */
export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanView />
    </Suspense>
  );
}
