/* =========================================================
 * 6학년 · What's your favorite subject? 데이터
 * - 질문 : What's your favorite subject?
 * - 대답 : My favorite subject is ___.  (과목 10개 × 초급 / 중급 / 고급)
 * - 잘하는 것 : I'm good at ___.  (10개)
 * - 카테고리(인덱스별 공통) : main(교과 과목 6) / arts(예체능 과목 4)
 * - 이미지 : Canva에서 만든 그림을 images/ 폴더에 아래 파일명으로 넣으면 자동 표시
 *            (파일이 없으면 이모지 타일로 보여 줌)  → CANVA_IMAGES.md 참고
 * - 내 대답 카드(3개) 는 app.js 에서 localStorage 에 저장
 * ========================================================= */

const QUESTION = { en: "What's your favorite subject?", ko: "네가 가장 좋아하는 과목은 뭐니?", emoji: "❓" };

/* ===== 과목 10개 ===== */
const SUBJECTS = [
  // 📘 교과 과목
  { id: "korean",         en: "Korean",         ko: "국어",   emoji: "📖", cat: "main" },
  { id: "english",        en: "English",        ko: "영어",   emoji: "🔤", cat: "main" },
  { id: "math",           en: "math",           ko: "수학",   emoji: "➗", cat: "main" },
  { id: "science",        en: "science",        ko: "과학",   emoji: "🔬", cat: "main" },
  { id: "social-studies", en: "social studies", ko: "사회",   emoji: "🗺️", cat: "main" },
  { id: "history",        en: "history",        ko: "역사",   emoji: "🏯", cat: "main" },
  // 🎨 예체능 과목
  { id: "music",          en: "music",          ko: "음악",   emoji: "🎵", cat: "arts" },
  { id: "art",            en: "art",            ko: "미술",   emoji: "🎨", cat: "arts" },
  { id: "pe",             en: "P.E.",           ko: "체육",   emoji: "⚽", cat: "arts" },
  { id: "practical-arts", en: "practical arts", ko: "실과",   emoji: "🍳", cat: "arts" },
];
SUBJECTS.forEach(s => { s.img = `images/subjects/${s.id}.png`; });

/* ===== 잘하는 것 10개 (I'm good at ___.) ===== */
const ABILITIES = [
  { id: "singing",           en: "singing",           ko: "노래하기",         emoji: "🎤" },
  { id: "dancing",           en: "dancing",           ko: "춤추기",           emoji: "💃" },
  { id: "drawing",           en: "drawing",           ko: "그림 그리기",      emoji: "🖍️" },
  { id: "running",           en: "running",           ko: "달리기",           emoji: "🏃" },
  { id: "swimming",          en: "swimming",          ko: "수영하기",         emoji: "🏊" },
  { id: "cooking",           en: "cooking",           ko: "요리하기",         emoji: "🧑‍🍳" },
  { id: "playing-soccer",    en: "playing soccer",    ko: "축구하기",         emoji: "⚽" },
  { id: "playing-the-piano", en: "playing the piano", ko: "피아노 치기",      emoji: "🎹" },
  { id: "writing-stories",   en: "writing stories",   ko: "이야기 쓰기",      emoji: "✏️" },
  { id: "solving-puzzles",   en: "solving puzzles",   ko: "퍼즐 풀기",        emoji: "🧩" },
];
ABILITIES.forEach(a => { a.img = `images/abilities/${a.id}.png`; });

/* ===== 과목 대답 문장 (인덱스 = SUBJECTS 순서) ===== */
const SUBJECT_LEVELS = {
  beginner: SUBJECTS.map(s => ({
    en: `My favorite subject is ${s.en}${s.en.endsWith(".") ? "" : "."}`,
    ko: `내가 가장 좋아하는 과목은 ${s.ko}이야.`,
  })),
  intermediate: [
    { en: "My favorite subject is Korean. I like reading stories.",  ko: "내가 가장 좋아하는 과목은 국어야. 나는 이야기 읽는 것을 좋아해." },
    { en: "My favorite subject is English. I like English songs.",   ko: "내가 가장 좋아하는 과목은 영어야. 나는 영어 노래를 좋아해." },
    { en: "My favorite subject is math. I like numbers.",            ko: "내가 가장 좋아하는 과목은 수학이야. 나는 숫자를 좋아해." },
    { en: "My favorite subject is science. I like experiments.",     ko: "내가 가장 좋아하는 과목은 과학이야. 나는 실험을 좋아해." },
    { en: "My favorite subject is social studies. I like maps.",     ko: "내가 가장 좋아하는 과목은 사회야. 나는 지도를 좋아해." },
    { en: "My favorite subject is history. I like old stories.",     ko: "내가 가장 좋아하는 과목은 역사야. 나는 옛날이야기를 좋아해." },
    { en: "My favorite subject is music. I like songs.",             ko: "내가 가장 좋아하는 과목은 음악이야. 나는 노래를 좋아해." },
    { en: "My favorite subject is art. I like colors.",              ko: "내가 가장 좋아하는 과목은 미술이야. 나는 색깔을 좋아해." },
    { en: "My favorite subject is P.E. I like sports.",              ko: "내가 가장 좋아하는 과목은 체육이야. 나는 운동을 좋아해." },
    { en: "My favorite subject is practical arts. I like cooking.",  ko: "내가 가장 좋아하는 과목은 실과야. 나는 요리를 좋아해." },
  ],
  advanced: [
    { en: "My favorite subject is Korean. I'm good at writing stories.",      ko: "내가 가장 좋아하는 과목은 국어야. 나는 이야기 쓰기를 잘해." },
    { en: "My favorite subject is English. I'm good at speaking English.",    ko: "내가 가장 좋아하는 과목은 영어야. 나는 영어 말하기를 잘해." },
    { en: "My favorite subject is math. I'm good at solving problems.",       ko: "내가 가장 좋아하는 과목은 수학이야. 나는 문제 풀기를 잘해." },
    { en: "My favorite subject is science. I'm good at doing experiments.",   ko: "내가 가장 좋아하는 과목은 과학이야. 나는 실험하기를 잘해." },
    { en: "My favorite subject is social studies. I'm good at reading maps.", ko: "내가 가장 좋아하는 과목은 사회야. 나는 지도 읽기를 잘해." },
    { en: "My favorite subject is history. I'm good at telling old stories.", ko: "내가 가장 좋아하는 과목은 역사야. 나는 옛날이야기 들려주기를 잘해." },
    { en: "My favorite subject is music. I'm good at singing.",               ko: "내가 가장 좋아하는 과목은 음악이야. 나는 노래를 잘해." },
    { en: "My favorite subject is art. I'm good at drawing.",                 ko: "내가 가장 좋아하는 과목은 미술이야. 나는 그림 그리기를 잘해." },
    { en: "My favorite subject is P.E. I'm good at running.",                 ko: "내가 가장 좋아하는 과목은 체육이야. 나는 달리기를 잘해." },
    { en: "My favorite subject is practical arts. I'm good at cooking.",      ko: "내가 가장 좋아하는 과목은 실과야. 나는 요리를 잘해." },
  ],
};

/* ===== 과목 카테고리 ===== */
const SUBJECT_CATS = [
  { key: "main", label: "📘 교과 과목" },
  { key: "arts", label: "🎨 예체능 과목" },
];

/* ===== 단어 뜻 사전 ===== */
function wordKey(w) {
  return w.toLowerCase().replace(/^[^a-z0-9':]+/, "").replace(/[^a-z0-9':]+$/, "");
}

const WORD_MEANINGS = {
  "what's": "무엇이니? (what is)",
  "what": "무엇",
  "your": "너의",
  "my": "나의",
  "favorite": "가장 좋아하는",
  "subject": "과목",
  "is": "~이다",
  "i'm": "나는 ~이다 (I am)",
  "i": "나는",
  "good": "좋은, 잘하는 (good at: ~을 잘하다)",
  "at": "~에 (good at: ~을 잘하다)",
  "like": "좋아하다",
  "korean": "국어, 한국어",
  "english": "영어",
  "math": "수학",
  "science": "과학",
  "social": "사회의 (social studies: 사회 과목)",
  "studies": "공부, 학문 (social studies: 사회 과목)",
  "history": "역사",
  "music": "음악",
  "art": "미술",
  "p.e": "체육 (Physical Education)",
  "practical": "실용적인 (practical arts: 실과)",
  "arts": "기술, 예술 (practical arts: 실과)",
  "singing": "노래하기 (sing)",
  "dancing": "춤추기 (dance)",
  "drawing": "그림 그리기 (draw)",
  "running": "달리기 (run)",
  "swimming": "수영하기 (swim)",
  "cooking": "요리하기 (cook)",
  "playing": "(운동·악기를) 하기, 연주하기 (play)",
  "soccer": "축구",
  "the": "그 (악기 앞에: the piano)",
  "piano": "피아노",
  "writing": "쓰기 (write)",
  "stories": "이야기들 (story)",
  "solving": "풀기 (solve)",
  "puzzles": "퍼즐들",
  "problems": "문제들",
  "reading": "읽기 (read)",
  "speaking": "말하기 (speak)",
  "doing": "하기 (do)",
  "experiments": "실험들",
  "maps": "지도들",
  "telling": "말해 주기 (tell)",
  "old": "옛날의, 오래된",
  "songs": "노래들",
  "numbers": "숫자들",
  "colors": "색깔들",
  "sports": "운동, 스포츠",
};
