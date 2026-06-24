import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const fileId = req.query.fileId as string;
  const accessToken = req.query.accessToken as string;

  if (!fileId || !accessToken) {
    return res.status(400).send("필수 인자(fileId, accessToken)가 누락되었습니다.");
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google 드라이브 파일 로드 실패: ${response.status} - ${errorText}`);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=\"document.pdf\"");

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));

  } catch (err: any) {
    console.error("PDF 프록시 오류:", err);
    res.status(500).send(`구글 드라이브 PDF 파일을 불러오는데 실패했습니다: ${err.message}`);
  }
}
