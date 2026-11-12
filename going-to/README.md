# 🍁 What are you going to do? · 나의 계획 말하기

천재(함) 6학년 9단원 **What are you going to do?** 수업용 웹 앱입니다.
설치 없이 `index.html`을 열거나 GitHub Pages 주소로 들어가면 바로 동작합니다. (가을 테마)

| 역할 | 표현 |
|---|---|
| 🙋 묻기 | **What are you going to do ___?** (this afternoon · tonight · tomorrow · this weekend · this winter vacation) |
| 🙆 대답 | **I'm going to ___.** |

새 단원 앱은 저장소 맨 위([`../`](../README.md), How much are these socks?)에, 이전 단원 앱은 [`favorite-subject/`](../favorite-subject/)(What's your favorite subject?), [`invite/`](../invite/)(Can you come to the ___?)에 있습니다.
GitHub Pages에서는 기본 주소 뒤에 `/going-to/`를 붙여 열어요.

## 기능

### 🎨 활동 카드 (초급) · 🎨 활동 카드 (중급)
1. **1️⃣ 질문을 골라요** — Q1~Q5 버튼(번호 · 이모지 · 한국어 · 영어). 계획을 고른 질문은 ✓와 활동 이모지가 붙어요.
2. **말풍선 대화** — 🙋 친구 *What are you going to do this afternoon?* / 🙆 나 *I'm going to ____.*
   한국어 뜻, 줄마다 🔊, [🔊 대화 듣기] [다음 질문 ▶] [🎤 연습하기로 가기], 상태 안내.
3. **2️⃣ 할 일 고르기** — 필터 [전체] [📘 교과서 표현] [종류 5개] [⭐ 지금 질문에 어울리는 것만]
   - 카드: 종류 태그(+📘 교과서 · ⭐ 추천), Canva 그림, 문장(단어를 누르면 **뜻 풍선 + 발음**), 한국어, 🔊
   - **✅ 오늘 오후에 할래요** → 지금 질문의 대답이 되어 말풍선 빈칸이 채워지고, 질문+대답을 읽어 주고, 연습하기에 바로 담겨요. 다시 누르면 빠져요. 질문 하나에 계획은 1개(다른 카드를 누르면 바뀜).
   - 초급: *I'm going to fly a kite.* / 중급: 누구와·어디서·무엇을 하러를 붙인 긴 문장 *I'm going to fly a kite on the hill.*
   - 초급·중급 어느 탭에서 골라도 **같은 계획표**에 저장돼요(질문별 `{활동 id, level}`, 브라우저 localStorage).

### 🎤 연습하기 (탭 배지 예: 2/5)
- 맨 위 요약: 🎙️ 총 연습 n회 · 📊 평균 정확도 % · ✅ 연습한 문장 n/5, [🧹 기록 지우기] [🔊 전체 듣기] [🖨️ 인쇄하기]
- **📅 나의 계획표 · My Plans** — 질문 5줄. 줄마다 언제(한국어+영어), Q 문장, A 문장, 한국어, 그림, 🔊, ✕(빼기). 비어 있으면 *A. I'm going to ____.* + “활동 카드에서 골라요”.
- 줄마다 **[🎙️ 말하기] [▶ 내 목소리]** “이번 % · 평균 % · 최고 % · n회”
  - Web Speech API 음성 인식(en-US, interimResults, maxAlternatives 5, 9초 제한) + MediaRecorder 녹음을 동시에 해요.
  - 말하는 동안 “👂 들리는 말”이 실시간으로 보이고, 끝나면 녹음을 ▶ 내 목소리로 들을 수 있어요.
  - 기록(횟수 · 최고 · 점수 합계 → 평균)은 localStorage에 저장돼요. 녹음은 새로고침하면 사라져요.
  - 음성 인식이 없는 브라우저는 4초 녹음만, 둘 다 없으면 버튼이 꺼지고 “Chrome 권장”이 보여요.
- 🖨️ 인쇄하면 **계획표만** 나와요(버튼 · 마이크 도구 숨김).

## 🎯 발음 채점 방식 (`score.js`)
1. **정리**: 줄임말 펼치기(I'm → i am, I'll → i will …), 동음어 통일(too/two → to, four → for), 한 글자씩 들린 말 붙이기(“p c” → pc).
2. **정렬**: 목표 문장과 들린 말을 단어 **순서대로** 동적 계획법(가중 LCS)으로 맞춰요.
3. **단어 점수**: 같음 1 · 철자 1글자 차이 0.85 · 소리 비슷 0.7(자음만 통일: r/l, f/p, v/b, th/s, c/k … 모음은 유지해서 kite ≠ cat) · 비슷한 편 0.5 · 그 외 0
4. **가중치**: 핵심 단어 1(going 포함) · 작은 단어(a, the, to, my, i, am …) 0.3 · 지명(대문자 고유명사) 0.6
5. **감점**: 덧붙인 말 1개당 3%, 최대 10%. 보너스 없음. 후보 최대 5개 중 최고 점수를 써요.
6. **결과**: ⭐ 85%↑ / 👍 60%↑ / 🔁 그 아래 · 단어 칩 🟩 맞음 🟨 비슷함 🟥 놓침(I'm은 한 칩) · “🔁 다시 들어 볼 단어: 🔊 kite” · “컴퓨터가 들은 말: …”

| 목표: *I'm going to fly a kite.* | 점수 |
|---|---|
| 정확히 말함 | 100 |
| … fly a **cat** | 73 |
| *fly a kite* 만 | 55 |
| 순서 뒤섞임 | 14 |

## 📚 활동 60개 (5종류 × 12)
📘 = 교과서 표현(같은 종류 안에서 맨 앞). 가을과 어울리지 않는 활동(눈사람·스키 등)은 빼고 사과 따기 · 단풍 구경 · 밤 줍기 · 고구마 캐기 · 낙엽 쓸기 같은 가을 활동을 넣었어요.

<!-- ACTIVITIES -->

**🏠 집·학교에서**

| 초급 | 중급 | 뜻 |
|---|---|---|
| 📘 stay home | stay home and rest with my cat | 집에 있을 |
| 📘 clean my room | clean my room with my brother | 내 방을 청소할 |
| 📘 study math | study math at the library | 수학 공부를 할 |
| read a book | read a book under the maple tree | 책을 읽을 |
| do my homework | do my homework with my friend | 숙제를 할 |
| play computer games | play computer games with my cousin | 컴퓨터 게임을 할 |
| watch a movie | watch a movie with my family at home | 영화를 볼 |
| draw pictures | draw pictures of autumn leaves | 그림을 그릴 |
| practice the piano | practice the piano for the school concert | 피아노 연습을 할 |
| rake leaves | rake leaves in the yard with my dad | 낙엽을 쓸 |
| write in my diary | write in my diary before bed | 일기를 쓸 |
| make a leaf bookmark | make a leaf bookmark for my teacher | 나뭇잎 책갈피를 만들 |

**⚽ 운동·놀이**

| 초급 | 중급 | 뜻 |
|---|---|---|
| 📘 watch a baseball game | watch a baseball game at the stadium | 야구 경기를 볼 |
| play soccer | play soccer with my friends at the park | 축구를 할 |
| play basketball | play basketball in the school gym | 농구를 할 |
| ride my bike | ride my bike along the river | 자전거를 탈 |
| fly a kite | fly a kite on the hill | 연을 날릴 |
| go hiking | go hiking with my uncle on the mountain | 등산을 갈 |
| play badminton | play badminton with my mom in the park | 배드민턴을 칠 |
| go inline skating | go inline skating with my best friend | 인라인스케이트를 타러 갈 |
| jump rope | jump rope in the playground | 줄넘기를 할 |
| play dodgeball | play dodgeball with my classmates | 피구를 할 |
| learn taekwondo | learn taekwondo at the taekwondo school | 태권도를 배울 |
| run a relay race | run a relay race on sports day | 이어달리기를 할 |

**📍 장소에 가기**

| 초급 | 중급 | 뜻 |
|---|---|---|
| go to a PC room | go to a PC room with my friends | PC방에 갈 |
| go to a comic book cafe | go to a comic book cafe to read comics | 만화 카페에 갈 |
| go to a coin karaoke room | go to a coin karaoke room to sing songs | 코인노래방에 갈 |
| go to the library | go to the library to borrow books | 도서관에 갈 |
| go to the bookstore | go to the bookstore to buy a new book | 서점에 갈 |
| go to the shopping mall | go to the shopping mall to buy a winter jacket | 쇼핑몰에 갈 |
| go to the bakery | go to the bakery to buy sweet potato bread | 빵집에 갈 |
| go to an escape room | go to an escape room with my sister | 방탈출 카페에 갈 |
| go to a trampoline park | go to a trampoline park to jump high | 트램펄린 파크에 갈 |
| go to a cat cafe | go to a cat cafe to play with cats | 고양이 카페에 갈 |
| go to the hair salon | go to the hair salon to get a haircut | 미용실에 갈 |
| go to the dentist | go to the dentist with my mom | 치과에 갈 |

**👨‍👩‍👧 가족과 함께**

| 초급 | 중급 | 뜻 |
|---|---|---|
| 📘 visit my grandparents | visit my grandparents in the countryside | 조부모님 댁에 갈 |
| 📘 go camping | go camping with my family by the lake | 캠핑을 갈 |
| pick apples | pick apples at my uncle's farm | 사과를 딸 |
| see the autumn leaves | see the autumn leaves in the mountains | 단풍 구경을 할 |
| pick up chestnuts | pick up chestnuts with my grandma | 밤을 주울 |
| go fishing | go fishing with my dad at the river | 낚시하러 갈 |
| eat out | eat out with my family at a restaurant | 외식을 할 |
| go on a picnic | go on a picnic at the park with my family | 소풍을 갈 |
| visit the zoo | visit the zoo to see the pandas | 동물원에 갈 |
| dig sweet potatoes | dig sweet potatoes on my grandpa's farm | 고구마를 캘 |
| bake cookies | bake cookies with my mom in the kitchen | 쿠키를 구울 |
| watch the fireworks | watch the fireworks at the festival | 불꽃놀이를 볼 |

**✈️ 가족 여행**

| 초급 | 중급 | 뜻 |
|---|---|---|
| travel to Jeju Island | travel to Jeju Island to pick tangerines | 제주도로 여행을 갈 |
| visit Gyeongju | visit Gyeongju to see Bulguksa Temple | 경주에 갈 |
| go to Busan | go to Busan to see the sea | 부산에 갈 |
| climb Seoraksan | climb Seoraksan with my family | 설악산에 오를 |
| visit Jeonju | visit Jeonju to eat bibimbap | 전주에 갈 |
| visit Suncheon Bay | visit Suncheon Bay to see the reeds | 순천만에 갈 |
| visit Andong | visit Andong to see the mask dance | 안동에 갈 |
| travel to Seoul | travel to Seoul to see Namsan Tower | 서울로 여행을 갈 |
| go to Gangneung | go to Gangneung to see the sunrise | 강릉에 갈 |
| visit Yeosu | visit Yeosu to ride the cable car | 여수에 갈 |
| take a train trip | take a train trip with my grandparents | 기차 여행을 할 |
| travel to Japan | travel to Japan with my family | 일본으로 여행을 갈 |

<!-- /ACTIVITIES -->

## 🖼️ 그림 바꾸는 법
- 그림은 `images/<활동 id>.png` 파일을 그대로 불러와요(예: `images/fly-kite.png`). 같은 이름으로 덮어쓰면 바로 바뀌어요.
- 파일이 없거나 못 불러오면 카드에 **이모지 타일**이 대신 나와요.
- 지금 그림은 모두 Canva generate-image로 만든 것이에요(미리보기 크기 약 200×150 → 카드에서 `object-fit: contain`, 흰 배경).
  프롬프트 · 장면 · Canva 미디어 ID는 [`CANVA_IMAGES.md`](CANVA_IMAGES.md)에 있어요. 원본(큰 그림)은 Canva 업로드 항목에서 내려받을 수 있어요.
- 활동을 새로 넣으면 `data.js`에 항목을 추가하고, 장면을 `tools/scenes.js`에 적은 뒤 그림을 `images/<id>.png`로 넣고 `node test/check-data.js`로 확인하세요.

## 📁 파일 구성
| 파일 | 내용 |
|---|---|
| `index.html` | 화면 틀(탭 3개) |
| `style.css` | 가을 테마 · 휴대폰 · 인쇄 스타일 |
| `data.js` | 질문 5개 · 활동 60개 · 단어 뜻 사전 |
| `score.js` | 발음 채점 함수(브라우저·Node 공용) |
| `app.js` | 카드 · 말풍선 · 계획표 · 음성 · 녹음 |
| `images/` | Canva 그림 60장 |
| `test/score.test.js` | 채점 단위 테스트 — `node test/score.test.js` |
| `test/check-data.js` | 사전 누락 · 그림 누락 점검 — `node test/check-data.js` |
| `test/e2e.js` | Playwright 브라우저 테스트(가짜 마이크 · 가짜 음성 인식) — `node test/e2e.js` |
| `tools/` | Canva 장면 목록 · 미디어 ID · 문서 생성 스크립트 |

## ✅ 수업 전 확인하세요
- **Chrome(또는 Edge)** 을 쓰세요. 음성 인식(Web Speech API)은 Chrome 계열에서 가장 잘 돼요. 인터넷 연결이 필요해요.
- 처음 🎙️ 말하기를 누르면 **마이크 권한**을 물어요 → 허용. GitHub Pages(https)나 `localhost`에서 열어야 마이크를 쓸 수 있어요.
- 자동 테스트는 가짜 마이크 · 가짜 음성 인식으로만 했어요. **실제 마이크로 한 번 직접 말해 보고** 점수가 잘 나오는지 확인해 주세요.
- 계획표 · 연습 기록은 그 컴퓨터(브라우저)에만 저장돼요. 공용 컴퓨터라면 수업이 끝난 뒤 🧹 기록 지우기를 눌러 주세요.
