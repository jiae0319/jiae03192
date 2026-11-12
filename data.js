// 6학년 영어 · How much are these socks? — 데이터
// 가격 10가지(1,000원 ~ 10,000원) · 물건 4종류 × 5개 = 20개 · 대화 틀 · 단어 뜻 사전

// 💰 가격 10가지 (천 원 단위)
const PRICES = [
  { won: 1000,  en: "one thousand",   ko: "천" },
  { won: 2000,  en: "two thousand",   ko: "이천" },
  { won: 3000,  en: "three thousand", ko: "삼천" },
  { won: 4000,  en: "four thousand",  ko: "사천" },
  { won: 5000,  en: "five thousand",  ko: "오천" },
  { won: 6000,  en: "six thousand",   ko: "육천" },
  { won: 7000,  en: "seven thousand", ko: "칠천" },
  { won: 8000,  en: "eight thousand", ko: "팔천" },
  { won: 9000,  en: "nine thousand",  ko: "구천" },
  { won: 10000, en: "ten thousand",   ko: "만" },
];

// 💬 가게 대화 틀 (주요 표현)
const DIALOG = {
  greet:  { en: "May I help you?", ko: "도와 드릴까요? (어서 오세요)" },
  yes:    { en: "Yes, please.",    ko: "네, 부탁해요." },
};

const CATEGORIES = [
  { id: "clothes", emoji: "👕", ko: "옷" },
  { id: "shoes",   emoji: "👟", ko: "신발" },
  { id: "acc",     emoji: "🕶️", ko: "액세서리" },
  { id: "school",  emoji: "✏️", ko: "학용품" },
];

// en/ko: 초급(these ___) · mid: 중급(색깔·모양을 붙인 말) · price: 처음 가격(원) · book: 교과서 표현
const ITEMS = [
  // 👕 옷
  { id: "socks", cat: "clothes", book: true, emoji: "🧦", en: "socks", ko: "양말", price: 2000, mid: { en: "striped socks", ko: "줄무늬 양말" } },
  { id: "gloves", cat: "clothes", emoji: "🧤", en: "gloves", ko: "장갑", price: 5000, mid: { en: "warm gloves", ko: "따뜻한 장갑" } },
  { id: "mittens", cat: "clothes", emoji: "🧤", en: "mittens", ko: "벙어리장갑", price: 4000, mid: { en: "red mittens", ko: "빨간 벙어리장갑" } },
  { id: "shorts", cat: "clothes", emoji: "🩳", en: "shorts", ko: "반바지", price: 7000, mid: { en: "blue shorts", ko: "파란 반바지" } },
  { id: "pants", cat: "clothes", emoji: "👖", en: "pants", ko: "바지", price: 9000, mid: { en: "brown pants", ko: "갈색 바지" } },

  // 👟 신발
  { id: "slippers", cat: "shoes", emoji: "🥿", en: "slippers", ko: "실내화", price: 3000, mid: { en: "pink slippers", ko: "분홍색 실내화" } },
  { id: "sandals", cat: "shoes", emoji: "🩴", en: "sandals", ko: "샌들", price: 6000, mid: { en: "summer sandals", ko: "여름 샌들" } },
  { id: "sneakers", cat: "shoes", emoji: "👟", en: "sneakers", ko: "운동화", price: 10000, mid: { en: "white sneakers", ko: "하얀 운동화" } },
  { id: "boots", cat: "shoes", emoji: "🥾", en: "boots", ko: "부츠", price: 9000, mid: { en: "brown boots", ko: "갈색 부츠" } },
  { id: "rain-boots", cat: "shoes", emoji: "🌧️", en: "rain boots", ko: "장화", price: 8000, mid: { en: "yellow rain boots", ko: "노란 장화" } },

  // 🕶️ 액세서리
  { id: "hairpins", cat: "acc", emoji: "⭐", en: "hairpins", ko: "머리핀", price: 1000, mid: { en: "star hairpins", ko: "별 모양 머리핀" } },
  { id: "earmuffs", cat: "acc", emoji: "🎧", en: "earmuffs", ko: "귀마개", price: 5000, mid: { en: "fluffy earmuffs", ko: "복슬복슬한 귀마개" } },
  { id: "sunglasses", cat: "acc", emoji: "🕶️", en: "sunglasses", ko: "선글라스", price: 7000, mid: { en: "black sunglasses", ko: "검은 선글라스" } },
  { id: "glasses", cat: "acc", emoji: "👓", en: "glasses", ko: "안경", price: 8000, mid: { en: "round glasses", ko: "동그란 안경" } },
  { id: "earphones", cat: "acc", emoji: "🎵", en: "earphones", ko: "이어폰", price: 10000, mid: { en: "white earphones", ko: "하얀 이어폰" } },

  // ✏️ 학용품
  { id: "stickers", cat: "school", emoji: "🐶", en: "stickers", ko: "스티커", price: 1000, mid: { en: "animal stickers", ko: "동물 스티커" } },
  { id: "erasers", cat: "school", emoji: "🧽", en: "erasers", ko: "지우개", price: 2000, mid: { en: "pink erasers", ko: "분홍색 지우개" } },
  { id: "crayons", cat: "school", emoji: "🖍️", en: "crayons", ko: "크레파스", price: 3000, mid: { en: "rainbow crayons", ko: "무지개색 크레파스" } },
  { id: "colored-pencils", cat: "school", emoji: "✏️", en: "colored pencils", ko: "색연필", price: 6000, mid: { en: "new colored pencils", ko: "새 색연필" } },
  { id: "markers", cat: "school", emoji: "🖊️", en: "markers", ko: "마커", price: 4000, mid: { en: "green markers", ko: "초록색 마커" } },
];

// 단어 뜻 사전 (소문자 키) — 모든 문장의 단어가 있어야 함 (test/check-data.js로 확인)
const DICT = {
  // 주요 표현
  "how": "어떻게, 얼마나", "much": "많이 (How much: 얼마)", "are": "~이다 (are)", "these": "이것들 (가까이 있는 여러 개)",
  "they": "그것들", "won": "원 (한국 돈 단위)", "may": "~해도 될까요?", "i": "나", "help": "돕다", "you": "너, 당신",
  "yes": "네", "please": "부탁해요, 제발",
  // 물건
  "socks": "양말", "gloves": "장갑", "mittens": "벙어리장갑", "shorts": "반바지", "pants": "바지",
  "slippers": "실내화, 슬리퍼", "sandals": "샌들", "sneakers": "운동화", "boots": "부츠, 장화", "rain": "비 (rain boots: 장화)",
  "hairpins": "머리핀", "earmuffs": "귀마개", "sunglasses": "선글라스", "glasses": "안경", "earphones": "이어폰",
  "stickers": "스티커", "erasers": "지우개", "crayons": "크레파스, 크레용", "colored": "색깔이 있는", "pencils": "연필들 (colored pencils: 색연필)",
  "markers": "마커, 사인펜",
  // 중급 꾸미는 말
  "striped": "줄무늬의", "warm": "따뜻한", "red": "빨간", "blue": "파란", "brown": "갈색의", "pink": "분홍색의",
  "summer": "여름 (여름용)", "white": "하얀", "yellow": "노란", "star": "별 (별 모양의)", "fluffy": "복슬복슬한, 폭신한",
  "black": "검은", "round": "동그란", "animal": "동물", "rainbow": "무지개 (무지개색의)", "new": "새로운", "green": "초록색의",
  // 숫자 말
  "thousand": "천 (1,000)", "one": "하나 (1)", "two": "둘 (2)", "three": "셋 (3)", "four": "넷 (4)", "five": "다섯 (5)",
  "six": "여섯 (6)", "seven": "일곱 (7)", "eight": "여덟 (8)", "nine": "아홉 (9)", "ten": "열 (10)",
};
// 가격 숫자 (예: "2,000" → 이천)
PRICES.forEach((p) => { DICT[p.won.toLocaleString("en-US")] = `${p.ko} (${p.en})`; });

if (typeof module !== "undefined") module.exports = { PRICES, DIALOG, CATEGORIES, ITEMS, DICT };
