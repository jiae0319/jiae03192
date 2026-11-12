// 브라우저 테스트(Playwright · 크로미움):  node test/e2e.js
// 가짜 마이크 + 가짜 SpeechRecognition 으로 말하기 채점까지 확인하고 스크린샷을 남깁니다.
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const OUT = process.env.SHOT_DIR || path.join(ROOT, "test", "screenshots");
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});

// 외부 글꼴 CDN은 테스트 환경에서 막혀 있을 수 있어 빈 CSS로 대신합니다.
async function stubFonts(ctx) { await ctx.route(/hangeul\.pstatic\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" })); }

const FAKE_SR = `
  window.__fakeAlts = ["how much are these socks"];
  class FakeSR {
    constructor() { this.lang = ""; this.interimResults = false; this.maxAlternatives = 1; }
    start() {
      const alts = window.__fakeAlts.slice();
      const mk = (texts, isFinal) => { const r = texts.map((t) => ({ transcript: t, confidence: 0.9 })); r.isFinal = isFinal; return r; };
      setTimeout(() => this.onresult && this.onresult({ resultIndex: 0, results: [mk([alts[0].split(" ").slice(0, 3).join(" ")], false)] }), 200);
      setTimeout(() => { window.__sawInterim = document.querySelector(".live:not(.hidden)")?.textContent || ""; }, 350);
      setTimeout(() => this.onresult && this.onresult({ resultIndex: 0, results: [mk(alts, true)] }), 600);
      setTimeout(() => this.onend && this.onend(), 900);
    }
    stop() {} abort() {}
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.__printed = 0; window.print = () => { window.__printed++; };
`;

let failures = 0;
function check(name, ok, extra) { if (!ok) failures++; console.log(`${ok ? "✅" : "❌"} ${name}${extra !== undefined ? " — " + extra : ""}`); }

(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/index.html`;
  const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });

  // ---------- 데스크톱 ----------
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, permissions: ["microphone"] });
  await stubFonts(ctx); await ctx.addInitScript(FAKE_SR);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("dialog", (d) => d.accept());
  await page.goto(url);
  await page.waitForLoadState("networkidle");

  const badge = () => page.textContent("#cart-count");
  check("처음 배지 0/5", (await badge()) === "0/5");
  check("카드 20장", (await page.locator("#tab-easy .card").count()) === 20);
  const brokenImgs = await page.$$eval("#tab-easy .card img", (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).length);
  check("그림 깨짐 0", brokenImgs === 0, brokenImgs);
  check("처음 대화: 인사", (await page.textContent("#tab-easy .d-greet")).includes("May I help you?"));
  check("처음 대화: 질문", (await page.innerText("#tab-easy .d-q")).replace(/\s+/g, " ").includes("Yes, please. How much are these socks?"));
  check("처음 대화: 대답 2,000 won", (await page.textContent("#tab-easy .d-a")) === "They are 2,000 won.");
  check("대화 한국어", (await page.textContent("#tab-easy .d-q-ko")).includes("이 양말은 얼마예요?"));
  check("가격 칩 10개", (await page.locator("#tab-easy .price-chips .price-chip").count()) === 10);
  check("가격 칩 2,000 선택됨", (await page.textContent("#tab-easy .price-chip.on")).includes("2,000원"));
  check("가격표 그림", (await page.textContent("#tab-easy .shop-item .price-tag")) === "2,000원");

  // 가격 바꾸기
  await page.click('#tab-easy .price-chip[data-won="5000"]');
  check("가격 바꾸면 대답 바뀜", (await page.textContent("#tab-easy .d-a")) === "They are 5,000 won.");
  check("카드 대답도 바뀜", (await page.textContent('#tab-easy .card[data-id="socks"] .sent.ans')).includes("5,000"));
  check("처음 가격 버튼", await page.isVisible("#tab-easy .reset-price"));
  await page.click("#tab-easy .reset-price");
  check("처음 가격으로", (await page.textContent("#tab-easy .d-a")) === "They are 2,000 won.");

  // 물어보기 → 대화 바뀜
  await page.click('#tab-easy .card[data-id="gloves"] .talk-btn');
  check("물어보기 → 대화에 장갑", (await page.textContent("#tab-easy .d-q")).includes("these gloves") && (await page.textContent("#tab-easy .d-a")).includes("5,000"));
  check("한국어 받침 (장갑은)", (await page.textContent("#tab-easy .d-q-ko")).includes("이 장갑은 얼마예요?"));

  // 담기
  await page.click('#tab-easy .card[data-id="socks"] .pick-btn');
  check("담기 → 1/5", (await badge()) === "1/5");
  check("버튼 문구 바뀜", (await page.textContent('#tab-easy .card[data-id="socks"] .pick-btn')).includes("담았어요"));
  await page.click('#tab-easy .card[data-id="socks"] .pick-btn');
  check("다시 누르면 빠짐 0/5", (await badge()) === "0/5");
  for (const id of ["socks", "sneakers", "hairpins"]) await page.click(`#tab-easy .card[data-id="${id}"] .pick-btn`);
  check("3개 담기 3/5", (await badge()) === "3/5");

  // 중급
  await page.click('.tab-btn[data-tab="mid"]');
  check("중급 문장", (await page.textContent('#tab-mid .card[data-id="socks"] .sent')).includes("these striped socks"));
  check("중급 한국어", (await page.textContent('#tab-mid .card[data-id="rain-boots"] .ko')).includes("이 노란 장화는 얼마예요?"));
  await page.click('#tab-mid .card[data-id="crayons"] .pick-btn');
  await page.click('#tab-mid .card[data-id="earmuffs"] .pick-btn');
  check("중급 담기 → 5/5", (await badge()) === "5/5");
  await page.click('#tab-mid .card[data-id="markers"] .pick-btn');
  check("6개째는 가득 참 안내", (await badge()) === "5/5" && (await page.textContent("#tab-mid .status")).includes("가득"));
  await page.click('#tab-mid .card[data-id="socks"] .pick-btn');
  check("초급 담은 것 중급으로 바꾸기", (await badge()) === "5/5" && (await page.evaluate(() => window.__app.cart.find((c) => c.id === "socks").level)) === "mid");

  // 필터
  const count = () => page.locator("#tab-mid .card").count();
  await page.click('#tab-mid .chip[data-f="book"]');
  check("📘 교과서 1장", (await count()) === 1);
  await page.click('#tab-mid .chip[data-f="shoes"]');
  check("👟 신발 5장", (await count()) === 5);
  await page.click('#tab-mid .chip[data-f="cart"]');
  check("🛒 담은 것만 5장", (await count()) === 5);
  await page.click('#tab-mid .chip[data-f="all"]');

  // 단어 뜻 풍선
  await page.click('.tab-btn[data-tab="easy"]');
  await page.click('#tab-easy .card[data-id="socks"] .sent.ans .w[data-w="2,000"]');
  check("숫자 뜻 풍선", (await page.textContent("#word-popup")).includes("two thousand"));
  await page.click('#tab-easy .card[data-id="socks"] .w[data-w="these"]');
  check("these 뜻 풍선", (await page.textContent("#word-popup")).includes("이것들"));
  await page.screenshot({ path: path.join(OUT, "desktop-easy.png") });
  await page.click('.tab-btn[data-tab="mid"]');
  await page.screenshot({ path: path.join(OUT, "desktop-mid.png") });

  // 가격 익히기
  await page.click('.tab-btn[data-tab="price"]');
  check("가격 카드 10장", (await page.locator(".price-card").count()) === 10);
  check("10,000원 = ten thousand", (await page.textContent('.price-card[data-won="10000"]')).includes("ten thousand won"));
  const qwon = await page.evaluate(() => window.__app.quiz.won);
  check("퀴즈 빈칸", (await page.textContent("#quiz .line.ans")).includes("____"));
  const wrong = qwon === 1000 ? 2000 : 1000;
  await page.click(`#quiz .price-chip[data-won="${wrong}"]`);
  check("오답 → 정답 알려 줌", (await page.textContent("#quiz .quiz-msg")).includes("아쉬워요") && (await page.locator("#quiz .price-chip.right").count()) === 1);
  check("점수 0/1", (await page.textContent("#quiz .quiz-score")).includes("0") && (await page.textContent("#quiz .quiz-score")).includes("/ 1"));
  await page.click("#quiz .quiz-next");
  const qwon2 = await page.evaluate(() => window.__app.quiz.won);
  await page.click(`#quiz .price-chip[data-won="${qwon2}"]`);
  check("정답 → ⭕", (await page.textContent("#quiz .quiz-msg")).includes("정답"));
  check("점수 1/2", (await page.textContent("#quiz .quiz-score b")) === "1" && (await page.textContent("#quiz .quiz-score")).includes("/ 2"));
  await page.screenshot({ path: path.join(OUT, "desktop-price.png"), fullPage: true });

  // 연습하기
  await page.click('.tab-btn[data-tab="practice"]');
  check("쇼핑 목록 5줄", (await page.locator("#cart-list .plan-row[data-id]").count()) === 5);
  check("합계", (await page.textContent("#cart-total")).includes("원"));
  check("인사 도구 2개", (await page.locator("#greet-list .speak-tool").count()) === 2);
  check("요약 0/12", (await page.textContent("#sum-done")) === "0/12");

  const qTool = page.locator('#cart-list .plan-row[data-id="sneakers"] .speak-tool').first();
  await qTool.locator(".mic").click();
  await qTool.locator(".score-line").waitFor({ timeout: 8000 });
  check("실시간 들리는 말", (await page.evaluate(() => window.__sawInterim)).includes("👂 들리는 말: how much are"), await page.evaluate(() => window.__sawInterim));
  // sneakers 질문인데 socks로 말함
  const s1 = await qTool.locator(".score-line").textContent();
  check("socks ≠ sneakers → 감점", !s1.includes("100%"), s1.trim());

  const aTool = page.locator('#cart-list .plan-row[data-id="sneakers"] .speak-tool').nth(1);
  await page.evaluate(() => { window.__fakeAlts = ["they are 10000 won", "they are ten thousand one"]; });
  await aTool.locator(".mic").click();
  await aTool.locator(".score-line").waitFor({ timeout: 8000 });
  check("대답 10,000 won → 100%", (await aTool.locator(".score-line").textContent()).includes("100%"));
  await page.waitForFunction(() => !document.querySelectorAll('#cart-list .plan-row[data-id="sneakers"] .play-me')[1].disabled, null, { timeout: 5000 }).catch(() => {});
  check("▶ 내 목소리 활성", !(await aTool.locator(".play-me").isDisabled()));

  await page.evaluate(() => { window.__fakeAlts = ["they are 3000 won"]; });
  await aTool.locator(".mic").click();
  await page.waitForFunction(() => document.querySelectorAll('#cart-list .plan-row[data-id="sneakers"] .stat-line')[1].textContent.includes("2회"), null, { timeout: 8000 });
  check("가격 틀림 → 🟥 10,000", (await aTool.locator(".wchip.miss").allTextContents()).some((t) => t.includes("10,000")));
  check("가격 틀림 → 🔁", (await aTool.locator(".score-line").textContent()).includes("🔁"));
  check("요약 총 3회", (await page.textContent("#sum-total")) === "3");
  check("요약 2/12", (await page.textContent("#sum-done")) === "2/12");

  // 새로고침 후 유지
  await page.reload(); await page.click('.tab-btn[data-tab="practice"]');
  check("새로고침 후 장바구니 유지", (await badge()) === "5/5");
  check("새로고침 후 기록 유지", (await page.locator('#cart-list .plan-row[data-id="sneakers"] .stat-line').nth(1).textContent()).includes("2회"));
  await page.screenshot({ path: path.join(OUT, "desktop-practice.png"), fullPage: true });

  // 인쇄
  await page.click("#btn-print");
  check("인쇄 버튼 → print()", (await page.evaluate(() => window.__printed)) === 1);
  await page.emulateMedia({ media: "print" });
  check("인쇄: 마이크 도구 숨김", !(await page.isVisible(".speak-tool")));
  check("인쇄: 쇼핑 목록 보임", await page.isVisible("#cart-list"));
  await page.emulateMedia({ media: "screen" });

  // ✕ 빼기
  await page.click('#cart-list .plan-row[data-id="hairpins"] .remove');
  check("✕ 빼기 → 4/5", (await badge()) === "4/5" && (await page.locator("#cart-list .plan-row.empty").count()) === 1);
  await page.click("#btn-clear");
  check("기록 지우기", (await page.textContent("#sum-total")) === "0");
  check("콘솔 오류 0", errors.length === 0, errors.join(" | "));

  // ---------- 휴대폰 390px ----------
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ["microphone"] });
  await stubFonts(m); await m.addInitScript(FAKE_SR);
  const mp = await m.newPage();
  const merr = [];
  mp.on("pageerror", (e) => merr.push(String(e)));
  await mp.goto(url); await mp.waitForLoadState("networkidle");
  await mp.click('#tab-easy .card[data-id="socks"] .pick-btn');
  await mp.click('#tab-easy .card[data-id="colored-pencils"] .pick-btn');
  for (const t of ["easy", "mid", "price", "practice"]) {
    await mp.click(`.tab-btn[data-tab="${t}"]`);
    const sw = await mp.evaluate(() => document.documentElement.scrollWidth);
    check(`390px 가로 스크롤 없음 (${t})`, sw <= 390, sw);
  }
  const tabH = await mp.$$eval(".tab-btn", (bs) => bs.map((b) => b.getBoundingClientRect().height));
  check("휴대폰 탭 한 줄", tabH.every((h) => h < 48), tabH.join(","));
  await mp.click('.tab-btn[data-tab="easy"]');
  await mp.screenshot({ path: path.join(OUT, "mobile-easy.png") });
  await mp.evaluate(() => window.scrollTo(0, 1100));
  await mp.screenshot({ path: path.join(OUT, "mobile-easy-cards.png") });
  await mp.click('.tab-btn[data-tab="price"]');
  await mp.screenshot({ path: path.join(OUT, "mobile-price.png"), fullPage: true });
  await mp.click('.tab-btn[data-tab="practice"]');
  await mp.locator('#cart-list .plan-row[data-id="socks"] .mic').first().click();
  await mp.locator('#cart-list .plan-row[data-id="socks"] .score-line').first().waitFor({ timeout: 8000 });
  await mp.screenshot({ path: path.join(OUT, "mobile-practice.png"), fullPage: true });
  check("휴대폰 콘솔 오류 0", merr.length === 0, merr.join(" | "));

  // ---------- 음성 인식 없는 브라우저 → 4초 녹음만 ----------
  const n = await browser.newContext({ viewport: { width: 1000, height: 800 }, permissions: ["microphone"] });
  await stubFonts(n); await n.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
    Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined }); });
  const np = await n.newPage();
  await np.goto(url);
  await np.click('.tab-btn[data-tab="practice"]');
  check("인식 없음 안내", (await np.textContent("#mic-support")).includes("4초 녹음"));
  await np.locator("#greet-list .mic").first().click();
  await np.locator("#greet-list .feedback").waitFor({ timeout: 9000 });
  check("4초 녹음 후 안내", (await np.textContent("#greet-list .feedback")).includes("녹음했어요"));

  // ---------- 둘 다 없으면 비활성 ----------
  const z = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await stubFonts(z); await z.addInitScript(() => { Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined });
    Object.defineProperty(window, "SpeechRecognition", { value: undefined }); Object.defineProperty(window, "MediaRecorder", { value: undefined }); });
  const zp = await z.newPage();
  await zp.goto(url);
  await zp.click('.tab-btn[data-tab="practice"]');
  check("둘 다 없으면 버튼 비활성 + Chrome 권장", (await zp.locator("#greet-list .mic").first().isDisabled()) && (await zp.textContent("#greet-list .stat-line")).includes("Chrome 권장"));

  // ---------- 그림 없을 때 이모지 타일 ----------
  const e = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await stubFonts(e); await e.route("**/images/gloves.png", (r) => r.abort());
  const ep = await e.newPage();
  await ep.goto(url); await ep.waitForLoadState("networkidle");
  check("그림 못 불러오면 이모지 타일", await ep.isVisible('.card[data-id="gloves"] .pic.fallback .emoji-tile'));

  await browser.close(); server.close();
  console.log(failures ? `\n❌ 실패 ${failures}개` : "\n🎉 브라우저 테스트 모두 통과");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
