// PDF 지정 페이지 텍스트 추출. pdfjs-dist는 앱 의존성이 아니므로 별도 폴더에서 설치 후 실행.
// 사용: node extract.mjs <pdf> <시작쪽> <끝쪽> <출력.txt>
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';

const [, , file, from, to, out] = process.argv;
const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(file)) }).promise;
console.log('총 페이지:', doc.numPages);
let text = '';
for (let p = +from; p <= +to; p++) {
  const page = await doc.getPage(p);
  const c = await page.getTextContent();
  let lastY = null, line = '';
  const lines = [];
  for (const it of c.items) {
    const y = Math.round(it.transform[5]);
    if (lastY !== null && Math.abs(y - lastY) > 2) { lines.push(line); line = ''; }
    line += it.str;
    lastY = y;
  }
  lines.push(line);
  text += `\n===== PAGE ${p} =====\n` + lines.filter(l => l.trim()).join('\n');
}
fs.writeFileSync(out, text);
console.log('글자수:', text.length);
