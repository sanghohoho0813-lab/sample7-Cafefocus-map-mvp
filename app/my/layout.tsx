import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 작업",
  description: "예정된 작업, 지난 기록, 체크인 후기를 한곳에서 봐요.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
