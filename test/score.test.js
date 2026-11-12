// 채점 함수 단위 테스트:  node test/score.test.js
const S = require("../score.js");
const Q = "How much are these socks?";
const A = "They are 2,000 won.";
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
// 숫자 말
eq("numberWords 2000", S.numberWords(2000), "two thousand");
eq("numberWords 10000", S.numberWords(10000), "ten thousand");
eq("numberWords 2500", S.numberWords(2500), "two thousand five hundred");
eq("2,000 → n2000", S.normalize("They are 2,000 won."), ["they", "are", "n2000", "won"]);
eq("two thousand → n2000", S.normalize("they're two thousand won"), ["they", "are", "n2000", "won"]);
eq("thousand 뒤 one → won", S.normalize("one thousand one"), ["n1000", "won"]);
eq("₩ 기호", S.normalize("₩7,000"), ["n7000", "won"]);
eq("원 글자", S.normalize("7000원"), ["n7000", "won"]);
eq("thousand 없는 two는 to", S.normalize("going two fly"), ["going", "to", "fly"]);
// 대답 채점
near("대답 정확 (숫자)", S.scoreOne(A, "they are 2000 won").score, 100, 0);
near("대답 정확 (말)", S.scoreOne(A, "they are two thousand won").score, 100, 0);
near("대답 They're", S.scoreOne(A, "they're 2,000 won").score, 100, 0);
near("won이 one으로 들림", S.scoreOne(A, "they are two thousand one").score, 100, 0);
near("가격 틀림 → 🔁", S.scoreOne(A, "they are 3000 won").score, 50, 2);
eq("가격 틀림 칩", S.scoreOne(A, "they are 3000 won").chips.map((c) => c.text + ":" + c.status), ["They:ok", "are:ok", "2,000:miss", "won:ok"]);
near("10,000원", S.scoreOne("They are 10,000 won.", "they are ten thousand won").score, 100, 0);
near("1,000원 (one thousand one)", S.scoreOne("They are 1,000 won.", "they are one thousand one").score, 100, 0);
// 질문 채점
near("질문 정확", S.scoreOne(Q, "how much are these socks").score, 100, 0);
near("Yes, please. 붙여 말함 (덧붙임 감점)", S.scoreOne(Q, "yes please how much are these socks").score, 94, 0);
near("these 빠짐", S.scoreOne(Q, "how much are socks").score, 79, 3);
near("인사", S.scoreOne("May I help you?", "may i help you").score, 100, 0);
near("Yes, please.", S.scoreOne("Yes, please.", "yes please").score, 100, 0);
near("후보 중 최고", S.scoreBest(A, ["they are 3000 won", "they are 2000 won"]).score, 100, 0);
eq("등급", [S.grade(90).icon, S.grade(70).icon, S.grade(30).icon], ["⭐", "👍", "🔁"]);
console.log(fail ? `\n❌ 실패 ${fail}개` : "\n🎉 모두 통과");
process.exit(fail ? 1 : 0);
