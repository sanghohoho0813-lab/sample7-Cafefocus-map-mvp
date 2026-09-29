import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAFES, getCafe } from "@/lib/data/cafes";
import PlanForm from "@/components/PlanForm";

export function generateStaticParams() {
  return CAFES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cafe = getCafe(id);
  return { title: cafe ? `${cafe.name} 작업 계획 — CafeFocus` : "CafeFocus" };
}

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cafe = getCafe(id);
  if (!cafe) notFound();
  return (
    <Suspense fallback={null}>
      <PlanForm cafe={cafe} />
    </Suspense>
  );
}
