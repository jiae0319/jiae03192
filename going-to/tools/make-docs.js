// CANVA_IMAGES.md 와 README 활동 표를 data.js / tools/scenes.js 에서 만듭니다:  node tools/make-docs.js
const fs = require("fs"), path = require("path");
const D = require("../data.js"), SCENES = require("./scenes.js");
const ROOT = path.join(__dirname, "..");
const media = {};
fs.readFileSync(path.join(__dirname, "media-ids.txt"), "utf8").trim().split("\n").forEach((l) => { const [id, m] = l.split(" "); media[id] = m; });
const prompt = (id) => `Cute flat vector illustration for an elementary school English flashcard: ${SCENES[id]}. Warm autumn colors, simple clean shapes, white background, no text, no letters.`;
let md = `# 🎨 Canva 그림 목록\n\n활동 60개의 그림은 모두 **Canva generate-image**(가로 4:3, \`LANDSCAPE_4_3\`)로 만들었습니다.\n같은 그림체가 되도록 모든 프롬프트에 아래 틀을 썼습니다.\n\n> Cute flat vector illustration for an elementary school English flashcard: **[장면]**. Warm autumn colors, simple clean shapes, white background, no text, no letters.\n\n앱에는 Canva 미리보기 크기(약 200×150)로 들어 있습니다. 더 선명하게 바꾸려면 Canva의 **업로드 항목**에서 아래 미디어 ID의 원본을 PNG로 내려받아 같은 파일명으로 덮어쓰세요.\n`;
for (const c of D.CATEGORIES) {
  md += `\n## ${c.emoji} ${c.ko}\n\n| 파일 | 활동 | Canva 미디어 ID | 장면 |\n|---|---|---|---|\n`;
  D.ACTIVITIES.filter((a) => a.cat === c.id).forEach((a) => { md += `| \`images/${a.id}.png\` | ${a.en}${a.book ? " 📘" : ""} | ${media[a.id] || "-"} | ${SCENES[a.id]} |\n`; });
}
fs.writeFileSync(path.join(ROOT, "CANVA_IMAGES.md"), md);
let tbl = "";
for (const c of D.CATEGORIES) {
  tbl += `\n**${c.emoji} ${c.ko}**\n\n| 초급 | 중급 | 뜻 |\n|---|---|---|\n`;
  D.ACTIVITIES.filter((a) => a.cat === c.id).forEach((a) => { tbl += `| ${a.book ? "📘 " : ""}${a.en} | ${a.mid.en} | ${a.ko} |\n`; });
}
const rp = path.join(ROOT, "README.md");
const r = fs.readFileSync(rp, "utf8").replace(/<!-- ACTIVITIES -->[\s\S]*<!-- \/ACTIVITIES -->/, `<!-- ACTIVITIES -->\n${tbl}\n<!-- /ACTIVITIES -->`);
fs.writeFileSync(rp, r);
console.log("CANVA_IMAGES.md · README 활동 표 갱신");
module.exports = { prompt };
