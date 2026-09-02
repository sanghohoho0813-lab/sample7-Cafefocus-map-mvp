import Image from "next/image";

/**
 * 미래에이아이랩 브랜드 크레딧.
 * 로고 원본(배경 투명)을 그대로 사용하며, 색을 바꾸지 않는다.
 *
 * - "light": 밝은 배경에 전체 로고(심볼 + 워드마크)
 * - "dark" : 어두운 사이드바용. 워드마크가 짙은 남색이라 배경에 묻히므로
 *            심볼만 쓰고 사명은 크림색 텍스트로 짝지어 대비를 확보한다.
 * - "mini" : 지도 저작권 표기 등 아주 작은 자리. 심볼만.
 */
export default function BrandCredit({
  variant = "light",
  label = "Powered by",
  className = "",
}: {
  variant?: "light" | "dark" | "mini";
  label?: string;
  className?: string;
}) {
  if (variant === "mini") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${className}`}
        title="미래에이아이랩"
      >
        <Image
          src="/brand/mirae-ai-lab-mark.png"
          alt="미래에이아이랩"
          width={176}
          height={116}
          className="h-[15px] w-auto opacity-80"
        />
        <span className="text-[12px] font-medium text-coffee-400">
          Demo Map · 미래에이아이랩
        </span>
      </span>
    );
  }

  if (variant === "dark") {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <Image
          src="/brand/mirae-ai-lab-mark.png"
          alt=""
          width={176}
          height={116}
          className="h-7 w-auto shrink-0"
        />
        <span className="leading-tight">
          <span className="block text-[11.5px] font-medium text-cream-100/60">
            {label}
          </span>
          <span className="block text-[14px] font-bold tracking-tight text-cream-50">
            미래에이아이랩
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {label && (
        <span className="text-[13px] font-medium text-coffee-300">{label}</span>
      )}
      <Image
        src="/brand/mirae-ai-lab.png"
        alt="미래에이아이랩"
        width={600}
        height={117}
        // 좁은 화면에서 잘리지 않도록 단계별로 축소
        className="h-[19px] w-auto sm:h-[23px] lg:h-[26px]"
      />
    </div>
  );
}
