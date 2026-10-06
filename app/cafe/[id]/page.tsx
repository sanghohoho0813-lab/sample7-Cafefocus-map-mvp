import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAFES, getCafe } from "@/lib/data/cafes";
import CafeDetail from "@/components/CafeDetail";

export function generateStaticParams() {
  return CAFES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cafe = getCafe(id);
  return cafe
    ? {
        title: cafe.name,
        description: cafe.description,
        openGraph: { title: cafe.name, description: cafe.description, images: [{ url: `/images/cafes/${cafe.id}.webp`, width: 1440, height: 810 }] },
      }
    : {};
}

export default async function CafeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cafe = getCafe(id);
  if (!cafe) notFound();
  return <CafeDetail cafe={cafe} />;
}
