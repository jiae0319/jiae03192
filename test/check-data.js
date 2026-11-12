// 데이터 점검:  node test/check-data.js
// - 가격 10가지(1,000 ~ 10,000원, 천 원 단위) · 물건 20개(종류별 5개) · id 중복 없음
// - 교과서 표현(socks, 2,000원) 포함 · 처음 가격이 모두 가격표 안에 있고 10가지 가격이 모두 쓰임
// - 모든 문장(초급·중급 질문, 대답, 인사)의 단어가 사전에 있음 · 모든 id에 images/<id>.png 있음
const fs = require("fs"), path = require("path");
const D = require("../data.js");
let fail = 0;
const bad = (m) => { fail++; console.log("❌ " + m); };
const wons = D.PRICES.map((p) => p.won);
if (JSON.stringify(wons) !== JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => n * 1000))) bad("가격표가 1,000~10,000원 10가지가 아님");
const ids = D.ITEMS.map((a) => a.id);
if (ids.length !== 20) bad("물건 수 " + ids.length);
if (new Set(ids).size !== ids.length) bad("id 중복");
for (const c of D.CATEGORIES) {
  const n = D.ITEMS.filter((a) => a.cat === c.id).length;
  if (n !== 5) bad(`${c.ko} ${n}개`);
}
const socks = D.ITEMS.find((a) => a.en === "socks");
if (!socks || !socks.book || socks.price !== 2000) bad("교과서 표현(socks · 2,000원) 누락");
for (const a of D.ITEMS) {
  if (!wons.includes(a.price)) bad(a.id + " 가격이 가격표에 없음: " + a.price);
  if (!a.mid || !a.mid.en || !a.mid.ko) bad(a.id + " mid 없음");
  if (!D.CATEGORIES.some((c) => c.id === a.cat)) bad(a.id + " 종류 오류");
}
const unused = wons.filter((w) => !D.ITEMS.some((a) => a.price === w));
if (unused.length) bad("처음 가격으로 안 쓰인 가격: " + unused.join(", "));
const fmt = (w) => w.toLocaleString("en-US");
const sentences = [D.DIALOG.greet.en, D.DIALOG.yes.en];
D.PRICES.forEach((p) => sentences.push(`They are ${fmt(p.won)} won.`, `${p.en} won`));
D.ITEMS.forEach((a) => sentences.push(`How much are these ${a.en}?`, `How much are these ${a.mid.en}?`));
const missing = new Set();
for (const s of sentences) {
  for (const w of s.split(/\s+/)) {
    const k = w.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
    if (k && !D.DICT[k]) missing.add(k);
  }
}
if (missing.size) bad("사전 누락: " + [...missing].join(", "));
const noImg = ids.filter((id) => !fs.existsSync(path.join(__dirname, "..", "images", id + ".png")));
if (noImg.length) bad("그림 누락: " + noImg.join(", "));
console.log(`문장 ${sentences.length}개 · 사전 단어 ${Object.keys(D.DICT).length}개 · 그림 ${ids.length - noImg.length}/${ids.length}`);
console.log(fail ? `❌ 문제 ${fail}개` : "🎉 데이터 점검 통과 (사전 누락 0 · 그림 누락 0)");
process.exit(fail ? 1 : 0);
