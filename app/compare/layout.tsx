import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "카페 비교",
  description: "2~3곳을 시간대 혼잡·소음·콘센트·Wi-Fi까지 나란히 비교해요.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
