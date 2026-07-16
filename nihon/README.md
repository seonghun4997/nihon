# 🇯🇵 nihon — 일본어 허브 (v1)

"내 수업이 교재다" — 기획 v2 구현체. 모바일 최적화, 오너 단독 1계정, noindex.

- **/jp** 오늘 (루프 타임라인: 10분 복습 → 노트 만들기 → 내일 주제 → 이어하기)
- **/jp/notes** 수업 노트 아카이브 + 검색 · **/jp/cards** 단어 SRS + ⭐헷갈림 + 가나 드릴(95% 자동 은퇴)
- **/jp/questions** 질문 박스 (AI 즉답 + 선생님께 물어보기 체크) · **/jp/talk** 이어하기 회화 (3턴 완료)
- 문자: 아침 7시 복습 문자 · 수업 전날 밤 9시 주제 카드 문자 (솔라피, 키 없으면 자동 건너뜀)

---

## 셋업 (클릭 단위 — 순서대로 30분)

### 1. GitHub 저장소
1. github.com → 우상단 **+** → **New repository**
2. 이름 `nihon` → **Private** 선택 → **Create repository**
3. 이 폴더에서 터미널:
   ```bash
   git init && git add -A && git commit -m "jp hub v1"
   git branch -M main
   git remote add origin https://github.com/<내아이디>/nihon.git
   git push -u origin main
   ```

### 2. Supabase 새 프로젝트
1. supabase.com → **New project** → 이름 `nihon` → 리전 Seoul → 비밀번호 아무거나 생성 → **Create**
2. 생성 완료되면 좌측 **SQL Editor** → **New query** → 이 저장소의 `supabase/schema.sql` 내용 전체 붙여넣기 → **Run** (초록 Success 뜨면 끝)
3. 좌측 **Project Settings(톱니)** → **API** 탭에서 두 개 복사해 두기:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** 키 (secret 쪽) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Vercel 새 프로젝트
1. vercel.com → **Add New… → Project** → 방금 만든 `nihon` 저장소 **Import**
2. **Environment Variables** 펼쳐서 아래 값 입력 (`.env.example` 참고):

   | 키 | 값 |
   |---|---|
   | `ACCESS_CODE` | 접속 코드 (길고 아무렇게나 — 로그인할 때 이걸 입력) |
   | `SUPABASE_URL` | 2-3에서 복사한 URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | 2-3에서 복사한 키 |
   | `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys에서 발급 |
   | `CLAUDE_MODEL` | `claude-sonnet-4-6` |
   | `CRON_SECRET` | 아무 긴 문자열 (Vercel이 크론 호출할 때 씀) |
   | `APP_URL` | 일단 비워두고 배포 후 채움 |
   | `SOLAPI_API_KEY` 등 4개 | 문자 켤 때 입력 (없어도 앱은 정상 동작) |

3. **Deploy** 클릭 → 끝나면 나오는 도메인(예: `nihon.vercel.app`)을 복사
4. **Settings → Environment Variables** → `APP_URL`에 `https://그도메인` 입력 → **Redeploy**

### 4. 폰에 설치 (PWA)
배포 도메인을 폰 브라우저로 열기 → 접속 코드 입력 → 공유 버튼 → **홈 화면에 추가**. 앱처럼 뜹니다.

### 5. 솔라피 문자 켜기 (선택 — 나중에 해도 됨)
solapi.com → API Key 발급 + 발신번호 등록 → Vercel 환경변수 `SOLAPI_API_KEY / SOLAPI_API_SECRET / SOLAPI_FROM / SOLAPI_TO` 채우고 Redeploy.
크론은 `vercel.json`에 이미 설정돼 있음 (아침 7시 KST 복습 / 밤 9시 KST 주제 — UTC로 22:00, 12:00).

---

## 로컬 개발
```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:3000
```

## 구조 메모 (기획 v2 대응)
- 라우트 전부 `/jp/…` 네임스페이스 — 나중에 관문(허브 타일)·타 허브가 `/` 와 다른 네임스페이스로 입주
- 디깅(광고정찰소)과 접점 0 — 코드·DB 완전 분리, 솔라피/Claude는 계정 키만 이 앱 env에 별도 등록
- 테이블: `jp_lessons` `jp_words` `jp_confusions` `jp_questions` + 운영용 `jp_topics` `jp_kana` `jp_talks` `jp_activity`
- 단계: **J1** 노트 엔진+10분+가나 ✅ · **J2** 주제 카드+전날 발송+질문 박스 ✅ · **J3** 이어하기 회화 ✅ (v1에 전부 포함)

## 오너 확인 2개 (기획 v2 §5 그대로)
1. 다글로에서 텍스트 복사/내보내기 되는지 앱에서 한 번 확인 (화자 구분 포함이면 헷갈림 감지 정확도↑)
2. 녹음은 선생님께 한마디 동의 받아두기
