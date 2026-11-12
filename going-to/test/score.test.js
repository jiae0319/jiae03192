// 채점 함수 단위 테스트:  node test/score.test.js
const S = require("../score.js");
const T = "I'm going to fly a kite.";
let fail = 0;
function near(name, got, want, tol) {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) fail++;
  console.log(`${ok ? "✅" : "❌"} ${name}: ${got} (기대 ${want}±${tol})`);
}
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? "✅" : "❌"} ${name}: ${JSON.stringify(got)}`);
}
near("정확", S.scoreOne(T, "I'm going to fly a kite").score, 100, 0);
near("I am 풀어 말하기", S.scoreOne(T, "I am going to fly a kite").score, 100, 0);
near("fly a cat", S.scoreOne(T, "I'm going to fly a cat").score, 73, 2);
near("fly a kite만", S.scoreOne(T, "fly a kite").score, 55, 2);
near("순서 뒤섞임", S.scoreOne(T, "kite a fly to going am I").score, 14, 3);
near("too → to", S.scoreOne(T, "I'm going too fly a kite").score, 100, 0);
near("덧붙인 말 감점", S.scoreOne(T, "um I'm going to fly a kite yes").score, 94, 0);
near("덧붙인 말 최대 10%", S.scoreOne(T, "oh well um so I'm going to fly a kite yes ok").score, 90, 0);
near("소리 비슷 (f/p, l/r): fly→pry", S.scoreOne(T, "I'm going to pry a kite").score, 93, 0);
eq("철자 1글자 차이 0.85", S.wordSim("play", "pray"), 0.85);
eq("소리 비슷 0.7", S.wordSim("fly", "pry"), 0.7);
near("후보 중 최고", S.scoreBest(T, ["I'm going to fly a cat", "I'm going to fly a kite"]).score, 100, 0);
near("PC 붙이기", S.scoreOne("I'm going to go to a PC room.", "I'm going to go to a p c room").score, 100, 0);
near("지명 가중치 0.6", S.scoreOne("I'm going to visit Gyeongju.", "I'm going to visit").score,
  Math.round((0.3 + 0.3 + 1 + 0.3 + 1) / (0.3 + 0.3 + 1 + 0.3 + 1 + 0.6) * 100), 0);
eq("kite≠cat", S.wordSim("kite", "cat"), 0);
eq("normalize", S.normalize("I'm gonna fly a kite, too!"), ["i", "am", "going", "to", "fly", "a", "kite", "to"]);
eq("칩 (I'm 한 칩)", S.scoreOne(T, "going to fly a cat").chips.map(c => c.text + ":" + c.status),
  ["I'm:miss", "going:ok", "to:ok", "fly:ok", "a:ok", "kite:miss"]);
eq("등급", [S.grade(90).icon, S.grade(70).icon, S.grade(30).icon], ["⭐", "👍", "🔁"]);
console.log(fail ? `\n❌ 실패 ${fail}개` : "\n🎉 모두 통과");
process.exit(fail ? 1 : 0);
