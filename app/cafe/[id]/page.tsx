import { notFound } from "next/navigation";
import { CAFES, getCafe } from "@/lib/data/cafes";
import CafeDetail from "@/components/CafeDetail";

export function generateStaticParams() {
  return CAFES.map((c) => ({ id: c.id }));
}

export default async function CafeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cafe = getCafe(id);
  if (!cafe) notFound();
  return <CafeDetail cafe={cafe} />;
}
