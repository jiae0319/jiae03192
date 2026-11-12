# 🛍️ How much are these socks? · 물건 값 묻고 답하기

6학년 영어 **How much are these socks?** 단원 수업용 웹 앱입니다.
설치 없이 `index.html`을 열거나 GitHub Pages 주소로 들어가면 바로 동작합니다. (가게 테마)
이전 단원 앱과 같은 구성(초급·중급 카드 · 말풍선 대화 · 단어 뜻 풍선 · 🎙️ 말하기 채점 · 녹음 · 인쇄)으로 만들었어요.

| 역할 | 표현 |
|---|---|
| 🧑‍💼 점원 | **May I help you?** (도와 드릴까요?) |
| 🙋 손님 | **Yes, please. How much are these socks?** (네. 이 양말은 얼마예요?) |
| 🧑‍💼 점원 | **They are 2,000 won.** (2,000원이에요.) |

이전 단원 앱은 [`going-to/`](going-to/)(What are you going to do?), [`favorite-subject/`](favorite-subject/)(What's your favorite subject?), [`invite/`](invite/)(Can you come to the ___?)에 있습니다.
GitHub Pages에서는 기본 주소 뒤에 폴더 이름을 붙여 열어요(예: `/going-to/`).

## 💰 가격 10가지 (천 원 단위)

| 1,000원 | 2,000원 | 3,000원 | 4,000원 | 5,000원 | 6,000원 | 7,000원 | 8,000원 | 9,000원 | 10,000원 |
|---|---|---|---|---|---|---|---|---|---|
| one thousand | two thousand | three thousand | four thousand | five thousand | six thousand | seven thousand | eight thousand | nine thousand | ten thousand |

## 기능

### 🛍️ 물건 카드 (초급) · 🛍️ 물건 카드 (중급)
1. **1️⃣ 가게 대화** — Canva 그림 + 가격표, 말풍선 3줄(🧑‍💼 *May I help you?* → 🙋 *Yes, please. How much are these socks?* → 🧑‍💼 *They are 2,000 won.*), 한국어 뜻, 줄마다 🔊
   [🔊 대화 듣기](점원·손님 목소리 높이를 다르게) [🎲 다른 물건] [🛒 장바구니에 담기] [🎤 연습하기로 가기]
2. **2️⃣ 가격 정하기** — 내가 점원이 되어 1,000원~10,000원 중 값을 골라요. 대화·카드·연습 문장이 바로 바뀌고 읽어 줘요. [↺ 처음 가격]
3. **3️⃣ 물건 고르기** — 필터 [전체] [📘 교과서 표현] [👕 옷] [👟 신발] [🕶️ 액세서리] [✏️ 학용품] [🛒 담은 것만]
   - 카드: 종류 태그, 그림(가격표), 🙋 질문 · 🧑‍💼 대답(단어를 누르면 **뜻 풍선 + 발음**, `2,000`을 누르면 *two thousand*), 한국어, 🔊
   - **💬 물어보기**(그림을 눌러도 돼요) → 위 대화가 그 물건으로 바뀌고 대화를 읽어 줘요.
   - **🛒 담기** → 연습하기 쇼핑 목록에 담겨요(최대 5개). 다시 누르면 빠지고, 다른 단계 탭에서 누르면 그 단계 문장으로 바뀌어요.
   - 초급: *How much are these socks?* / 중급: 색깔·모양을 붙인 *How much are these striped socks?*
   - 한국어는 받침에 맞춰 *이 양말은 / 이 장화는* 으로 나와요.

### 💰 가격 익히기
- 가격 카드 10장: 숫자 · 💵 지폐 개수 · *one thousand won* · *They are 1,000 won.* — 누르면 읽어 줘요.
- 🎧 **가격 듣기 퀴즈**: 물건 그림과 질문을 보고, 점원 대답을 듣고 10가지 가격 중 골라요. 정답·오답 표시, 맞힌 문제 n / m.

### 🎤 연습하기 (탭 배지 예: 2/5)
- 맨 위 요약: 🎙️ 총 연습 n회 · 📊 평균 정확도 % · ✅ 연습한 문장 n/m, [🧹 기록 지우기] [🔊 전체 듣기] [🖨️ 인쇄하기]
- **👋 인사하기**: *May I help you?* / *Yes, please.* 를 따로 말하기 연습
- **🛒 나의 쇼핑 목록**: 담은 물건 5칸(빈칸은 “물건 카드에서 담아요”), 대화 3줄 + 💰 합계, 🔊 ✕
  - 물건마다 🙋 손님 문장(질문)과 🧑‍💼 점원 문장(대답)을 각각 **[🎙️ 말하기] [▶ 내 목소리]** “이번 % · 평균 % · 최고 % · n회”
  - Web Speech API 음성 인식(en-US, 실시간 “👂 들리는 말”, 후보 5개, 9초) + MediaRecorder 녹음. 기록은 localStorage에 저장.
  - 음성 인식이 없는 브라우저는 4초 녹음만, 둘 다 없으면 버튼이 꺼지고 “Chrome 권장”.
- 🖨️ 인쇄하면 인사 + 쇼핑 목록만 나와요.

## 🎯 발음 채점 방식 (`score.js`)
이전 단원의 채점(단어 순서 정렬 · 가중치 · 덧붙인 말 감점)을 그대로 쓰고, **가격**을 위해 다음을 더했어요.
1. **숫자 읽기**: 음성 인식이 `2000`, `2,000`, `₩2,000`, `two thousand` 중 무엇으로 받아 적어도 모두 같은 가격(한 덩어리)으로 맞춰 봐요.
2. **won ↔ one**: *two thousand one*처럼 thousand 뒤에 들린 *one*은 *won*(원)으로 봐요. *They're* = *They are*.
3. **가격은 정확해야 해요**: 가격 단어는 가중치 2, 비슷한 숫자도 0점(2,000 ≠ 3,000) → 가격을 틀리면 🔁, 칩 🟥 *2,000*.

| 목표: *They are 2,000 won.* | 점수 |
|---|---|
| they are 2000 won / they are two thousand one | 100 |
| they're ₩2,000 | 100 |
| they are **3000** won | 50 🔁 |

## 📚 물건 20개 (4종류 × 5)
📘 = 교과서 표현. 짝이 있거나 여러 개인 물건만 골라 **these / They are** 로 말해요.

<!-- ITEMS -->

**👕 옷**

| 초급 | 중급 | 뜻 | 처음 가격 |
|---|---|---|---|
| 📘 these socks | these striped socks | 양말 | 2,000원 |
| these gloves | these warm gloves | 장갑 | 5,000원 |
| these mittens | these red mittens | 벙어리장갑 | 4,000원 |
| these shorts | these blue shorts | 반바지 | 7,000원 |
| these pants | these brown pants | 바지 | 9,000원 |

**👟 신발**

| 초급 | 중급 | 뜻 | 처음 가격 |
|---|---|---|---|
| these slippers | these pink slippers | 실내화 | 3,000원 |
| these sandals | these summer sandals | 샌들 | 6,000원 |
| these sneakers | these white sneakers | 운동화 | 10,000원 |
| these boots | these brown boots | 부츠 | 9,000원 |
| these rain boots | these yellow rain boots | 장화 | 8,000원 |

**🕶️ 액세서리**

| 초급 | 중급 | 뜻 | 처음 가격 |
|---|---|---|---|
| these hairpins | these star hairpins | 머리핀 | 1,000원 |
| these earmuffs | these fluffy earmuffs | 귀마개 | 5,000원 |
| these sunglasses | these black sunglasses | 선글라스 | 7,000원 |
| these glasses | these round glasses | 안경 | 8,000원 |
| these earphones | these white earphones | 이어폰 | 10,000원 |

**✏️ 학용품**

| 초급 | 중급 | 뜻 | 처음 가격 |
|---|---|---|---|
| these stickers | these animal stickers | 스티커 | 1,000원 |
| these erasers | these pink erasers | 지우개 | 2,000원 |
| these crayons | these rainbow crayons | 크레파스 | 3,000원 |
| these colored pencils | these new colored pencils | 색연필 | 6,000원 |
| these markers | these green markers | 마커 | 4,000원 |

<!-- /ITEMS -->

## 🖼️ 그림 바꾸는 법
- 그림은 `images/<물건 id>.png` 파일을 그대로 불러와요(예: `images/socks.png`). 같은 이름으로 덮어쓰면 바로 바뀌어요.
- 파일이 없거나 못 불러오면 **이모지 타일**이 대신 나와요.
- 지금 그림은 모두 Canva generate-image로 만든 것이에요. 프롬프트 · 장면 · Canva 미디어 ID는 [`CANVA_IMAGES.md`](CANVA_IMAGES.md)에 있어요.
- 물건을 새로 넣으면 `data.js`에 항목을 추가하고, 장면을 `tools/scenes.js`에 적은 뒤 그림을 `images/<id>.png`로 넣고 `node test/check-data.js`로 확인하세요.

## 📁 파일 구성
| 파일 | 내용 |
|---|---|
| `index.html` | 화면 틀(탭 4개) |
| `style.css` | 가게 테마 · 휴대폰 · 인쇄 스타일 |
| `data.js` | 가격 10가지 · 대화 틀 · 물건 20개 · 단어 뜻 사전 |
| `score.js` | 발음 채점 함수(숫자·가격 인식 포함, 브라우저·Node 공용) |
| `app.js` | 대화 · 가격 정하기 · 카드 · 가격 퀴즈 · 쇼핑 목록 · 음성 · 녹음 |
| `images/` | Canva 그림 20장 |
| `test/score.test.js` | 채점 단위 테스트 — `node test/score.test.js` |
| `test/check-data.js` | 가격표 · 사전 누락 · 그림 누락 점검 — `node test/check-data.js` |
| `test/e2e.js` | Playwright 브라우저 테스트(가짜 마이크 · 가짜 음성 인식) — `node test/e2e.js` |
| `tools/` | Canva 장면 목록 · 미디어 ID · 문서 생성 스크립트 |

## ✅ 수업 전 확인하세요
- **Chrome(또는 Edge)** 을 쓰세요. 음성 인식은 Chrome 계열에서 가장 잘 돼요. 인터넷 연결이 필요해요.
- 처음 🎙️ 말하기를 누르면 **마이크 권한**을 물어요 → 허용. GitHub Pages(https)나 `localhost`에서 열어야 마이크를 쓸 수 있어요.
- 자동 테스트는 가짜 마이크 · 가짜 음성 인식으로만 했어요. **실제 마이크로 가격 문장을 한 번 직접 말해 보고** 점수가 잘 나오는지 확인해 주세요.
- 쇼핑 목록 · 가격 · 연습 기록은 그 컴퓨터(브라우저)에만 저장돼요. 공용 컴퓨터라면 수업 뒤 🧹 기록 지우기와 ✕로 정리해 주세요.
