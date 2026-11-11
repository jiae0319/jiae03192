// 데이터 점검:  node test/check-data.js
// - 활동 60개(종류별 12개), id 중복 없음, 교과서 표현 포함·종류 안에서 맨 앞
// - 모든 문장(초급·중급·질문)의 단어가 사전에 있음
// - 모든 id에 images/<id>.png 있음
const fs = require("fs"), path = require("path");
const D = require("../data.js");
let fail = 0;
const bad = (m) => { fail++; console.log("❌ " + m); };
const ids = D.ACTIVITIES.map((a) => a.id);
if (ids.length !== 60) bad("활동 수 " + ids.length);
if (new Set(ids).size !== ids.length) bad("id 중복");
for (const c of D.CATEGORIES) {
  const list = D.ACTIVITIES.filter((a) => a.cat === c.id);
  if (list.length !== 12) bad(`${c.ko} ${list.length}개`);
  const firstNonBook = list.findIndex((a) => !a.book);
  if (list.slice(firstNonBook).some((a) => a.book)) bad(`${c.ko}: 교과서 표현이 맨 앞이 아님`);
}
const BOOK = ["stay home", "watch a baseball game", "go camping", "clean my room", "study math", "visit my grandparents"];
for (const b of BOOK) if (!D.ACTIVITIES.some((a) => a.book && a.en === b)) bad("교과서 표현 누락: " + b);
const qids = D.QUESTIONS.map((q) => q.id);
for (const a of D.ACTIVITIES) {
  if (!a.when.length || a.when.some((w) => !qids.includes(w))) bad(a.id + " when 오류");
  if (!a.mid || !a.mid.en || !a.mid.ko) bad(a.id + " mid 없음");
}
const sentences = [];
D.QUESTIONS.forEach((q) => sentences.push(`What are you going to do ${q.en}?`));
D.ACTIVITIES.forEach((a) => { sentences.push(`I'm going to ${a.en}.`); sentences.push(`I'm going to ${a.mid.en}.`); });
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
