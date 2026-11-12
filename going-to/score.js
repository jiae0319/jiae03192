// 발음 채점 — 목표 문장과 들린 말을 단어 순서대로 정렬(동적 계획법)해서 점수를 냅니다.
// 브라우저(window.Scorer)와 Node(require) 양쪽에서 씁니다.
(function (root) {
  "use strict";

  const CONTRACTIONS = {
    "i'm": "i am", "i'll": "i will", "i've": "i have", "i'd": "i would",
    "you're": "you are", "you'll": "you will", "we're": "we are", "we'll": "we will",
    "they're": "they are", "he's": "he is", "she's": "she is", "it's": "it is",
    "that's": "that is", "what's": "what is", "let's": "let us",
    "don't": "do not", "doesn't": "does not", "can't": "can not", "won't": "will not",
    "isn't": "is not", "aren't": "are not", "gonna": "going to", "wanna": "want to",
  };
  const HOMOPHONES = { too: "to", two: "to", "2": "to", four: "for", "4": "for", fore: "for", eye: "i", ay: "a" };
  const SMALL = new Set(["a", "an", "the", "to", "my", "i", "am", "is", "are", "in", "on", "at", "of",
    "for", "with", "and", "by"]);

  // 문자열 → 정규화된 토큰 배열
  function normalize(text) {
    let s = String(text || "").toLowerCase().replace(/[’‘`]/g, "'");
    s = s.replace(/[^a-z0-9' ]+/g, " ");
    let words = s.split(/\s+/).filter(Boolean);
    const out = [];
    for (let w of words) {
      w = w.replace(/^'+|'+$/g, "");
      if (!w) continue;
      if (CONTRACTIONS[w]) { out.push(...CONTRACTIONS[w].split(" ")); continue; }
      w = w.replace(/'/g, "");            // uncle's → uncles
      if (HOMOPHONES[w]) w = HOMOPHONES[w];
      out.push(w);
    }
    return joinLetters(out);
  }

  // 한 글자씩 들린 말 붙이기: "p c" → "pc" (a, i는 낱말이라 제외)
  function joinLetters(tokens) {
    const out = [];
    let run = [];
    const flush = () => {
      if (run.length >= 2) out.push(run.join(""));
      else out.push(...run);
      run = [];
    };
    for (const t of tokens) {
      if (t.length === 1 && /[a-z]/.test(t) && t !== "a" && t !== "i") run.push(t);
      else { flush(); out.push(t); }
    }
    flush();
    return out;
  }

  function lev(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  // 자음만 소리값으로 통일(모음은 그대로 → kite ≠ cat)
  function soundKey(w) {
    return w
      .replace(/ph/g, "f").replace(/th/g, "s").replace(/ck/g, "k").replace(/sh/g, "s")
      .replace(/[cq]/g, "k").replace(/r/g, "l").replace(/f/g, "p").replace(/v/g, "b")
      .replace(/z/g, "s").replace(/x/g, "ks").replace(/w/g, "u")
      .replace(/(.)\1+/g, "$1");
  }

  function wordSim(t, h) {
    if (t === h) return 1;
    if (!t || !h) return 0;
    const minLen = Math.min(t.length, h.length);
    if (minLen >= 2 && lev(t, h) === 1) return 0.85;           // 철자 1글자 차이
    const kt = soundKey(t), kh = soundKey(h);
    if (kt === kh) return 0.7;                                   // 소리 비슷
    if (minLen >= 3 && lev(kt, kh) === 1) return 0.5;           // 비슷한 편
    if (minLen >= 5 && lev(t, h) === 2) return 0.5;
    return 0;
  }

  // 목표 문장 → 원래 단어(칩)와 토큰·가중치
  function analyzeTarget(sentence) {
    const raw = String(sentence).split(/\s+/).filter(Boolean);
    const words = [];
    const tokens = [];
    raw.forEach((rw, wi) => {
      const clean = rw.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, "");
      if (!clean) return;
      const toks = normalize(clean);
      const isPlace = wi > 0 && /^[A-Z][a-z]/.test(clean) && clean !== "I'm" && clean !== "I";
      const w = { text: clean, tokens: [] };
      toks.forEach((tk) => {
        const weight = isPlace ? 0.6 : (SMALL.has(tk) ? 0.3 : 1);
        w.tokens.push(tokens.length);
        tokens.push({ t: tk, weight, word: words.length });
      });
      words.push(w);
    });
    return { words, tokens };
  }

  // 단어 순서대로 정렬(가중 LCS)
  function align(target, heard) {
    const m = target.length, n = heard.length;
    const dp = Array.from({ length: m + 1 }, () => new Float64Array(n + 1));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const s = wordSim(target[i - 1].t, heard[j - 1]);
        const diag = s > 0 ? dp[i - 1][j - 1] + target[i - 1].weight * s : -1;
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], diag);
      }
    }
    const sims = new Array(m).fill(0);
    const matchedHeard = new Array(n).fill(false);
    let i = m, j = n;
    while (i > 0 && j > 0) {
      const s = wordSim(target[i - 1].t, heard[j - 1]);
      if (s > 0 && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + target[i - 1].weight * s)) < 1e-9) {
        sims[i - 1] = s; matchedHeard[j - 1] = true; i--; j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
      else j--;
    }
    return { total: dp[m][n], sims, extra: matchedHeard.filter((x) => !x).length };
  }

  function scoreOne(targetSentence, heardText) {
    const ta = analyzeTarget(targetSentence);
    const heard = normalize(heardText);
    const totalW = ta.tokens.reduce((s, t) => s + t.weight, 0) || 1;
    const al = align(ta.tokens, heard);
    const penalty = Math.min(10, al.extra * 3);
    const score = Math.max(0, Math.min(100, Math.round((al.total / totalW) * 100 - penalty)));
    const chips = ta.words.map((w) => {
      const ss = w.tokens.map((k) => al.sims[k]);
      let status = "ok";
      if (ss.every((x) => x === 0)) status = "miss";
      else if (!ss.every((x) => x === 1)) status = "close";
      return { text: w.text, status };
    });
    return { score, chips, heard: heardText, extra: al.extra, raw: (al.total / totalW) * 100 };
  }

  // 후보(최대 5개) 중 최고 점수
  function scoreBest(targetSentence, candidates) {
    const list = (candidates || []).filter((c) => c && String(c).trim()).slice(0, 5);
    if (!list.length) return { ...scoreOne(targetSentence, ""), heard: "" };
    let best = null;
    for (const c of list) {
      const r = scoreOne(targetSentence, c);
      if (!best || r.score > best.score) best = r;
    }
    return best;
  }

  function grade(score) {
    if (score >= 85) return { icon: "⭐", text: "아주 잘했어요!" };
    if (score >= 60) return { icon: "👍", text: "잘했어요! 조금만 더!" };
    return { icon: "🔁", text: "다시 해 볼까요?" };
  }

  const api = { normalize, wordSim, soundKey, analyzeTarget, scoreOne, scoreBest, grade, lev };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Scorer = api;
})(typeof window !== "undefined" ? window : globalThis);
