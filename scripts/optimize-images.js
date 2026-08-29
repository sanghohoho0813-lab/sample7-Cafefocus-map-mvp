/**
 * 카페 원본 사진을 웹용 WebP로 변환한다.
 *
 *   node scripts/optimize-images.js <원본디렉터리>
 *
 * 원본 파일명은 카페 id와 같아야 한다 (예: cafe-morrow.png).
 * 카페 id 목록은 lib/data/cafes.ts 의 SEEDS 를 참고.
 *
 * 출력:
 *   public/images/cafes/{id}.webp        1440x810 (16:9) — 상세 Hero
 *   public/images/cafes/{id}-card.webp    720x540 (4:3)  — 리스트/썸네일
 * 그리고 lib/data/cafes.ts 의 BLUR 맵에 붙여넣을 blur placeholder를 출력한다.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = process.argv[2];
if (!SRC) {
  console.error("사용법: node scripts/optimize-images.js <원본디렉터리>");
  process.exit(1);
}
const OUT = path.join(__dirname, "..", "public", "images", "cafes");

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs
    .readdirSync(SRC)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  const blur = {};

  for (const f of files) {
    const id = path.basename(f, path.extname(f));
    const src = path.join(SRC, f);

    await sharp(src)
      .resize(1440, 810, { fit: "cover", position: "centre" })
      .webp({ quality: 82, effort: 5 })
      .toFile(path.join(OUT, `${id}.webp`));

    await sharp(src)
      .resize(720, 540, { fit: "cover", position: "centre" })
      .webp({ quality: 80, effort: 5 })
      .toFile(path.join(OUT, `${id}-card.webp`));

    const buf = await sharp(src)
      .resize(12, 7, { fit: "cover" })
      .webp({ quality: 40 })
      .toBuffer();
    blur[id] = `data:image/webp;base64,${buf.toString("base64")}`;
    console.log(`ok ${id}`);
  }

  console.log("\n--- lib/data/cafes.ts 의 BLUR 맵에 붙여넣기 ---");
  Object.keys(blur)
    .sort()
    .forEach((k) => console.log(`  "${k}": "${blur[k]}",`));
})();
