# NIHON v3 배포 — 딱 3번의 클릭 흐름

예전 파일 삭제 필요 없음. 이 zip의 내용물이 구버전 경로까지 전부 덮어씁니다.

## 1️⃣ Supabase 스키마 (2분)
https://supabase.com/dashboard/projects → 내 프로젝트 → SQL Editor
→ `supabase/schema-v2.sql` 내용 전체 붙여넣기 → Run
(기존 jp_* 테이블은 안 건드림)

## 2️⃣ GitHub 업로드 (2분)
https://github.com/seonghun4997/nihon/upload/main
→ 압축 푼 폴더 **안의 내용물 전부**를 드래그 (폴더 자체 ❌)
→ Commit changes → Vercel 자동 배포 (2~3분)

## 3️⃣ 관리자 가입 (1분)
https://nihon-kappa.vercel.app/signup
→ 관리자 코드 칸에 **ACCESS_CODE 값** 입력해 가입 → 운영자 콘솔 진입

## 그 다음 (실전 페어 세팅)
1. 선생님에게 https://nihon-kappa.vercel.app/signup 전달 (관리자 코드 없이 가입)
2. 운영자 콘솔에서 승인 ✓
3. 선생님: 학생 탭 → 초대 링크 만들기 → 학생에게 카톡
4. 학생 가입(녹음 동의 체크) → 선생님이 학생 상세에서 요금·정기 슬롯 설정 → 가동 🎉

환경변수 추가 없음 (기존 7개 그대로). 크론 경로는 자동 전환.
빌드 실패 시: https://vercel.com/jari3/nihon → Deployments → 실패 로그 복사해서 전달.
