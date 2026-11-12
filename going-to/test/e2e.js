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
  window.__fakeAlts = ["I'm going to fly a kite"];
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

  const badge = () => page.textContent("#plan-count");
  check("처음 배지 0/5", (await badge()) === "0/5");
  check("카드 60장", (await page.locator("#tab-easy .card").count()) === 60);
  const brokenImgs = await page.$$eval("#tab-easy .card img", (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).length);
  check("그림 깨짐 0", brokenImgs === 0, brokenImgs);
  check("말풍선 빈칸", (await page.textContent("#tab-easy .a-en")).includes("I'm going to"));

  // 카드 선택 → 말풍선·배지
  await page.click('#tab-easy .card[data-id="fly-kite"] .pick-btn');
  check("선택 후 배지 1/5", (await badge()) === "1/5");
  check("말풍선에 대답", (await page.textContent("#tab-easy .a-en")) === "I'm going to fly a kite.");
  check("Q1 버튼 ✓ 표시", (await page.textContent('#tab-easy .q-btn[data-i="0"]')).includes("✓"));
  check("버튼 문구 바뀜", (await page.textContent('#tab-easy .card[data-id="fly-kite"] .pick-btn')).includes("계획이에요"));

  // 다시 누르면 빠짐
  await page.click('#tab-easy .card[data-id="fly-kite"] .pick-btn');
  check("다시 누르면 빠짐 0/5", (await badge()) === "0/5");
  await page.click('#tab-easy .card[data-id="fly-kite"] .pick-btn');
  // 같은 질문에 다른 카드 → 바뀜
  await page.click('#tab-easy .card[data-id="play-soccer"] .pick-btn');
  check("질문당 계획 1개(바뀜)", (await badge()) === "1/5" && (await page.textContent("#tab-easy .a-en")).includes("play soccer"));
  await page.click('#tab-easy .card[data-id="fly-kite"] .pick-btn');

  // 다음 질문 ▶
  await page.click("#tab-easy .next-q");
  check("Q1 버튼 글자 그대로", (await page.textContent('#tab-easy .q-btn[data-i="0"]')).includes("this afternoon"));
  check("다음 질문 → Q2", (await page.textContent("#tab-easy .dq-en")).includes("tonight"));

  // 중급 탭에서 Q2 선택 → 공유
  await page.click('.tab-btn[data-tab="mid"]');
  check("중급 탭 표시", await page.isVisible("#tab-mid .card"));
  check("중급 탭에도 Q1 ✓", (await page.textContent('#tab-mid .q-btn[data-i="0"]')).includes("✓"));
  check("중급 문장 길게", (await page.textContent('#tab-mid .card[data-id="fly-kite"] .sent')).includes("on the hill"));
  await page.click('#tab-mid .card[data-id="watch-movie"] .pick-btn');
  check("중급 선택 → 2/5", (await badge()) === "2/5");
  await page.click('.tab-btn[data-tab="easy"]');
  check("초급 탭 Q2 ✓ (공유)", (await page.textContent('#tab-easy .q-btn[data-i="1"]')).includes("✓"));
  check("초급 말풍선에 중급 대답", (await page.textContent("#tab-easy .a-en")).includes("with my family at home"));

  // 필터
  const count = () => page.locator("#tab-easy .card").count();
  await page.click('#tab-easy .chip[data-f="book"]');
  check("📘 교과서 6장", (await count()) === 6, await count());
  await page.click('#tab-easy .chip[data-f="places"]');
  check("📍 장소 12장", (await count()) === 12);
  await page.click('#tab-easy .chip[data-f="rec"]');
  const recN = await count(), recTags = await page.locator("#tab-easy .card .tag.rec").count();
  check("⭐ 추천만 (모두 ⭐)", recN > 0 && recN === recTags, recN);
  check("⭐ 필터 이름에 지금 질문", (await page.textContent('#tab-easy .chip[data-f="rec"]')).includes("오늘 밤"));
  await page.click('#tab-easy .chip[data-f="all"]');
  check("전체 60장", (await count()) === 60);

  // 단어 뜻 풍선
  await page.click('#tab-easy .card[data-id="fly-kite"] .w[data-w="kite."]');
  check("단어 뜻 풍선", (await page.textContent("#word-popup")).includes("연") && await page.isVisible("#word-popup"));
  await page.screenshot({ path: path.join(OUT, "desktop-easy.png") });
  await page.click('.tab-btn[data-tab="mid"]');
  await page.screenshot({ path: path.join(OUT, "desktop-mid.png") });

  // 연습하기로 가기
  await page.click("#tab-mid .go-practice");
  check("연습하기 탭 이동", await page.isVisible("#plan-list"));
  check("계획표 5줄", (await page.locator(".plan-row").count()) === 5);
  check("채워진 줄 2개", (await page.locator(".plan-row[data-q]").count()) === 2);
  check("빈 줄 안내", (await page.textContent(".plan-row.empty")).includes("활동 카드에서 골라요"));

  // 말하기 (가짜 인식: 정확)
  const row1 = page.locator('.plan-row[data-q="afternoon"]');
  await row1.locator(".mic").click();
  await row1.locator(".score-line").waitFor({ timeout: 8000 });
  check("실시간 들리는 말", (await page.evaluate(() => window.__sawInterim)).includes("👂 들리는 말: I'm going to"), await page.evaluate(() => window.__sawInterim));
  check("정확 → 100%", (await row1.locator(".score-line").textContent()).includes("100%"));
  check("⭐ 표시", (await row1.locator(".score-line").textContent()).includes("⭐"));
  check("기록 1회", (await row1.locator(".stat-line").textContent()).includes("1회"));
  await page.waitForFunction(() => !document.querySelector('.plan-row[data-q="afternoon"] .play-me').disabled, null, { timeout: 5000 }).catch(() => {});
  check("▶ 내 목소리 활성", !(await row1.locator(".play-me").isDisabled()));
  const played = await page.evaluate(async () => {
    let ok = false; const orig = Audio.prototype.play;
    Audio.prototype.play = function () { ok = !!this.src && this.src.startsWith("blob:"); return Promise.resolve(); };
    document.querySelector('.plan-row[data-q="afternoon"] .play-me').click();
    Audio.prototype.play = orig; return ok;
  });
  check("녹음 재생(blob)", played);

  // 말하기 (fly a cat)
  await page.evaluate(() => { window.__fakeAlts = ["I'm going to fly a cat", "I'm going to fly a cut"]; });
  await row1.locator(".mic").click();
  await page.waitForFunction(() => document.querySelector('.plan-row[data-q="afternoon"] .stat-line').textContent.includes("2회"), null, { timeout: 8000 });
  const line2 = await row1.locator(".score-line").textContent();
  check("fly a cat → 73%", line2.includes("73%"), line2.trim());
  check("🟥 kite 칩", (await row1.locator(".wchip.miss").allTextContents()).some((t) => t.includes("kite")));
  check("다시 들어 볼 단어 버튼", (await row1.locator(".retry").textContent()).includes("kite"));
  check("컴퓨터가 들은 말", (await row1.locator(".heard").textContent()).includes("fly a cat"));
  const st = await row1.locator(".stat-line").textContent();
  check("이번·평균·최고·횟수", st.includes("이번 73%") && st.includes("평균 87%") && st.includes("최고 100%") && st.includes("2회"), st);
  check("요약 총 2회", (await page.textContent("#sum-total")) === "2");
  check("요약 평균 87%", (await page.textContent("#sum-avg")) === "87%");
  check("요약 1/5", (await page.textContent("#sum-done")) === "1/5");

  // 새로고침 후 기록 유지
  await page.reload(); await page.click('.tab-btn[data-tab="practice"]');
  check("새로고침 후 기록 유지", (await page.locator('.plan-row[data-q="afternoon"] .stat-line').textContent()).includes("2회"));
  check("새로고침 후 계획 유지", (await badge()) === "2/5");
  await page.screenshot({ path: path.join(OUT, "desktop-practice.png"), fullPage: true });

  // 인쇄
  await page.click("#btn-print");
  check("인쇄 버튼 → print()", (await page.evaluate(() => window.__printed)) === 1);
  await page.emulateMedia({ media: "print" });
  check("인쇄: 마이크 도구 숨김", !(await page.isVisible(".speak-tool")));
  check("인쇄: 탭·버튼 숨김", !(await page.isVisible(".tabs")) && !(await page.isVisible("#btn-print")));
  check("인쇄: 계획표 보임", await page.isVisible("#plan-list"));
  await page.pdf({ path: path.join(OUT, "print.pdf") }).catch(() => {});
  await page.emulateMedia({ media: "screen" });

  // ✕ 빼기
  await page.click('.plan-row[data-q="tonight"] .remove');
  check("✕ 빼기 → 1/5", (await badge()) === "1/5" && (await page.locator(".plan-row[data-q]").count()) === 1);

  // 기록 지우기
  await page.click("#btn-clear");
  check("기록 지우기", (await page.textContent("#sum-total")) === "0" && (await page.locator('.plan-row[data-q="afternoon"] .play-me').isDisabled()));

  check("콘솔 오류 0", errors.length === 0, errors.join(" | "));

  // ---------- 휴대폰 390px ----------
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ["microphone"] });
  await stubFonts(m); await m.addInitScript(FAKE_SR);
  const mp = await m.newPage();
  const merr = [];
  mp.on("pageerror", (e) => merr.push(String(e)));
  await mp.goto(url); await mp.waitForLoadState("networkidle");
  await mp.click('#tab-easy .card[data-id="fly-kite"] .pick-btn');
  await mp.click('#tab-easy .q-btn[data-i="3"]');
  await mp.click('#tab-easy .card[data-id="pick-apples"] .pick-btn');
  for (const t of ["easy", "mid", "practice"]) {
    await mp.click(`.tab-btn[data-tab="${t}"]`);
    const sw = await mp.evaluate(() => document.documentElement.scrollWidth);
    check(`390px 가로 스크롤 없음 (${t})`, sw <= 390, sw);
  }
  const tabH = await mp.$$eval(".tab-btn", (bs) => bs.map((b) => b.getBoundingClientRect().height));
  check("휴대폰 탭 한 줄·짧은 이름", tabH.every((h) => h < 48) && (await mp.textContent(".tab-btn[data-tab=easy]")).includes("초급 카드"), tabH.join(","));
  await mp.click('.tab-btn[data-tab="easy"]');
  await mp.screenshot({ path: path.join(OUT, "mobile-easy.png") });
  await mp.evaluate(() => window.scrollTo(0, 900));
  await mp.screenshot({ path: path.join(OUT, "mobile-easy-cards.png") });
  await mp.click('.tab-btn[data-tab="practice"]');
  await mp.locator('.plan-row[data-q="afternoon"] .mic').click();
  await mp.locator('.plan-row[data-q="afternoon"] .score-line').waitFor({ timeout: 8000 });
  await mp.screenshot({ path: path.join(OUT, "mobile-practice.png"), fullPage: true });
  check("휴대폰 콘솔 오류 0", merr.length === 0, merr.join(" | "));

  // ---------- 음성 인식 없는 브라우저 → 4초 녹음만 ----------
  const n = await browser.newContext({ viewport: { width: 1000, height: 800 }, permissions: ["microphone"] });
  await stubFonts(n); await n.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
    Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined }); });
  const np = await n.newPage();
  await np.goto(url);
  await np.click('#tab-easy .card[data-id="study-math"] .pick-btn');
  await np.click('.tab-btn[data-tab="practice"]');
  check("인식 없음 안내", (await np.textContent("#mic-support")).includes("4초 녹음"));
  const t0 = Date.now();
  await np.locator(".plan-row[data-q] .mic").click();
  await np.locator(".plan-row[data-q] .feedback").waitFor({ timeout: 9000 });
  check("4초 녹음 후 안내", (await np.textContent(".plan-row[data-q] .feedback")).includes("녹음했어요"), (Date.now() - t0) + "ms");
  check("녹음 재생 버튼 활성", !(await np.locator(".plan-row[data-q] .play-me").isDisabled()));

  // ---------- 둘 다 없으면 비활성 ----------
  const z = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await stubFonts(z); await z.addInitScript(() => { Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined });
    Object.defineProperty(window, "SpeechRecognition", { value: undefined }); Object.defineProperty(window, "MediaRecorder", { value: undefined }); });
  const zp = await z.newPage();
  await zp.goto(url);
  await zp.click('#tab-easy .card[data-id="study-math"] .pick-btn');
  await zp.click('.tab-btn[data-tab="practice"]');
  check("둘 다 없으면 버튼 비활성 + Chrome 권장", (await zp.locator(".plan-row[data-q] .mic").isDisabled()) && (await zp.textContent(".plan-row[data-q] .stat-line")).includes("Chrome 권장"));

  // ---------- 그림 없을 때 이모지 타일 ----------
  const e = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await stubFonts(e); await e.route("**/images/fly-kite.png", (r) => r.abort());
  const ep = await e.newPage();
  await ep.goto(url); await ep.waitForLoadState("networkidle");
  check("그림 못 불러오면 이모지 타일", await ep.isVisible('.card[data-id="fly-kite"] .pic.fallback .emoji-tile'));

  await browser.close(); server.close();
  console.log(failures ? `\n❌ 실패 ${failures}개` : "\n🎉 브라우저 테스트 모두 통과");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
