import { ImageResponse } from "next/og";

export const alt = "CafeFocus — work-friendly cafe map";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * 공유 미리보기 이미지. 기본 OG 폰트에 한글 글리프가 없어 문구는 영문으로 두고,
 * 지도의 점수 알약 마커를 그대로 그려 서비스의 첫인상을 전한다.
 */
const PINS = [
  { x: 640, y: 170, s: 88, best: true },
  { x: 820, y: 250, s: 84, best: false },
  { x: 720, y: 360, s: 91, best: true },
  { x: 930, y: 400, s: 79, best: false },
  { x: 580, y: 450, s: 75, best: false },
  { x: 1010, y: 160, s: 82, best: false },
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F3EEE2", position: "relative", fontFamily: "sans-serif" }}>
        {/* 데모 지도 느낌의 도로 */}
        {[180, 330, 480].map((y) => (
          <div key={y} style={{ position: "absolute", left: 520, right: 0, top: y, height: 14, background: "#FFFFFF" }} />
        ))}
        {[600, 780, 960].map((x) => (
          <div key={x} style={{ position: "absolute", top: 0, bottom: 0, left: x, width: 14, background: "#FFFFFF" }} />
        ))}
        <div style={{ position: "absolute", left: 520, right: 0, bottom: 0, height: 90, background: "#C2D9E8" }} />
        {PINS.map((p) => (
          <div
            key={`${p.x}-${p.y}`}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              display: "flex",
              padding: "8px 18px",
              borderRadius: 999,
              fontSize: 30,
              fontWeight: 800,
              background: p.best ? "#4A6538" : "#FFFFFF",
              color: p.best ? "#FFFFFF" : "#38291C",
              border: p.best ? "none" : "2px solid #CDBBA4",
              boxShadow: "0 4px 10px rgba(44,32,21,0.25)",
            }}
          >
            {p.s}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 560,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 64px",
            background: "#38291C",
            color: "#FBF8F2",
          }}
        >
          <div style={{ fontSize: 28, letterSpacing: 6, color: "#CDBBA4" }}>CAFE FOCUS</div>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, marginTop: 20 }}>Find a cafe you can actually work in.</div>
          <div style={{ fontSize: 26, color: "#E9DFD1", marginTop: 24, lineHeight: 1.4 }}>
            Noise, crowd, outlets and Wi-Fi by hour — then plan and check in.
          </div>
        </div>
      </div>
    ),
    size
  );
}
