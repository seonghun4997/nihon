// NIHON 위젯 (iOS Scriptable용)
// 1) 앱스토어에서 무료 앱 "Scriptable" 설치
// 2) 새 스크립트 만들고 이 파일 내용 전체 붙여넣기
// 3) 아래 CODE 값을 내 접속 코드로 교체
// 4) 홈 화면 길게 누르기 → 위젯 추가 → Scriptable → 이 스크립트 선택
const CODE = "여기에_접속코드";
const URL = "https://nihon-kappa.vercel.app/api/widget?key=" + encodeURIComponent(CODE);

const r = new Request(URL);
let d = { total: 0, streak: 0, langs: { jp: { words: 0, speaks: 0 }, en: { words: 0, speaks: 0 } }, message: "" };
try { d = await r.loadJSON(); } catch (e) {}

const w = new ListWidget();
w.backgroundColor = new Color("#0b0b0d");
w.setPadding(14, 14, 14, 14);

const title = w.addText("◆ NIHON");
title.font = Font.boldSystemFont(11);
title.textColor = new Color("#3EDD8C");
w.addSpacer(6);

const big = w.addText(d.total > 0 ? `복습 ${d.total}개` : "오늘 몫 없음 🎉");
big.font = Font.boldSystemFont(22);
big.textColor = Color.white();
w.addSpacer(4);

const jp = d.langs?.jp || { words: 0, speaks: 0 };
const en = d.langs?.en || { words: 0, speaks: 0 };
const sub = w.addText(`🇯🇵 ${jp.words + jp.speaks} · 🇬🇧 ${en.words + en.speaks} · 🔥 ${d.streak}일`);
sub.font = Font.systemFont(11);
sub.textColor = new Color("#8a8a93");

w.url = "https://nihon-kappa.vercel.app/s/cards"; // 탭하면 복습으로 직행
Script.setWidget(w);
Script.complete();
