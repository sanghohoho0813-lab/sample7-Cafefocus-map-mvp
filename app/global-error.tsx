"use client";

/** 루트 레이아웃까지 실패했을 때의 마지막 안전망 (전역 CSS가 없을 수 있어 인라인 스타일) */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FBF8F2", color: "#2C2015" }}>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 21, margin: 0 }}>CafeFocus를 불러오지 못했어요</h1>
            <p style={{ color: "#6F563E", marginTop: 8 }}>잠시 후 다시 시도해 주세요.</p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 20, height: 44, padding: "0 20px", border: 0, borderRadius: 12, background: "#38291C", color: "#fff", fontWeight: 600 }}
            >
              다시 시도
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
