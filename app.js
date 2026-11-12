// How much are these socks? — 앱 동작
(function () {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);
  const LS_CART = "howmuch.cart.v1";
  const LS_PRICES = "howmuch.prices.v1";
  const LS_STATS = "howmuch.stats.v1";
  const MAX_CART = 5;
  const RATE = 0.85;

  // ---------- 저장 ----------
  function load(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === "object" ? v : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 무시 */ } }

  const itemById = {};
  ITEMS.forEach((it) => (itemById[it.id] = it));
  const catById = {};
  CATEGORIES.forEach((c) => (catById[c.id] = c));
  const PRICE_SET = new Set(PRICES.map((p) => p.won));

  let cart = load(LS_CART, []);       // [{ id, level }]
  if (!Array.isArray(cart)) cart = [];
  cart = cart.filter((c) => c && itemById[c.id]).slice(0, MAX_CART);
  let prices = load(LS_PRICES, {});   // { id: won } — 내가 바꾼 가격
  let stats = load(LS_STATS, {});     // { sentence: { n, best, sum, last } }
  const recordings = {};              // { sentence: objectURL } — 새로고침하면 사라짐

  const state = { cur: "socks", filter: { easy: "all", mid: "all" }, tab: "easy" };

  // ---------- 문장 ----------
  const fmt = (won) => Number(won).toLocaleString("en-US");
  const priceOf = (it) => (PRICE_SET.has(prices[it.id]) ? prices[it.id] : it.price);
  const nameOf = (it, level) => (level === "mid" ? it.mid : it);
  // 받침 있으면 은, 없으면 는
  function eunNeun(word) {
    const ch = word.charCodeAt(word.length - 1);
    if (ch < 0xac00 || ch > 0xd7a3) return "는";
    return (ch - 0xac00) % 28 ? "은" : "는";
  }
  function question(it, level) {
    const n = nameOf(it, level);
    return { en: `How much are these ${n.en}?`, ko: `이 ${n.ko}${eunNeun(n.ko)} 얼마예요?` };
  }
  function answer(it) {
    const w = priceOf(it);
    return { en: `They are ${fmt(w)} won.`, ko: `${fmt(w)}원이에요.` };
  }
  const priceInfo = (won) => PRICES.find((p) => p.won === won);
  const inCart = (id) => cart.find((c) => c.id === id);

  // ---------- 음성 ----------
  let voice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /en-US/i.test(v.lang) && /Google|Samantha|Aria|Jenny/i.test(v.name)) ||
            vs.find((v) => /en-US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  // 여러 문장을 차례로 읽기 — 항목은 문자열 또는 { t, who: "clerk" | "me" }
  function speak(texts, onEnd) {
    if (!("speechSynthesis" in window)) { onEnd && onEnd(); return; }
    speechSynthesis.cancel();
    const list = Array.isArray(texts) ? texts : [texts];
    let i = 0;
    const next = () => {
      if (i >= list.length) { onEnd && onEnd(); return; }
      const item = list[i++];
      const t = typeof item === "string" ? item : item.t;
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "en-US"; u.rate = RATE; if (voice) u.voice = voice;
      if (item && item.who === "me") u.pitch = 1.3;
      if (item && item.who === "clerk") u.pitch = 0.9;
      u.onend = next; u.onerror = next;
      speechSynthesis.speak(u);
    };
    next();
  }
  const dialogLines = (it, level) => [
    { t: DIALOG.greet.en, who: "clerk" },
    { t: DIALOG.yes.en, who: "me" },
    { t: question(it, level).en, who: "me" },
    { t: answer(it).en, who: "clerk" },
  ];

  // ---------- 단어 뜻 풍선 ----------
  const popup = $("#word-popup");
  function dictKey(w) { return w.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ""); }
  function showWord(el, word) {
    const k = dictKey(word);
    const mean = DICT[k] || "뜻을 준비 중이에요";
    const clean = word.replace(/[.?!]$/g, "").replace(/^[,]|[,]$/g, "");
    popup.innerHTML = `<b class="en">${esc(clean)}</b> <span>${esc(mean)}</span>`;
    popup.classList.remove("hidden");
    const r = el.getBoundingClientRect();
    const pw = popup.offsetWidth;
    let left = r.left + window.scrollX + r.width / 2 - pw / 2;
    left = Math.max(8, Math.min(left, document.documentElement.clientWidth - pw - 8));
    popup.style.left = left + "px";
    popup.style.top = (r.top + window.scrollY - popup.offsetHeight - 8) + "px";
    speak(clean);
  }
  function hidePopup() { popup.classList.add("hidden"); }
  document.addEventListener("click", (e) => { if (!e.target.closest(".w")) hidePopup(); });

  function wordsHtml(sentence) {
    return sentence.split(" ").map((w) => `<span class="w" tabindex="0" data-w="${esc(w)}">${esc(w)}</span>`).join(" ");
  }
  document.addEventListener("click", (e) => {
    const w = e.target.closest(".w");
    if (w) { e.stopPropagation(); showWord(w, w.dataset.w); }
  });
  document.addEventListener("keydown", (e) => {
    const w = e.target.closest && e.target.closest(".w");
    if (w && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); showWord(w, w.dataset.w); }
  });

  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  // ---------- 그림 ----------
  function picture(it, cls, tag) {
    return `<div class="pic ${cls || ""}"><img src="images/${it.id}.png" alt="${esc(it.en)}" loading="lazy"
      onerror="this.parentNode.classList.add('fallback');this.remove()"><span class="emoji-tile" aria-hidden="true">${it.emoji}</span>
      ${tag ? `<span class="price-tag">${fmt(priceOf(it))}원</span>` : ""}</div>`;
  }

  // ---------- 탭 ----------
  function showTab(name) {
    state.tab = name;
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + name));
    hidePopup();
    if (name === "practice") renderPractice();
    else if (name === "price") renderPriceTab();
    else renderLevel(name);
    window.scrollTo({ top: 0 });
  }
  document.querySelectorAll(".tab-btn").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

  function updateBadge() { $("#cart-count").textContent = `${cart.length}/${MAX_CART}`; }

  // ---------- 물건 카드 탭 ----------
  function buildLevel(level) {
    const root = $("#tab-" + level);
    root.innerHTML = `
      <div class="block shop-block">
        <h2>1️⃣ 가게 대화 · <span class="en">At the Shop</span></h2>
        <div class="shop">
          <div class="shop-item"></div>
          <div class="dialog">
            <div class="bubble-row clerk">
              <div class="who">🧑‍💼<small>점원</small></div>
              <div class="bubble"><p class="en d-greet"></p><p class="ko">${esc(DIALOG.greet.ko)}</p></div>
              <button class="icon-btn say-greet" aria-label="듣기">🔊</button>
            </div>
            <div class="bubble-row me">
              <button class="icon-btn say-q" aria-label="듣기">🔊</button>
              <div class="bubble"><p class="en d-q"></p><p class="ko d-q-ko"></p></div>
              <div class="who">🙋<small>나</small></div>
            </div>
            <div class="bubble-row clerk">
              <div class="who">🧑‍💼<small>점원</small></div>
              <div class="bubble"><p class="en d-a"></p><p class="ko d-a-ko"></p></div>
              <button class="icon-btn say-a" aria-label="듣기">🔊</button>
            </div>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn listen-dialog">🔊 대화 듣기</button>
          <button class="btn soft random-item">🎲 다른 물건</button>
          <button class="btn soft cart-cur">🛒 담기</button>
          <button class="btn soft go-practice">🎤 연습하기로 가기</button>
        </div>
        <p class="status" aria-live="polite"></p>
      </div>
      <div class="block">
        <h2>2️⃣ 가격 정하기 <small class="sub">— 내가 점원이 되어 값을 정해요</small></h2>
        <div class="price-chips"></div>
      </div>
      <div class="block">
        <h2>3️⃣ 물건 고르기</h2>
        <div class="filters"></div>
        <p class="hint">${level === "mid"
          ? "중급: 색깔·모양을 붙여 <b class='en'>How much are these striped socks?</b> 처럼 말해요."
          : "초급: <b class='en'>How much are these ___?</b> 로 짧게 물어요."} 여러 개(양말·장갑·신발처럼 짝이 있는 물건)는 <b class="en">these</b>, 대답은 <b class="en">They are</b>! 단어를 누르면 뜻과 발음이 나와요.</p>
        <div class="grid"></div>
      </div>`;

    root.querySelector(".say-greet").onclick = () => speak({ t: DIALOG.greet.en, who: "clerk" });
    root.querySelector(".say-q").onclick = () => speak([{ t: DIALOG.yes.en, who: "me" }, { t: question(itemById[state.cur], level).en, who: "me" }]);
    root.querySelector(".say-a").onclick = () => speak({ t: answer(itemById[state.cur]).en, who: "clerk" });
    root.querySelector(".listen-dialog").onclick = () => speak(dialogLines(itemById[state.cur], level));
    root.querySelector(".random-item").onclick = () => {
      const others = ITEMS.filter((it) => it.id !== state.cur);
      state.cur = others[Math.floor(Math.random() * others.length)].id;
      renderLevel(level);
      speak(dialogLines(itemById[state.cur], level));
    };
    root.querySelector(".cart-cur").onclick = () => toggleCart(level, itemById[state.cur]);
    root.querySelector(".go-practice").onclick = () => showTab("practice");
  }

  function renderLevel(level, statusMsg) {
    const root = $("#tab-" + level);
    if (!root.firstElementChild) buildLevel(level);
    const it = itemById[state.cur];
    const q = question(it, level), a = answer(it);

    // 대화
    root.querySelector(".shop-item").innerHTML = picture(it, "", true);
    root.querySelector(".d-greet").innerHTML = wordsHtml(DIALOG.greet.en);
    root.querySelector(".d-q").innerHTML = wordsHtml(DIALOG.yes.en) + "<br>" + wordsHtml(q.en);
    root.querySelector(".d-q-ko").textContent = `${DIALOG.yes.ko} ${q.ko}`;
    root.querySelector(".d-a").innerHTML = wordsHtml(a.en);
    root.querySelector(".d-a-ko").textContent = a.ko;
    const c = inCart(it.id);
    const curBtn = root.querySelector(".cart-cur");
    const onHere = c && c.level === level;
    curBtn.textContent = onHere ? "✔ 담았어요 (빼기)" : "🛒 장바구니에 담기";
    curBtn.classList.toggle("on", !!onHere);
    root.querySelector(".status").textContent = statusMsg ||
      `🛒 장바구니 ${cart.length}/${MAX_CART} · 아래 카드에서 물건을 고르거나 가격을 바꿔 보세요.`;

    // 가격 정하기
    const cur = priceOf(it);
    root.querySelector(".price-chips").innerHTML = PRICES.map((p) =>
      `<button class="price-chip ${p.won === cur ? "on" : ""}" data-won="${p.won}" aria-pressed="${p.won === cur}">
        <b>${fmt(p.won)}원</b><span class="en">${p.en} won</span></button>`).join("") +
      (cur !== it.price ? `<button class="btn tiny soft reset-price">↺ 처음 가격 ${fmt(it.price)}원</button>` : "");
    root.querySelectorAll(".price-chip").forEach((b) => (b.onclick = () => setPrice(level, it, +b.dataset.won)));
    const rp = root.querySelector(".reset-price");
    if (rp) rp.onclick = () => setPrice(level, it, it.price);

    // 필터
    const f = state.filter[level];
    const filters = [["all", "전체"], ["book", "📘 교과서 표현"]]
      .concat(CATEGORIES.map((cc) => [cc.id, `${cc.emoji} ${cc.ko}`]))
      .concat([["cart", "🛒 담은 것만"]]);
    root.querySelector(".filters").innerHTML = filters.map(([k, t]) =>
      `<button class="chip ${f === k ? "on" : ""}" data-f="${k}" aria-pressed="${f === k}">${t}</button>`).join("");
    root.querySelectorAll(".filters .chip").forEach((b) => (b.onclick = () => { state.filter[level] = b.dataset.f; renderLevel(level); }));

    // 카드
    const list = ITEMS.filter((x) =>
      f === "all" ? true : f === "book" ? x.book : f === "cart" ? !!inCart(x.id) : x.cat === f);
    const grid = root.querySelector(".grid");
    grid.innerHTML = list.map((x) => {
      const qq = question(x, level), aa = answer(x);
      const cc = inCart(x.id);
      const chosen = cc && cc.level === level;
      const cat = catById[x.cat];
      return `<article class="card cat-${x.cat} ${chosen ? "chosen" : ""} ${x.id === state.cur ? "current" : ""}" data-id="${x.id}">
        <div class="tags"><span class="tag">${cat.emoji} ${cat.ko}</span>${x.book ? '<span class="tag book">📘 교과서</span>' : ""}${x.id === state.cur ? '<span class="tag now">💬 대화 중</span>' : ""}</div>
        <button class="pic-btn" aria-label="${esc(x.en)} 대화 보기">${picture(x, "", true)}</button>
        <p class="en sent">🙋 ${wordsHtml(qq.en)}</p>
        <p class="en sent ans">🧑‍💼 ${wordsHtml(aa.en)}</p>
        <div class="ko-row"><p class="ko">${esc(qq.ko)} ${esc(aa.ko)}</p><button class="icon-btn say" aria-label="듣기">🔊</button></div>
        <div class="card-btns">
          <button class="talk-btn">💬 물어보기</button>
          <button class="pick-btn ${chosen ? "on" : ""}" aria-pressed="${!!chosen}">${chosen ? "✔ 담았어요" : "🛒 담기"}</button>
        </div>
      </article>`;
    }).join("") || `<p class="hint">이 조건에 맞는 카드가 없어요.</p>`;
    grid.querySelectorAll(".card").forEach((card) => {
      const x = itemById[card.dataset.id];
      card.querySelector(".say").onclick = () => speak([{ t: question(x, level).en, who: "me" }, { t: answer(x).en, who: "clerk" }]);
      const talk = () => {
        state.cur = x.id;
        renderLevel(level);
        root.querySelector(".shop-block").scrollIntoView({ behavior: "smooth", block: "start" });
        speak(dialogLines(x, level));
      };
      card.querySelector(".talk-btn").onclick = talk;
      card.querySelector(".pic-btn").onclick = talk;
      card.querySelector(".pick-btn").onclick = () => toggleCart(level, x);
    });
    updateBadge();
  }

  function setPrice(level, it, won) {
    if (won === it.price) delete prices[it.id]; else prices[it.id] = won;
    save(LS_PRICES, prices);
    renderLevel(level, `💰 ${it.ko} 가격을 ${fmt(won)}원으로 정했어요!`);
    speak([{ t: question(it, level).en, who: "me" }, { t: answer(it).en, who: "clerk" }]);
  }

  function toggleCart(level, it) {
    const c = inCart(it.id);
    let msg;
    if (c && c.level === level) {
      cart = cart.filter((x) => x.id !== it.id);
      msg = `↩️ ${it.ko}${eunNeun(it.ko)} 장바구니에서 뺐어요. (${cart.length}/${MAX_CART})`;
    } else if (c) {
      c.level = level;
      msg = `🔁 ${it.ko} 문장을 ${level === "mid" ? "중급" : "초급"}으로 바꿨어요.`;
    } else if (cart.length >= MAX_CART) {
      renderLevel(level, `🛒 장바구니가 가득 찼어요 (${MAX_CART}개). 연습하기에서 ✕로 하나 빼 주세요.`);
      return;
    } else {
      cart.push({ id: it.id, level });
      msg = `✅ ${it.ko}${eunNeun(it.ko) === "은" ? "을" : "를"} 담았어요! 장바구니 ${cart.length}/${MAX_CART}`;
    }
    save(LS_CART, cart);
    state.cur = it.id;
    renderLevel(level, msg);
    if (inCart(it.id)) speak([{ t: question(it, level).en, who: "me" }, { t: answer(it).en, who: "clerk" }]);
  }

  // ---------- 가격 익히기 탭 ----------
  const quiz = { item: null, won: 0, answered: false, right: 0, total: 0 };

  function renderPriceTab() {
    const grid = $("#price-grid");
    grid.innerHTML = PRICES.map((p) => `
      <button class="price-card" data-won="${p.won}">
        <span class="won">${fmt(p.won)}<small>원</small></span>
        <span class="bills" aria-hidden="true">${"💵".repeat(p.won / 1000)}</span>
        <span class="en words">${p.en} won</span>
        <span class="en say-line">They are ${fmt(p.won)} won.</span>
        <span class="ko">${p.ko} 원이에요 🔊</span>
      </button>`).join("");
    grid.querySelectorAll(".price-card").forEach((b) => (b.onclick = () => speak({ t: `They are ${fmt(+b.dataset.won)} won.`, who: "clerk" })));
    if (!quiz.item) newQuiz(false);
    else renderQuiz();
  }

  function newQuiz(play = true) {
    let it, won;
    do {
      it = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      won = PRICES[Math.floor(Math.random() * PRICES.length)].won;
    } while (quiz.item && it.id === quiz.item.id);
    Object.assign(quiz, { item: it, won, answered: false, pick: null });
    renderQuiz();
    if (play) playQuiz();
  }
  function playQuiz() {
    speak([{ t: `How much are these ${quiz.item.en}?`, who: "me" }, { t: `They are ${fmt(quiz.won)} won.`, who: "clerk" }]);
  }
  function renderQuiz() {
    const it = quiz.item;
    const box = $("#quiz");
    box.innerHTML = `
      <div class="quiz-top">
        ${picture(it, "quiz-pic")}
        <div class="quiz-dialog">
          <p class="en line">🙋 ${wordsHtml(`How much are these ${it.en}?`)}</p>
          <p class="en line ans">🧑‍💼 ${quiz.answered ? wordsHtml(`They are ${fmt(quiz.won)} won.`) : `They are <span class="blank">____</span> won.`}</p>
          <div class="btn-row left">
            <button class="btn quiz-play">▶ ${quiz.answered ? "다시 듣기" : "문제 듣기"}</button>
            <button class="btn soft quiz-next">다음 문제 ▶</button>
          </div>
          <p class="quiz-score">⭕ 맞힌 문제 <b>${quiz.right}</b> / ${quiz.total}</p>
        </div>
      </div>
      <div class="quiz-choices">${PRICES.map((p) => {
        let cls = "";
        if (quiz.answered && p.won === quiz.won) cls = "right";
        else if (quiz.answered && p.won === quiz.pick) cls = "wrong";
        return `<button class="price-chip ${cls}" data-won="${p.won}" ${quiz.answered ? "disabled" : ""}><b>${fmt(p.won)}원</b></button>`;
      }).join("")}</div>
      <p class="status quiz-msg" aria-live="polite">${quiz.answered
        ? (quiz.pick === quiz.won ? `⭕ 정답! ${fmt(quiz.won)}원 = ${priceInfo(quiz.won).en} won` : `❌ 아쉬워요. 정답은 ${fmt(quiz.won)}원 (${priceInfo(quiz.won).en} won)이에요.`)
        : "▶ 문제 듣기를 누르고 가격을 골라요."}</p>`;
    box.querySelector(".quiz-play").onclick = playQuiz;
    box.querySelector(".quiz-next").onclick = () => newQuiz(true);
    box.querySelectorAll(".quiz-choices .price-chip").forEach((b) => (b.onclick = () => {
      if (quiz.answered) return;
      quiz.answered = true; quiz.pick = +b.dataset.won; quiz.total++;
      if (quiz.pick === quiz.won) quiz.right++;
      renderQuiz();
      speak({ t: `They are ${fmt(quiz.won)} won.`, who: "clerk" });
    }));
  }

  // ---------- 연습하기 ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  let busy = false;

  function statFor(s) { return stats[s] || { n: 0, best: 0, sum: 0, last: null }; }
  function statsLine(s) {
    const st = statFor(s);
    if (!st.n) return "아직 연습 기록이 없어요";
    return `이번 ${st.last}% · 평균 ${Math.round(st.sum / st.n)}% · 최고 ${st.best}% · ${st.n}회`;
  }
  // 지금 연습할 문장들: 인사 2개 + 담은 물건마다 질문·대답 2개
  function practiceSentences() {
    const list = [DIALOG.greet.en, DIALOG.yes.en];
    cart.forEach((c) => { const it = itemById[c.id]; list.push(question(it, c.level).en, answer(it).en); });
    return [...new Set(list)];
  }

  function renderSummary() {
    let total = 0, sum = 0;
    Object.values(stats).forEach((s) => { total += s.n; sum += s.sum; });
    $("#sum-total").textContent = total;
    $("#sum-avg").textContent = total ? Math.round(sum / total) + "%" : "-";
    const list = practiceSentences();
    $("#sum-done").textContent = `${list.filter((s) => statFor(s).n > 0).length}/${list.length}`;
  }

  function speakTool(sentence, who) {
    const supported = SR || canRecord;
    return `<div class="speak-tool no-print" data-s="${esc(sentence)}">
      <span class="tool-who">${who === "clerk" ? "🧑‍💼 점원" : "🙋 손님"}</span>
      <span class="en tool-sent">${esc(sentence)}</span>
      <button class="btn mic" ${supported ? "" : "disabled"}>🎙️ 말하기</button>
      <button class="btn soft play-me" ${recordings[sentence] ? "" : "disabled"}>▶ 내 목소리</button>
      <span class="stat-line">${supported ? statsLine(sentence) : "이 브라우저는 말하기를 지원하지 않아요 (Chrome 권장)"}</span>
      <p class="live hidden"></p>
      <div class="result"></div>
    </div>`;
  }
  function bindTools(root) {
    root.querySelectorAll(".speak-tool").forEach((tool) => {
      const s = tool.dataset.s;
      tool.querySelector(".mic").onclick = () => practice(tool, s);
      tool.querySelector(".play-me").onclick = () => { if (recordings[s]) new Audio(recordings[s]).play().catch(() => {}); };
    });
  }

  function renderPractice() {
    // 인사
    const gl = $("#greet-list");
    gl.innerHTML = `<li class="plan-row greet-row">
      <div class="plan-main">
        <div class="plan-text">
          <p class="en line">🧑‍💼 ${wordsHtml(DIALOG.greet.en)} <span class="ko">${esc(DIALOG.greet.ko)}</span></p>
          <p class="en line ans">🙋 ${wordsHtml(DIALOG.yes.en)} <span class="ko">${esc(DIALOG.yes.ko)}</span></p>
        </div>
        <div class="row-btns no-print"><button class="icon-btn say-greet" aria-label="듣기">🔊</button></div>
      </div>
      ${speakTool(DIALOG.greet.en, "clerk")}
      ${speakTool(DIALOG.yes.en, "me")}
    </li>`;
    gl.querySelector(".say-greet").onclick = () => speak([{ t: DIALOG.greet.en, who: "clerk" }, { t: DIALOG.yes.en, who: "me" }]);
    bindTools(gl);

    // 쇼핑 목록
    const ol = $("#cart-list");
    const rows = [];
    for (let i = 0; i < MAX_CART; i++) {
      const c = cart[i];
      if (!c) {
        rows.push(`<li class="plan-row empty"><div class="when"><span class="q-num">${i + 1}</span> 빈 칸</div>
          <p class="en line">🙋 How much are these <span class="blank">____</span>?</p>
          <p class="en line">🧑‍💼 They are <span class="blank">____</span> won.</p>
          <button class="btn soft go-pick no-print">🛍️ 물건 카드에서 담아요</button></li>`);
        continue;
      }
      const it = itemById[c.id];
      const q = question(it, c.level), a = answer(it);
      const cat = catById[it.cat];
      rows.push(`<li class="plan-row" data-id="${it.id}">
        <div class="when"><span class="q-num">${i + 1}</span> ${it.emoji} <b>${esc(it.ko)}</b> <span class="en">${esc(nameOf(it, c.level).en)}</span>
          <span class="lv">${c.level === "mid" ? "중급" : "초급"}</span> <span class="tag">${cat.emoji} ${cat.ko}</span></div>
        <div class="plan-main">
          ${picture(it, "thumb", true)}
          <div class="plan-text">
            <p class="en line">🧑‍💼 ${wordsHtml(DIALOG.greet.en)}</p>
            <p class="en line">🙋 ${wordsHtml(DIALOG.yes.en)} ${wordsHtml(q.en)}</p>
            <p class="en line ans">🧑‍💼 ${wordsHtml(a.en)}</p>
            <p class="ko">${esc(q.ko)} — ${esc(a.ko)}</p>
          </div>
          <div class="row-btns no-print">
            <button class="icon-btn say-row" aria-label="듣기">🔊</button>
            <button class="icon-btn remove" aria-label="빼기" title="장바구니에서 빼기">✕</button>
          </div>
        </div>
        ${speakTool(q.en, "me")}
        ${speakTool(a.en, "clerk")}
      </li>`);
    }
    ol.innerHTML = rows.join("");
    ol.querySelectorAll(".go-pick").forEach((b) => (b.onclick = () => showTab("easy")));
    ol.querySelectorAll(".plan-row[data-id]").forEach((row) => {
      const c = inCart(row.dataset.id);
      const it = itemById[c.id];
      row.querySelector(".say-row").onclick = () => speak(dialogLines(it, c.level));
      row.querySelector(".remove").onclick = () => { cart = cart.filter((x) => x.id !== it.id); save(LS_CART, cart); renderPractice(); };
    });
    bindTools(ol);

    const sum = cart.reduce((s, c) => s + priceOf(itemById[c.id]), 0);
    $("#cart-total").textContent = cart.length ? `💰 합계 ${fmt(sum)}원` : "";

    const sup = $("#mic-support");
    sup.textContent = SR ? "🎙️ 말하기를 누르고 9초 안에 문장을 말해요. 마이크 권한을 허용해 주세요. 가격은 two thousand처럼 말해요."
      : canRecord ? "이 브라우저는 음성 인식이 없어 4초 녹음만 해요. 점수는 Chrome에서 볼 수 있어요."
      : "이 브라우저는 마이크를 쓸 수 없어요. Chrome을 권장해요.";
    renderSummary();
    updateBadge();
  }

  // 녹음 시작 (실패해도 null)
  async function startRecorder() {
    if (!canRecord) return null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.start();
      return {
        stop: () => new Promise((res) => {
          rec.onstop = () => {
            stream.getTracks().forEach((t) => t.stop());
            res(chunks.length ? new Blob(chunks, { type: rec.mimeType || "audio/webm" }) : null);
          };
          try { rec.state !== "inactive" ? rec.stop() : rec.onstop(); } catch (e) { res(null); }
        }),
      };
    } catch (e) { return null; }
  }

  async function practice(tool, sentence) {
    if (busy) return;
    busy = true;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    const micBtn = tool.querySelector(".mic");
    const live = tool.querySelector(".live");
    const result = tool.querySelector(".result");
    micBtn.disabled = true; micBtn.classList.add("rec");
    micBtn.textContent = "🔴 듣는 중…";
    result.innerHTML = "";
    live.classList.remove("hidden");
    live.textContent = "👂 들리는 말: …";

    const recorder = await startRecorder();
    const finish = async (candidates) => {
      if (recorder) {
        const blob = await recorder.stop();
        if (blob) {
          if (recordings[sentence]) URL.revokeObjectURL(recordings[sentence]);
          recordings[sentence] = URL.createObjectURL(blob);
        }
      }
      micBtn.disabled = false; micBtn.classList.remove("rec"); micBtn.textContent = "🎙️ 말하기";
      busy = false;
      if (candidates) showResult(tool, sentence, candidates);
      else {
        live.classList.add("hidden");
        result.innerHTML = `<p class="feedback">🎧 녹음했어요! <b>▶ 내 목소리</b>로 들어 보세요. (점수는 Chrome에서 볼 수 있어요)</p>`;
      }
      // 같은 문장 도구가 여러 개일 수 있어서 모두 갱신
      document.querySelectorAll(".speak-tool").forEach((t) => { if (t.dataset.s === sentence) t.querySelector(".play-me").disabled = !recordings[sentence]; });
    };

    if (!SR) {           // 음성 인식이 없으면 4초 녹음만
      if (!recorder) { await finish(null); result.innerHTML = `<p class="feedback">🎙️ 마이크를 쓸 수 없어요. 권한을 확인해 주세요.</p>`; return; }
      setTimeout(() => finish(null), 4000);
      return;
    }

    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 5; rec.continuous = false;
    let finals = [];
    let interim = "";
    let done = false;
    const timer = setTimeout(() => { try { rec.stop(); } catch (e) { /* 무시 */ } }, 9000);
    rec.onresult = (e) => {
      interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          const alts = [];
          for (let k = 0; k < r.length && k < 5; k++) alts.push(r[k].transcript);
          finals.push(alts);
        } else interim += r[0].transcript;
      }
      const shown = finals.map((a) => a[0]).join(" ") + " " + interim;
      live.textContent = "👂 들리는 말: " + (shown.trim() || "…");
    };
    const end = () => {
      if (done) return; done = true;
      clearTimeout(timer);
      let cands = [];
      if (finals.length === 1) cands = finals[0];
      else if (finals.length > 1) {
        const head = finals.slice(0, -1).map((a) => a[0]).join(" ");
        cands = finals[finals.length - 1].map((t) => head + " " + t);
      } else if (interim.trim()) cands = [interim];
      finish(cands.slice(0, 5));
    };
    rec.onerror = (e) => {
      if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) {
        live.textContent = "🎙️ 마이크 권한을 허용해 주세요.";
      }
      end();
    };
    rec.onend = end;
    try { rec.start(); } catch (e) { end(); }
  }

  function showResult(tool, sentence, candidates) {
    const live = tool.querySelector(".live");
    const result = tool.querySelector(".result");
    if (!candidates.length) {
      live.textContent = "👂 들리는 말: (아무것도 못 들었어요)";
      result.innerHTML = `<p class="feedback">🔁 소리가 안 들렸어요. 마이크 가까이에서 다시 말해 볼까요?</p>`;
      return;
    }
    const r = Scorer.scoreBest(sentence, candidates);
    const g = Scorer.grade(r.score);
    const st = statFor(sentence);
    st.n += 1; st.sum += r.score; st.best = Math.max(st.best, r.score); st.last = r.score;
    stats[sentence] = st;
    save(LS_STATS, stats);

    live.classList.add("hidden");
    const retry = r.chips.filter((c) => c.status !== "ok");
    result.innerHTML = `
      <p class="score-line"><span class="grade">${g.icon}</span> <b>${r.score}%</b> ${g.text}</p>
      <div class="chips">${r.chips.map((c) => `<span class="wchip ${c.status}">${c.status === "ok" ? "🟩" : c.status === "close" ? "🟨" : "🟥"} ${esc(c.text)}</span>`).join("")}</div>
      ${retry.length ? `<p class="retry">🔁 다시 들어 볼 단어: ${retry.map((c) => `<button class="btn tiny say-word" data-w="${esc(c.text)}">🔊 ${esc(c.text)}</button>`).join(" ")}</p>` : ""}
      <p class="heard">컴퓨터가 들은 말: “${esc(r.heard)}”</p>`;
    result.querySelectorAll(".say-word").forEach((b) => (b.onclick = () => speak(b.dataset.w)));
    document.querySelectorAll(".speak-tool").forEach((t) => { if (t.dataset.s === sentence) t.querySelector(".stat-line").textContent = statsLine(sentence); });
    renderSummary();
  }

  $("#btn-clear").onclick = () => {
    if (!confirm("연습 기록(횟수·점수)을 모두 지울까요? 쇼핑 목록은 그대로 있어요.")) return;
    stats = {}; save(LS_STATS, stats);
    Object.keys(recordings).forEach((k) => { URL.revokeObjectURL(recordings[k]); delete recordings[k]; });
    renderPractice();
  };
  $("#btn-listen-all").onclick = () => {
    const lines = [];
    cart.forEach((c) => lines.push(...dialogLines(itemById[c.id], c.level)));
    speak(lines.length ? lines : [{ t: DIALOG.greet.en, who: "clerk" }, { t: DIALOG.yes.en, who: "me" }]);
  };
  $("#btn-print").onclick = () => window.print();

  // 시작
  renderLevel("easy");
  updateBadge();
  window.__app = { state, quiz, get cart() { return cart; }, get prices() { return prices; }, get stats() { return stats; }, showTab };
})();
