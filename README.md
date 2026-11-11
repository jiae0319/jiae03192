# What's your favorite subject? · 좋아하는 과목과 잘하는 것 말하기

6학년 영어 **좋아하는 과목 묻고 답하기** 단원 학습용 웹앱입니다.
이전 단원 *Can you come to the ___?* 앱([`invite/`](invite/))과 같은 구성(5개 탭 · 단어 뜻 풍선 · 말하기 채점 · 역할극)으로 만들었고, 📚 학교 테마 색을 사용합니다.

## 주요 표현

| 역할 | 표현 |
|------|------|
| 묻기 | **What's your favorite subject?** |
| 대답 | **My favorite subject is ___.** |
| 잘하는 것 | **I'm good at ___.** |

## 기능

- 📚 **좋아하는 과목** — 질문 카드 + 과목 10개 × 초급·중급·고급 = **30문장**
  - 📘 교과 과목: Korean · English · math · science · social studies · history
  - 🎨 예체능 과목: music · art · P.E. · practical arts
  - 고급은 `My favorite subject is ___. I'm good at ___.` 두 문장 이어 말하기
- 💪 **잘하는 것** — `I'm good at ___.` 카드 10개 + 빈칸 채우기
  - singing · dancing · drawing · running · swimming · cooking · playing soccer · playing the piano · writing stories · solving puzzles
- 🧩 **문장 만들기** — 과목 10 × 잘하는 것 10을 골라 두 문장 완성
- 🎒 **내 대답 만들기** (활동 2) — 카드 3개(과목 1 + 잘하는 것 1), 🎲 무작위 채우기, 📝 활동지에 적기 표
- 🎤 **연습 · 짝 활동** (활동 3) — 짝 활동 카드, 줄마다 🎙️ 말하기 정확도, 🎭 역할극(A 묻기 / B 대답하기)
- 단어 클릭 시 **뜻 풍선 + 발음**, 말하기 **속도 조절**

## 🎨 이미지 (Canva)

그림 카드는 `images/subjects/*.png`, `images/abilities/*.png` 를 불러옵니다.
Canva에서 만들 프롬프트와 파일명은 [`CANVA_IMAGES.md`](CANVA_IMAGES.md)에 정리되어 있습니다.
이미지가 아직 없으면 이모지 타일로 대신 보여 줍니다.

## 사용 방법

`index.html`을 브라우저(크롬 권장)에서 열면 됩니다. GitHub Pages 기본 주소에서 바로 열립니다.

## 파일 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 화면 구조(탭·섹션), 학교 테마 색 |
| `style.css`  | 기존 앱과 같은 디자인 |
| `data.js`    | 질문·과목·잘하는 것 문장, 이미지 경로, 단어 뜻 |
| `app.js`     | 음성·단어 풍선·대답 카드 만들기·연습(역할극) 채점 로직 |
| `CANVA_IMAGES.md` | Canva 이미지 프롬프트와 파일명 |
| `images/` | Canva 이미지를 넣는 폴더 |

## 📚 이전 단원

- [Can you come to the ___? · 친구 초대하기](invite/index.html) — `invite/` 폴더 (기본 주소 뒤에 `/invite/`)
