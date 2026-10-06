import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "저장한 카페",
  description: "저장한 작업 카페를 지금 기준 적합도순으로 보고 비교함에 담아요.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
