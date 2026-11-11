// What are you going to do? — 앱 동작
(function () {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);
  const LS_PLANS = "goingto.plans.v1";
  const LS_STATS = "goingto.stats.v1";
  const RATE = 0.85;

  // ---------- 저장 ----------
  function load(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === "object" ? v : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 무시 */ } }

  let plans = load(LS_PLANS, {});   // { qid: { id, level } }
  let stats = load(LS_STATS, {});   // { sentence: { n, best, sum, last } }
  const recordings = {};            // { sentence: objectURL } — 새로고침하면 사라짐

  const state = { q: 0, filter: { easy: "all", mid: "all" }, tab: "easy" };

  const actById = {};
  ACTIVITIES.forEach((a) => (actById[a.id] = a));
  const catById = {};
  CATEGORIES.forEach((c) => (catById[c.id] = c));

  // ---------- 문장 ----------
  const qSentence = (q) => `What are you going to do ${q.en}?`;
  function answer(a, level) {
    const p = level === "mid" ? a.mid : a;
    return { en: `I'm going to ${p.en}.`, ko: `나는 ${p.ko} 거야.` };
  }
  function planOf(q) {
    const p = plans[q.id];
    if (!p || !actById[p.id]) return null;
    return { act: actById[p.id], level: p.level === "mid" ? "mid" : "easy" };
  }
  const planCount = () => QUESTIONS.filter((q) => planOf(q)).length;

  // ---------- 음성 ----------
  let voice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /en-US/i.test(v.lang) && /Google|Samantha|Aria|Jenny/i.test(v.name)) ||
            vs.find((v) => /en-US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  // 여러 문장을 차례로 읽기
  function speak(texts, onEnd) {
    if (!("speechSynthesis" in window)) { onEnd && onEnd(); return; }
    speechSynthesis.cancel();
    const list = Array.isArray(texts) ? texts : [texts];
    let i = 0;
    const next = () => {
      if (i >= list.length) { onEnd && onEnd(); return; }
      const u = new SpeechSynthesisUtterance(list[i++]);
      u.lang = "en-US"; u.rate = RATE; if (voice) u.voice = voice;
      u.onend = next; u.onerror = next;
      speechSynthesis.speak(u);
    };
    next();
  }

  // ---------- 단어 뜻 풍선 ----------
  const popup = $("#word-popup");
  function dictKey(w) { return w.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ""); }
  function showWord(el, word) {
    const k = dictKey(word);
    const mean = DICT[k] || "뜻을 준비 중이에요";
    popup.innerHTML = `<b class="en">${esc(word.replace(/[.,?!]/g, ""))}</b> <span>${esc(mean)}</span>`;
    popup.classList.remove("hidden");
    const r = el.getBoundingClientRect();
    const pw = popup.offsetWidth;
    let left = r.left + window.scrollX + r.width / 2 - pw / 2;
    left = Math.max(8, Math.min(left, document.documentElement.clientWidth - pw - 8));
    popup.style.left = left + "px";
    popup.style.top = (r.top + window.scrollY - popup.offsetHeight - 8) + "px";
    speak(word.replace(/[.,?!]/g, ""));
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
  function picture(a, cls) {
    return `<div class="pic ${cls || ""}"><img src="images/${a.id}.png" alt="${esc(a.en)}" loading="lazy"
      onerror="this.parentNode.classList.add('fallback');this.remove()"><span class="emoji-tile" aria-hidden="true">${a.emoji}</span></div>`;
  }

  // ---------- 탭 ----------
  function showTab(name) {
    state.tab = name;
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + name));
    hidePopup();
    if (name === "practice") renderPractice(); else renderLevel(name);
    window.scrollTo({ top: 0 });
  }
  document.querySelectorAll(".tab-btn").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

  function updateBadge() { $("#plan-count").textContent = `${planCount()}/5`; }

  // ---------- 활동 카드 탭 ----------
  function buildLevel(level) {
    const root = $("#tab-" + level);
    root.innerHTML = `
      <div class="block">
        <h2>1️⃣ 질문을 골라요</h2>
        <div class="q-buttons"></div>
        <div class="dialog">
          <div class="bubble-row friend">
            <div class="who">🙋<small>친구</small></div>
            <div class="bubble"><p class="en dq-en"></p><p class="ko dq-ko"></p></div>
            <button class="icon-btn say-q" title="질문 듣기" aria-label="질문 듣기">🔊</button>
          </div>
          <div class="bubble-row me">
            <button class="icon-btn say-a" title="대답 듣기" aria-label="대답 듣기">🔊</button>
            <div class="bubble"><p class="en a-en"></p><p class="ko a-ko"></p></div>
            <div class="who">🙆<small>나</small></div>
          </div>
          <div class="btn-row">
            <button class="btn listen-dialog">🔊 대화 듣기</button>
            <button class="btn next-q">다음 질문 ▶</button>
            <button class="btn go-practice">🎤 연습하기로 가기</button>
          </div>
          <p class="status" aria-live="polite"></p>
        </div>
      </div>
      <div class="block">
        <h2>2️⃣ 할 일 고르기</h2>
        <div class="filters"></div>
        <p class="hint">${level === "mid" ? "중급: 누구와 · 어디서 · 무엇을 하러 가는지 붙여서 길게 말해요." : "초급: <b class='en'>I'm going to ___.</b> 로 짧게 말해요."} 단어를 누르면 뜻과 발음이 나와요.</p>
        <div class="grid"></div>
      </div>`;

    root.querySelector(".say-q").onclick = () => speak(qSentence(QUESTIONS[state.q]));
    root.querySelector(".say-a").onclick = () => { const p = planOf(QUESTIONS[state.q]); if (p) speak(answer(p.act, p.level).en); };
    root.querySelector(".listen-dialog").onclick = () => {
      const q = QUESTIONS[state.q], p = planOf(q);
      speak(p ? [qSentence(q), answer(p.act, p.level).en] : [qSentence(q)]);
    };
    root.querySelector(".next-q").onclick = () => { state.q = (state.q + 1) % QUESTIONS.length; renderLevel(level); };
    root.querySelector(".go-practice").onclick = () => showTab("practice");
  }

  function renderLevel(level) {
    const root = $("#tab-" + level);
    if (!root.firstElementChild) buildLevel(level);
    const q = QUESTIONS[state.q];
    const p = planOf(q);

    // 질문 버튼
    root.querySelector(".q-buttons").innerHTML = QUESTIONS.map((qq, i) => {
      const pp = planOf(qq);
      return `<button class="q-btn ${i === state.q ? "active" : ""} ${pp ? "done" : ""}" data-i="${i}" aria-pressed="${i === state.q}">
        <span class="q-num">Q${i + 1}</span><span class="q-emoji">${qq.emoji}</span>
        <span class="q-ko">${qq.ko}</span><span class="q-en en">${qq.en}</span>
        ${pp ? `<span class="q-check">✓ ${pp.act.emoji}</span>` : ""}</button>`;
    }).join("");
    root.querySelectorAll(".q-btn").forEach((b) => (b.onclick = () => { state.q = +b.dataset.i; renderLevel(level); }));

    // 말풍선
    root.querySelector(".dq-en").innerHTML = wordsHtml(qSentence(q));
    root.querySelector(".dq-ko").textContent = q.koAsk;
    if (p) {
      const ans = answer(p.act, p.level);
      root.querySelector(".a-en").innerHTML = wordsHtml(ans.en);
      root.querySelector(".a-ko").textContent = ans.ko;
      root.querySelector(".me .bubble").classList.remove("empty");
      root.querySelector(".status").textContent = `✅ ${q.ko} 계획을 담았어요! 연습하기 ${planCount()}/5`;
    } else {
      root.querySelector(".a-en").innerHTML = `I'm going to <span class="blank">____</span>.`;
      root.querySelector(".a-ko").textContent = "나는 ____ 거야.";
      root.querySelector(".me .bubble").classList.add("empty");
      root.querySelector(".status").textContent = `👇 아래 카드에서 ${q.ko}에 할 일을 골라 보세요.`;
    }
    root.querySelector(".say-a").disabled = !p;

    // 필터
    const f = state.filter[level];
    const filters = [["all", "전체"], ["book", "📘 교과서 표현"]]
      .concat(CATEGORIES.map((c) => [c.id, `${c.emoji} ${c.ko}`]))
      .concat([["rec", `⭐ ${q.ko}에 어울리는 것만`]]);
    root.querySelector(".filters").innerHTML = filters.map(([k, t]) =>
      `<button class="chip ${f === k ? "on" : ""}" data-f="${k}" aria-pressed="${f === k}">${t}</button>`).join("");
    root.querySelectorAll(".filters .chip").forEach((b) => (b.onclick = () => { state.filter[level] = b.dataset.f; renderLevel(level); }));

    // 카드
    const list = ACTIVITIES.filter((a) =>
      f === "all" ? true : f === "book" ? a.book : f === "rec" ? a.when.includes(q.id) : a.cat === f);
    const grid = root.querySelector(".grid");
    grid.innerHTML = list.map((a) => {
      const ans = answer(a, level);
      const chosen = p && p.act.id === a.id && p.level === level;
      const c = catById[a.cat];
      return `<article class="card cat-${a.cat} ${chosen ? "chosen" : ""}" data-id="${a.id}">
        <div class="tags"><span class="tag">${c.emoji} ${c.ko}</span>${a.book ? '<span class="tag book">📘 교과서</span>' : ""}${a.when.includes(q.id) ? '<span class="tag rec">⭐ 추천</span>' : ""}</div>
        ${picture(a)}
        <p class="en sent">${wordsHtml(ans.en)}</p>
        <div class="ko-row"><p class="ko">${esc(ans.ko)}</p><button class="icon-btn say" aria-label="듣기">🔊</button></div>
        <button class="pick-btn ${chosen ? "on" : ""}" aria-pressed="${chosen}">${chosen ? `✔ ${q.ko} 계획이에요 (다시 누르면 빼기)` : `✅ ${q.pick}`}</button>
      </article>`;
    }).join("") || `<p class="hint">이 조건에 맞는 카드가 없어요.</p>`;
    grid.querySelectorAll(".card").forEach((card) => {
      const a = actById[card.dataset.id];
      card.querySelector(".say").onclick = () => speak(answer(a, level).en);
      card.querySelector(".pick-btn").onclick = () => togglePlan(level, a);
    });
    updateBadge();
  }

  function togglePlan(level, a) {
    const q = QUESTIONS[state.q];
    const cur = plans[q.id];
    if (cur && cur.id === a.id && cur.level === level) {
      delete plans[q.id];
      save(LS_PLANS, plans);
      renderLevel(level);
      $("#tab-" + level + " .status").textContent = `↩️ ${q.ko} 계획에서 뺐어요.`;
      return;
    }
    plans[q.id] = { id: a.id, level };
    save(LS_PLANS, plans);
    renderLevel(level);
    speak([qSentence(q), answer(a, level).en]);
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

  function renderSummary() {
    let total = 0, sum = 0;
    Object.values(stats).forEach((s) => { total += s.n; sum += s.sum; });
    $("#sum-total").textContent = total;
    $("#sum-avg").textContent = total ? Math.round(sum / total) + "%" : "-";
    const done = QUESTIONS.filter((q) => { const p = planOf(q); return p && statFor(answer(p.act, p.level).en).n > 0; }).length;
    $("#sum-done").textContent = `${done}/5`;
  }

  function renderPractice() {
    const ol = $("#plan-list");
    ol.innerHTML = QUESTIONS.map((q, i) => {
      const p = planOf(q);
      const head = `<div class="when"><span class="q-num">Q${i + 1}</span> ${q.emoji} <b>${q.ko}</b> <span class="en">${q.en}</span></div>`;
      if (!p) {
        return `<li class="plan-row empty">${head}
          <p class="en line">Q. ${wordsHtml(qSentence(q))}</p>
          <p class="en line">A. I'm going to <span class="blank">____</span>.</p>
          <button class="btn soft go-pick no-print" data-i="${i}">🎨 활동 카드에서 골라요</button></li>`;
      }
      const ans = answer(p.act, p.level);
      const supported = SR || canRecord;
      return `<li class="plan-row" data-q="${q.id}">
        ${head}
        <div class="plan-main">
          ${picture(p.act, "thumb")}
          <div class="plan-text">
            <p class="en line">Q. ${wordsHtml(qSentence(q))}</p>
            <p class="en line ans">A. ${wordsHtml(ans.en)}</p>
            <p class="ko">${esc(ans.ko)} <span class="lv">${p.level === "mid" ? "중급" : "초급"}</span></p>
          </div>
          <div class="row-btns no-print">
            <button class="icon-btn say-row" aria-label="듣기">🔊</button>
            <button class="icon-btn remove" aria-label="빼기" title="계획에서 빼기">✕</button>
          </div>
        </div>
        <div class="speak-tool no-print">
          <button class="btn mic" ${supported ? "" : "disabled"}>🎙️ 말하기</button>
          <button class="btn soft play-me" ${recordings[ans.en] ? "" : "disabled"}>▶ 내 목소리</button>
          <span class="stat-line">${supported ? statsLine(ans.en) : "이 브라우저는 말하기를 지원하지 않아요 (Chrome 권장)"}</span>
          <p class="live hidden"></p>
          <div class="result"></div>
        </div>
      </li>`;
    }).join("");

    ol.querySelectorAll(".go-pick").forEach((b) => (b.onclick = () => { state.q = +b.dataset.i; showTab("easy"); }));
    ol.querySelectorAll(".plan-row[data-q]").forEach((row) => {
      const q = QUESTIONS.find((x) => x.id === row.dataset.q);
      const p = planOf(q);
      const ans = answer(p.act, p.level);
      row.querySelector(".say-row").onclick = () => speak([qSentence(q), ans.en]);
      row.querySelector(".remove").onclick = () => { delete plans[q.id]; save(LS_PLANS, plans); renderPractice(); };
      row.querySelector(".play-me").onclick = () => { if (recordings[ans.en]) new Audio(recordings[ans.en]).play().catch(() => {}); };
      row.querySelector(".mic").onclick = () => practice(row, ans.en);
    });

    const sup = $("#mic-support");
    sup.textContent = SR ? "🎙️ 말하기를 누르고 9초 안에 문장을 말해요. 마이크 권한을 허용해 주세요."
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

  async function practice(row, sentence) {
    if (busy) return;
    busy = true;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    const micBtn = row.querySelector(".mic");
    const live = row.querySelector(".live");
    const result = row.querySelector(".result");
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
      if (candidates) showResult(row, sentence, candidates);
      else {
        live.classList.add("hidden");
        result.innerHTML = `<p class="feedback">🎧 녹음했어요! <b>▶ 내 목소리</b>로 들어 보세요. (점수는 Chrome에서 볼 수 있어요)</p>`;
      }
      row.querySelector(".play-me").disabled = !recordings[sentence];
    };

    if (!SR) {           // 음성 인식이 없으면 4초 녹음만
      if (!recorder) { await finish(null); result.innerHTML = `<p class="feedback">🎙️ 마이크를 쓸 수 없어요. 권한을 확인해 주세요.</p>`; return; }
      setTimeout(() => finish(null), 4000);
      return;
    }

    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 5; rec.continuous = false;
    let finals = [];          // 최종 결과의 후보들
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
      // 여러 조각이면 첫 후보끼리 이어 붙인 것 + 마지막 조각 후보들
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

  function showResult(row, sentence, candidates) {
    const live = row.querySelector(".live");
    const result = row.querySelector(".result");
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
    row.querySelector(".stat-line").textContent = statsLine(sentence);
    renderSummary();
  }

  $("#btn-clear").onclick = () => {
    if (!confirm("연습 기록(횟수·점수)을 모두 지울까요? 계획표는 그대로 있어요.")) return;
    stats = {}; save(LS_STATS, stats);
    Object.keys(recordings).forEach((k) => { URL.revokeObjectURL(recordings[k]); delete recordings[k]; });
    renderPractice();
  };
  $("#btn-listen-all").onclick = () => {
    const lines = [];
    QUESTIONS.forEach((q) => { const p = planOf(q); if (p) lines.push(qSentence(q), answer(p.act, p.level).en); });
    if (lines.length) speak(lines);
  };
  $("#btn-print").onclick = () => window.print();

  // 시작
  renderLevel("easy");
  updateBadge();
  window.__app = { state, get plans() { return plans; }, get stats() { return stats; }, showTab };
})();
