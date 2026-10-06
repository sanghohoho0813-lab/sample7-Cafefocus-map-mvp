import { Suspense } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAFES, getCafe } from "@/lib/data/cafes";
import ReviewForm from "@/components/ReviewForm";

export function generateStaticParams() {
  return CAFES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cafe = getCafe(id);
  return cafe ? { title: `${cafe.name} 작업 후기`, robots: { index: false } } : {};
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cafe = getCafe(id);
  if (!cafe) notFound();
  return (
    <Suspense fallback={<PageSkeleton variant="form" />}>
      <ReviewForm cafe={cafe} />
    </Suspense>
  );
}
