import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "맞춤 추천",
  description: "작업 목적·중요한 조건·머무는 시간 세 가지로 지금 가장 잘 맞는 카페를 골라드려요.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
