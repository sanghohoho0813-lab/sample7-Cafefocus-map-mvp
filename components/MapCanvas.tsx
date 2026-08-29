import { useMemo } from "react";

/**
 * 데모 맵 베이스 레이어.
 * 실제 지도 타일 대신, 도로 위계(고속화도로/간선/이면도로) · 블록과 건물 ·
 * 공원 · 하천과 교량 · 지하철 노선과 역을 직접 그려 "지도처럼" 보이게 한다.
 * viewBox 1000x700, preserveAspectRatio="slice" 로 컨테이너를 채운다.
 */

const C = {
  land: "#F3EEE2",
  block: "#EDE6D6",
  building: "#E2D9C6",
  buildingEdge: "#D6CAB2",
  park: "#D8E4C6",
  parkEdge: "#C7D8B0",
  water: "#C2D9E8",
  waterEdge: "#AFCCDE",
  casing: "#E0D5BE",
  road: "#FFFFFF",
  highway: "#FBEBC6",
  highwayEdge: "#E9D6A6",
  label: "#A2957B",
  roadLabel: "#B3A78C",
  line2: "#3D8A5F",
  line3: "#CF8A3C",
};

/** 간선도로 좌표 (블록 경계와 일치) */
const HX = [140, 330, 520, 700, 870]; // 세로 도로
const HY = [110, 250, 400, 520, 660]; // 가로 도로

/** 하천 밴드: HY[3]~HY[4] 사이 */
const RIVER_TOP = 528;
const RIVER_BOTTOM = 652;

/** 공원으로 대체할 블록 (col,row) */
const PARK_BLOCKS = new Set(["0,2", "4,1", "2,0"]);

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function prng(seed: number) {
  let x = (seed * 2654435761) % 2147483647;
  if (x <= 0) x += 2147483646;
  return () => {
    x = (x * 48271) % 2147483647;
    return x / 2147483647;
  };
}

/** 도로 사이 블록을 만들고, 각 블록을 건물로 채운다 */
function buildBlocks() {
  const colEdges = [0, ...HX, 1000];
  const rowEdges = [0, ...HY, 700];
  const inset = 11;
  const blocks: (Rect & { key: string; park: boolean })[] = [];

  for (let r = 0; r < rowEdges.length - 1; r++) {
    for (let c = 0; c < colEdges.length - 1; c++) {
      const y = rowEdges[r] + inset;
      const h = rowEdges[r + 1] - rowEdges[r] - inset * 2;
      const x = colEdges[c] + inset;
      const w = colEdges[c + 1] - colEdges[c] - inset * 2;
      if (w < 26 || h < 26) continue;
      // 하천과 겹치는 블록은 제외
      if (y + h > RIVER_TOP && y < RIVER_BOTTOM) continue;
      blocks.push({ x, y, w, h, key: `${c},${r}`, park: PARK_BLOCKS.has(`${c},${r}`) });
    }
  }
  return blocks;
}

function buildBuildings(blocks: ReturnType<typeof buildBlocks>) {
  const out: (Rect & { id: string })[] = [];
  blocks.forEach((b, bi) => {
    if (b.park) return;
    const rnd = prng(bi + 7);
    const cell = 46;
    const cols = Math.max(1, Math.floor(b.w / cell));
    const rows = Math.max(1, Math.floor(b.h / cell));
    const cw = b.w / cols;
    const ch = b.h / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (rnd() < 0.28) continue; // 빈 필지
        const pw = cw * (0.45 + rnd() * 0.36);
        const ph = ch * (0.45 + rnd() * 0.36);
        const px = b.x + i * cw + (cw - pw) * rnd();
        const py = b.y + j * ch + (ch - ph) * rnd();
        out.push({ x: px, y: py, w: pw, h: ph, id: `${bi}-${i}-${j}` });
      }
    }
  });
  return out;
}

export default function MapCanvas() {
  const { blocks, buildings } = useMemo(() => {
    const b = buildBlocks();
    return { blocks: b, buildings: buildBuildings(b) };
  }, []);

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <rect width="1000" height="700" fill={C.land} />

      {/* ---- 블록 · 건물 ---- */}
      <g>
        {blocks.map((b) => (
          <rect
            key={b.key}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx="6"
            fill={b.park ? C.park : C.block}
            stroke={b.park ? C.parkEdge : "none"}
            strokeWidth={b.park ? 1.5 : 0}
          />
        ))}
      </g>
      <g fill={C.building} stroke={C.buildingEdge} strokeWidth="0.8">
        {buildings.map((p) => (
          <rect key={p.id} x={p.x} y={p.y} width={p.w} height={p.h} rx="1.5" />
        ))}
      </g>

      {/* ---- 하천 ---- */}
      <path
        d={`M -20 ${RIVER_TOP + 8} C 220 ${RIVER_TOP - 18}, 430 ${RIVER_TOP + 26}, 640 ${RIVER_TOP - 4} S 900 ${RIVER_TOP - 20}, 1020 ${RIVER_TOP + 2} L 1020 ${RIVER_BOTTOM + 6} C 860 ${RIVER_BOTTOM - 12}, 620 ${RIVER_BOTTOM + 18}, 380 ${RIVER_BOTTOM - 6} S 80 ${RIVER_BOTTOM + 14}, -20 ${RIVER_BOTTOM} Z`}
        fill={C.water}
        stroke={C.waterEdge}
        strokeWidth="2"
      />
      {/* 하천 둔치 */}
      <path
        d={`M -20 ${RIVER_TOP + 8} C 220 ${RIVER_TOP - 18}, 430 ${RIVER_TOP + 26}, 640 ${RIVER_TOP - 4} S 900 ${RIVER_TOP - 20}, 1020 ${RIVER_TOP + 2}`}
        fill="none"
        stroke={C.park}
        strokeWidth="9"
        opacity="0.75"
      />

      {/* ---- 도로: 케이싱 → 본선 ---- */}
      {/* 이면도로 */}
      <g stroke={C.casing} strokeWidth="7" fill="none" strokeLinecap="round">
        <path d="M 235 0 L 235 520" />
        <path d="M 425 0 L 425 520" />
        <path d="M 610 0 L 610 520" />
        <path d="M 785 0 L 785 520" />
        <path d="M 0 180 L 1000 180" />
        <path d="M 0 325 L 1000 325" />
        <path d="M 0 460 L 1000 460" />
        <path d="M 0 680 L 1000 680" />
      </g>
      <g stroke={C.road} strokeWidth="4.5" fill="none" strokeLinecap="round">
        <path d="M 235 0 L 235 520" />
        <path d="M 425 0 L 425 520" />
        <path d="M 610 0 L 610 520" />
        <path d="M 785 0 L 785 520" />
        <path d="M 0 180 L 1000 180" />
        <path d="M 0 325 L 1000 325" />
        <path d="M 0 460 L 1000 460" />
        <path d="M 0 680 L 1000 680" />
      </g>

      {/* 간선도로 */}
      <g stroke={C.casing} strokeWidth="20" fill="none" strokeLinecap="round">
        {HX.map((x) => (
          <path key={`cx${x}`} d={`M ${x} 0 L ${x} 700`} />
        ))}
        {HY.map((y) => (
          <path key={`cy${y}`} d={`M 0 ${y} L 1000 ${y}`} />
        ))}
      </g>
      <g stroke={C.road} strokeWidth="14" fill="none" strokeLinecap="round">
        {HX.map((x) => (
          <path key={`rx${x}`} d={`M ${x} 0 L ${x} 700`} />
        ))}
        {HY.map((y) => (
          <path key={`ry${y}`} d={`M 0 ${y} L 1000 ${y}`} />
        ))}
      </g>

      {/* 강변 고속화도로 (하천 양안) */}
      <g fill="none" strokeLinecap="round">
        <path
          d={`M -20 ${RIVER_TOP - 6} C 220 ${RIVER_TOP - 32}, 430 ${RIVER_TOP + 12}, 640 ${RIVER_TOP - 18} S 900 ${RIVER_TOP - 34}, 1020 ${RIVER_TOP - 12}`}
          stroke={C.highwayEdge}
          strokeWidth="19"
        />
        <path
          d={`M -20 ${RIVER_TOP - 6} C 220 ${RIVER_TOP - 32}, 430 ${RIVER_TOP + 12}, 640 ${RIVER_TOP - 18} S 900 ${RIVER_TOP - 34}, 1020 ${RIVER_TOP - 12}`}
          stroke={C.highway}
          strokeWidth="13"
        />
        <path
          d={`M -20 ${RIVER_BOTTOM + 14} C 220 ${RIVER_BOTTOM + 2}, 430 ${RIVER_BOTTOM + 28}, 640 ${RIVER_BOTTOM + 6} S 900 ${RIVER_BOTTOM + 22}, 1020 ${RIVER_BOTTOM + 10}`}
          stroke={C.highwayEdge}
          strokeWidth="19"
        />
        <path
          d={`M -20 ${RIVER_BOTTOM + 14} C 220 ${RIVER_BOTTOM + 2}, 430 ${RIVER_BOTTOM + 28}, 640 ${RIVER_BOTTOM + 6} S 900 ${RIVER_BOTTOM + 22}, 1020 ${RIVER_BOTTOM + 10}`}
          stroke={C.highway}
          strokeWidth="13"
        />
      </g>

      {/* 교량 (세로 간선이 하천을 건너는 구간) */}
      <g>
        {[HX[1], HX[3]].map((x) => (
          <g key={`br${x}`}>
            <rect
              x={x - 13}
              y={RIVER_TOP - 14}
              width="26"
              height={RIVER_BOTTOM - RIVER_TOP + 28}
              fill={C.road}
              stroke={C.casing}
              strokeWidth="2.5"
            />
            <line
              x1={x}
              y1={RIVER_TOP - 14}
              x2={x}
              y2={RIVER_BOTTOM + 14}
              stroke={C.casing}
              strokeWidth="1.5"
              strokeDasharray="7 7"
            />
          </g>
        ))}
      </g>

      {/* ---- 지하철 노선 ---- */}
      <g fill="none" strokeLinecap="round">
        {/* 2호선 */}
        <path
          d="M -20 300 C 180 292, 330 236, 520 232 C 700 228, 860 268, 1020 244"
          stroke={C.line2}
          strokeWidth="5"
          opacity="0.85"
        />
        {/* 3호선 */}
        <path
          d="M 120 -20 C 150 140, 250 300, 420 420 C 560 518, 700 620, 780 720"
          stroke={C.line3}
          strokeWidth="5"
          opacity="0.85"
        />
      </g>
      {/* 역 */}
      <g>
        {[
          { x: 235, y: 296, c: C.line2 },
          { x: 520, y: 232, c: C.line2 },
          { x: 785, y: 252, c: C.line2 },
          { x: 168, y: 190, c: C.line3 },
          { x: 330, y: 344, c: C.line3 },
          { x: 610, y: 566, c: C.line3 },
        ].map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r="6"
            fill="#FFFFFF"
            stroke={s.c}
            strokeWidth="3.5"
          />
        ))}
      </g>

      {/* ---- 라벨 ---- */}
      <g
        fill={C.label}
        fontSize="17"
        fontWeight="600"
        textAnchor="middle"
        style={{ fontFamily: "inherit" }}
      >
        <text x={640} y={RIVER_TOP + 74} fill="#7FA8C0" fontSize="19">
          한강
        </text>
      </g>
      <g
        fill="#8FA877"
        fontSize="15"
        fontWeight="600"
        textAnchor="middle"
        style={{ fontFamily: "inherit" }}
      >
        <text x={70} y={330}>
          근린공원
        </text>
        <text x={935} y={185}>
          체육공원
        </text>
      </g>
      {/* 도로명 */}
      <g
        fill={C.roadLabel}
        fontSize="12.5"
        fontWeight="600"
        textAnchor="middle"
        style={{ fontFamily: "inherit" }}
      >
        <text x={520} y={105}>
          한강대로
        </text>
        <text x={200} y={245}>
          중앙로
        </text>
        <text x={760} y={395}>
          도산대로
        </text>
        <text x={330} y={514} >
          강변북로
        </text>
        <text
          x={140}
          y={430}
          transform="rotate(-90 140 430)"
        >
          동서로
        </text>
        <text
          x={700}
          y={180}
          transform="rotate(-90 700 180)"
        >
          왕십리로
        </text>
      </g>
    </svg>
  );
}
