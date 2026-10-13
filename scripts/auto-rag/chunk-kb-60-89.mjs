// KB손해보험 개인용자동차보험 약관 PDF 60~89쪽(별표1~5, 시행령 상해·후유장애 구분표) 전용 청크 분할기.
// 쪽 배치에 맞춘 기준 문구를 쓰므로 다른 쪽/다른 약관에는 그대로 쓰지 말 것. 출력: kb_auto_rows.json
import fs from 'fs';

const raw = fs.readFileSync('kb_auto_60_89.txt', 'utf8');
const SOURCE = 'KB손해보험 개인용자동차보험 보통약관';

// 1) 페이지별 정리: 세로 탭(한 글자 줄), 쪽 머리말 제거
const pages = [];
for (const block of raw.split(/===== PAGE (\d+) =====/).slice(1).reduce((a, v, i, arr) => (i % 2 === 0 ? a.push([+v, arr[i + 1]]) : 0, a), [])) {
  const [page, text] = block;
  const lines = text.split('\n').filter(l => {
    const t = l.trim();
    if (!t) return false;
    if (/^[가-힣]$/.test(t)) return false;
    if (/^보통약관 \d+$/.test(t)) return false;
    if (/^\d+ KB개인용자동차보험$/.test(t)) return false;
    return true;
  });
  pages.push({ page, lines });
}
const all = pages.flatMap(p => p.lines.map(l => ({ page: p.page, l: l.replace(/\s+$/, '') })));
const idxOf = (re, from = 0) => all.findIndex((x, i) => i >= from && re.test(x.l));

const iInjury = idxOf(/^붙임붙임 자동차손해배상보장법시행령 \[별표1\]/);
const iInjuryNotes = idxOf(/^영역 내 용$/, iInjury);
const iDisab = idxOf(/^붙임붙임 자동차손해배상보장법시행령 \[별표2\]/);
const iBigo = idxOf(/^비 고$/, iDisab);

const rows = [];
const push = r => rows.push({ source: SOURCE, ...r });

// 2) 급수표 파서 (상해/후유장애 공통)
function parseGradeTable(seg, kind) {
  const HEADER = new Set(['상해', '장애', '급별', '급별 ', '보험', '가입금액 ', '가입금액', '상 해 부 위', '신체장애 내용']);
  const lines = seg.filter(x => !HEADER.has(x.l) && !/^\(자동차손해배상보장법시행령/.test(x.l) && !/^(상해의 구분|후유장애의 구분)/.test(x.l) && !/^붙임붙임/.test(x.l));
  let grade = null, amount = '', readingAmount = false, cur = null;
  const flush = () => { if (cur) { items.push(cur); cur = null; } };
  const items = [];
  for (const { l, page } of lines) {
    const g = l.match(/^(\d{1,2})급\s*(.*)$/);
    if (g && +g[1] <= 14) {
      flush();
      grade = +g[1];
      amount = '';
      const rest = g[2].trim();
      // "10급 1. 한쪽 눈..." 처럼 금액 없이 첫 항목이 붙고, 금액은 다음 쪽에 나오는 경우
      const itemOnly = rest.match(/^(\d{1,2})\.\s+(.*)$/);
      // "5급 900 1. 뇌손상..." 처럼 한 줄에 붙어 나오는 경우
      const inline = itemOnly ? null : rest.match(/^([\d,억천]+)\s*(만원)?\s*(\d+\..*)?$/);
      if (itemOnly) {
        cur = { grade, amount: null, no: +itemOnly[1], text: itemOnly[2], page };
        readingAmount = true;
      } else if (inline) {
        amount = inline[1];
        readingAmount = !inline[2];
        if (inline[3]) { readingAmount = false; amount += '만원'; const m = inline[3].match(/^(\d+)\.\s*(.*)$/); cur = { grade, amount, no: +m[1], text: m[2], page }; }
      } else readingAmount = true;
      continue;
    }
    if (readingAmount) {
      if (l.trim() === '만원') { amount += '만원'; readingAmount = false; continue; }
      if (/^[\d,억천]+$/.test(l.trim())) { amount += l.trim(); continue; }
      readingAmount = false;
      if (!amount.endsWith('만원')) amount += '만원';
    }
    const m = l.match(/^(\d{1,2})\.\s*(.*)$/);
    if (m && grade) { flush(); cur = { grade, amount, no: +m[1], text: m[2], page }; }
    else if (cur) cur.text += (/[가-힣a-zA-Z]$/.test(cur.text) && /^[가-힣]/.test(l) && !cur.text.endsWith(' ') ? '' : ' ') + l.trim();
  }
  flush();
  const gradeAmt = {};
  items.forEach(it => { if (it.amount) gradeAmt[it.grade] ??= it.amount; });
  items.forEach(it => { if (!it.amount) it.amount = gradeAmt[it.grade]; });
  const label = kind === 'injury' ? '상해' : '후유장애';
  const law = kind === 'injury' ? '자동차손해배상보장법 시행령 [별표1] 상해의 구분' : '자동차손해배상보장법 시행령 [별표2] 후유장애의 구분';
  for (const it of items) {
    push({
      kind: kind === 'injury' ? 'injury_grade' : 'disability_grade',
      section: law,
      grade: it.grade,
      amount: it.amount,
      item_no: it.no,
      page: it.page,
      title: `${label} ${it.grade}급 ${it.no}호`,
      content: `[${label} ${it.grade}급 · 책임보험 한도 ${it.amount}] ${it.no}. ${it.text.replace(/\s+/g, ' ').trim()}`,
    });
  }
  return items;
}

// 일반 텍스트를 소제목 경계 기준으로 ~1200자 단위로 묶기
function chunkText(seg, base, kind, maxLen = 1200) {
  let buf = [], len = 0, startPage = seg[0]?.page, part = 1;
  const out = () => {
    if (!buf.length) return;
    push({ kind, section: base, page: startPage, title: `${base} (${part++})`, content: `[${base}]\n` + buf.join('\n') });
    buf = []; len = 0;
  };
  for (const { l, page } of seg) {
    const isHead = /^([가-하]\.|\d+\.|[①-⑳]|\(\d+\)|별표|부 표)/.test(l.trim());
    if (len > maxLen && isHead) { out(); startPage = page; }
    if (!buf.length) startPage = page;
    buf.push(l); len += l.length;
  }
  out();
}

// 3) 59~62조 + 별표1~3 (상해급표 이전). PDF 배치상 소제목이 내용 중간에 끼어 나오므로 기준 문구로 구간을 자른다.
const NOISE = [/^사가 예금자 1인당/, /^다\. 직업과 장애부위의 관련표로/, /^여종의 직종별 계수/, /^\d{2,3}\) /, /^별표\d별표\d /, /^항목 지급 기준$/];
const front = all.slice(0, iInjury);
const find = (re, from = 0) => front.findIndex((x, i) => i >= from && re.test(x.l));
const b1 = find(/^별표1별표1 /);
const injuryStart = find(/^나\. 부 상$/, b1);
const disabIntro = find(/^다\. 후유장애$/, injuryStart);
const disabStart = find(/^나\. 지급기준 : 노동능력상실률에 따라/, disabIntro) - 2; // "1. 위 자 료 / 가. 청구권자" 포함
const propStart = find(/^1\. 수리비용$/, disabStart);
const b3 = find(/^별표3별표3 /, propStart);
const b4 = find(/^별표4별표4 /, b3);
const clean = seg => seg.filter(x => !NOISE.some(re => re.test(x.l)));

const disabIntroLines = front.slice(disabIntro, disabIntro + 3); // "다. 후유장애" + 안내문 2줄
const injurySeg = front.slice(injuryStart, disabStart).filter((_, i) => i + injuryStart < disabIntro || i + injuryStart >= disabIntro + 3);

const SECTIONS = [
  ['보통약관 일반사항(제59~62조)', front.slice(0, b1)],
  ['별표1 대인배상·무보험자동차상해 지급기준 - 가. 사망', front.slice(b1, injuryStart)],
  ['별표1 대인배상·무보험자동차상해 지급기준 - 나. 부상', injurySeg],
  ['별표1 대인배상·무보험자동차상해 지급기준 - 다. 후유장애', [...disabIntroLines, ...front.slice(disabStart, propStart)]],
  ['별표2 대물배상 지급기준', front.slice(propStart, b3)],
  ['별표3 과실상계 등', front.slice(b3, b4)],
];
for (const [name, seg] of SECTIONS) chunkText(clean(seg), name, 'clause');

// 별표5: 추출 시 열이 분리되어 원문 순서대로 재구성
const injuryAmt = ['1,500만원', '800만원', '750만원', '700만원', '500만원', '400만원', '250만원', '180만원', '140만원', '120만원', '120만원', '120만원', '80만원', '50만원'];
const disabCols = {
  '1,500만원': ['1,500', '1,350', '1,200', '1,050', '900', '750', '600', '450', '360', '270', '210', '150', '90', '60'],
  '3,000만원': ['3,000', '2,700', '2,400', '2,100', '1,800', '1,500', '1,200', '900', '720', '540', '420', '300', '180', '120'],
  '5,000만원': ['5,000', '4,500', '4,000', '3,500', '3,000', '2,500', '2,000', '1,500', '1,200', '900', '700', '500', '300', '200'],
  '1억원': ['10,000', '9,000', '8,000', '7,000', '6,000', '5,000', '4,000', '3,000', '2,400', '1,800', '1,400', '1,000', '600', '400'],
};
push({
  kind: 'clause', section: '별표5 자기신체사고 지급기준', page: 77, title: '별표5 자기신체사고 - 상해등급별 보험가입금액',
  content: '[별표5 자기신체사고 지급기준] 1) 상해구분 및 급별 보험가입금액표 (상해등급은 자동차손해배상보장법 시행령 <별표 1>의 상해구분에 의함)\n' +
    injuryAmt.map((a, i) => `상해 ${i + 1}급: ${a}`).join('\n'),
});
push({
  kind: 'clause', section: '별표5 자기신체사고 지급기준', page: 77, title: '별표5 자기신체사고 - 후유장애등급별 보험가입금액',
  content: '[별표5 자기신체사고 지급기준] 2) 후유장애구분 및 급별 보험가입금액표 (장애등급은 자동차손해배상보장법 시행령 <별표 2>의 후유장애구분에 의함, 단위 만원)\n' +
    Array.from({ length: 14 }, (_, i) => `장애 ${i + 1}급: ` + Object.entries(disabCols).map(([plan, col]) => `가입금액 ${plan} 기준 ${col[i]}만원`).join(' / ')).join('\n'),
});
push({
  kind: 'clause', section: '별표4 동승자 유형별 감액비율표', page: 76, title: '별표4 동승자 유형별 감액비율표',
  content: '[별표4 동승자 유형별 감액비율표]\n1. 기준요소 (동승의 유형 및 운행목적 → 감액비율)\n' +
    '- 동승자의 강요 및 무단 동승: 100%\n' +
    '- 음주운전, 무면허운전(*2), 마약·약물운전 또는 사고발생 시의 조치의무 위반 운전자의 차량 동승: 40%\n' +
    '- 동승자의 요청 동승: 30%\n- 상호 의논합의 동승: 20%\n- 운전자의 권유 동승: 10%\n- 운전자의 강요 동승: 0%\n' +
    '(*1) 다만, 피보험자와 동승자가 「여객자동차운수사업법」에 따른 토요일, 일요일 및 공휴일을 제외한 날의 출·퇴근 시간대(오전 7시부터 오전 9시까지 및 오후 6시부터 오후 8시까지)에 실제의 출·퇴근 용도로 자택과 직장 사이를 이동하면서 \'승용차 함께 타기\'를 실시한 경우에는 위 동승자 감액비율을 적용하지 않습니다.\n' +
    '(*2) 무면허운전은 동승자가 운전자의 무면허 사실을 알 수 있었던 사정이 명확한 경우에 한하여 감액 적용\n' +
    '2. 수정요소: 동승자의 동승과정에 과실이 있는 경우 +10~20%',
});
push({
  kind: 'clause', section: '부표 보험금을 지급할 때의 적립이율', page: 77, title: '부표 보험금 지급 지연 시 적립이율',
  content: '[부표 보험금을 지급할 때의 적립이율]\n지급기일의 다음 날부터 30일 이내 기간: 보험계약대출이율\n지급기일의 31일 이후부터 60일 이내 기간: 보험계약대출이율 + 가산이율(4.0%)\n지급기일의 61일 이후부터 90일 이내 기간: 보험계약대출이율 + 가산이율(6.0%)\n지급기일의 91일 이후 기간: 보험계약대출이율 + 가산이율(8.0%)\n주) 보험계약대출이율은 보험개발원이 공시하는 보험계약대출이율을 적용합니다.',
});

// 4) 상해급표 / 상해 적용기준 / 후유장애급표 / 비고
parseGradeTable(all.slice(iInjury, iInjuryNotes), 'injury');
chunkText(all.slice(iInjuryNotes + 1, iDisab).filter(x => x.l !== '영역 내 용'), '상해구분 적용기준(시행령 별표1 비고)', 'clause', 900);
const iBigoEnd = idxOf(/^장애$/, iBigo);
parseGradeTable([...all.slice(iDisab, iBigo), ...all.slice(iBigoEnd)], 'disability');
chunkText(all.slice(iBigo + 1, iBigoEnd), '후유장애구분 비고(시행령 별표2 비고)', 'clause', 900);

// 5) 열 단위로 갈라진 표를 원문 짝대로 재구성
const injuryConsolation = [200, 176, 152, 128, 75, 50, 40, 30, 25, 20, 20, 15, 15, 15];
const lossRates = ['45% 이상 50% 미만', '35% 이상 45% 미만', '27% 이상 35% 미만', '20% 이상 27% 미만', '14% 이상 20% 미만', '9% 이상 14% 미만', '5% 이상 9% 미만', '0% 초과 5% 미만'];
const lossAmts = [400, 240, 200, 160, 120, 100, 80, 50];
let fixed = { consolation: false, lossRate: false };
for (const r of rows) {
  r.content = r.content.replace(/급별 인정액 급별 인정액 급별 인정액 급별 인정액\n(?:\d+\n){28}/, () => {
    fixed.consolation = true;
    return '부상 위자료 급별 인정액(만원): ' + injuryConsolation.map((v, i) => `${i + 1}급 ${v}만원`).join(', ') + '\n';
  });
  r.content = r.content.replace(/노동능력상실률 인정액\n(?:.+ 미만\n){8}(?:\d+\n){8}/, () => {
    fixed.lossRate = true;
    return '노동능력상실률 50% 미만 후유장애 위자료 인정액(만원): ' + lossRates.map((v, i) => `노동능력상실률이 ${v.replace(' 이상 ', ' 이상이고 ').replace(' 초과 ', ' 초과이고 ')}이면 ${lossAmts[i]}만원`).join('; ') + '\n';
  });
  r.content = r.content.replace(/\n\(\*\d\)\n/g, ' ');
}
console.log('표 재구성:', fixed);

// 6) 자주 묻는 금액표는 긴 본문에 묻혀 검색에서 밀리므로 독립 청크로 한 번 더 둔다 (기존 id 유지 위해 맨 뒤에 추가)
const SEC_INJ = '별표1 대인배상·무보험자동차상해 지급기준 - 나. 부상';
const SEC_DIS = '별표1 대인배상·무보험자동차상해 지급기준 - 다. 후유장애';
push({
  kind: 'clause', section: SEC_INJ, page: 66, title: '별표1 부상 - 위자료 급별 인정액',
  content: `[${SEC_INJ} · 2. 위자료] 부상 위자료(청구권자: 피해자 본인)는 책임보험 상해구분에 따라 급별로 다음 금액을 인정합니다. ` +
    '이 금액은 위자료이며, 상해급별 책임보험(대인배상Ⅰ) 보상한도와는 다른 금액입니다.\n' +
    injuryConsolation.map((v, i) => `상해 ${i + 1}급 부상 위자료: ${v}만원`).join('\n'),
});
push({
  kind: 'clause', section: SEC_DIS, page: 68, title: '별표1 후유장애 - 위자료 산정기준',
  content: `[${SEC_DIS} · 1. 위자료] 후유장애 위자료(청구권자: 피해자 본인)는 노동능력상실률에 따라 산정합니다.\n` +
    '(1) 노동능력상실률 50% 이상: 65세 미만 45,000,000원 × 노동능력상실률 × 85%, 65세 이상 40,000,000원 × 노동능력상실률 × 85%. ' +
    '가정간호비 지급 대상이면 65세 미만 80,000,000원 × 노동능력상실률 × 85%, 65세 이상 50,000,000원 × 노동능력상실률 × 85% (나이는 후유장애 판정 당시 기준)\n' +
    '(2) 노동능력상실률 50% 미만: ' + lossRates.map((v, i) => `노동능력상실률이 ${v.replace(' 이상 ', ' 이상이고 ').replace(' 초과 ', ' 초과이고 ')}이면 ${lossAmts[i]}만원`).join('; ') + '\n' +
    '후유장애 상실수익액을 지급하는 경우에는 후유장애 위자료를 지급하되, 부상 위자료 해당액이 더 많으면 그 금액을 후유장애 위자료로 지급합니다.',
});
push({
  kind: 'clause', section: SEC_INJ, page: 67, title: '별표1 부상 - 간병비·식대·통원 교통비',
  content: `[${SEC_INJ} · 4. 간병비 / 5. 그 밖의 손해배상금]\n` +
    '간병비 인정대상: 책임보험 상해구분 1~5급 중 객관적 증빙자료 제출자, 또는 동일 사고로 부모 중 1인이 사망하거나 1~5급 상해를 입은 7세 미만의 자.\n' +
    '간병비 인정일수(실제 입원기간 한도): 상해 1~2급 60일, 3~4급 30일, 5급 15일. 7세 미만 자녀 사유는 최대 60일. 간병인원은 1일 1인 이내, 1일 일용근로자 임금 기준.\n' +
    '그 밖의 손해배상금: 입원 시 한 끼당 4,030원(병원 식사를 제공받지 않는 경우), 통원 시 실제 통원일수 1일당 8,000원.',
});

rows.forEach((r, i) => (r.id = `kb_auto_${String(i + 1).padStart(4, '0')}`));
fs.writeFileSync('kb_auto_rows.json', JSON.stringify(rows, null, 2));

const count = k => rows.filter(r => r.kind === k).length;
console.log('총', rows.length, '| 조항/별표', count('clause'), '| 상해급 항목', count('injury_grade'), '| 후유장애급 항목', count('disability_grade'));
for (const kind of ['injury_grade', 'disability_grade']) {
  const byG = {};
  rows.filter(r => r.kind === kind).forEach(r => { byG[r.grade] ??= { n: 0, amt: r.amount }; byG[r.grade].n++; });
  console.log(kind, Object.entries(byG).map(([g, v]) => `${g}급(${v.amt}):${v.n}`).join(' '));
}
