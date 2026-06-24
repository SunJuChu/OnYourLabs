import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const accessToken = req.query.accessToken as string;
  if (!accessToken) {
    return res.status(400).json({ error: "Google 드라이브 접근 토큰이 필요합니다." });
  }

  try {
    const lifeFolderId = "1nZLxDmT9GvhFNccbpqP8aIeCa7AL0AqM";
    const nonLifeFolderId = "1yCQk2lX1-gxLelzpCkgBt10MrzLHD1qy";

    const filesList: any[] = [];

    const fetchFilesFromFolder = async (folderId: string, category: "생명보험" | "손해보험") => {
      const q = `'${folderId}' in parents and mimeType = 'application/pdf' and trashed = false`;
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,size,modifiedTime)&pageSize=100`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`폴더 내 파일 목록 조회 실패: ${response.statusText} (${errBody})`);
      }

      const data: any = await response.json();
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          let insurer = category === "생명보험" ? "기타 생보사" : "기타 손보사";
          const nameLower = file.name.toLowerCase();

          if (nameLower.includes("삼성")) insurer = category === "생명보험" ? "삼성생명" : "삼성화재";
          else if (nameLower.includes("한화")) insurer = category === "생명보험" ? "한화생명" : "한화손보";
          else if (nameLower.includes("교보")) insurer = "교보생명";
          else if (nameLower.includes("현대")) insurer = "현대해상";
          else if (nameLower.includes("db")) insurer = "DB손해보험";
          else if (nameLower.includes("kb")) insurer = category === "생명보험" ? "KB생명" : "KB손해보험";
          else if (nameLower.includes("메리츠")) insurer = "메리츠화재";
          else if (nameLower.includes("동양")) insurer = "동양생명";
          else if (nameLower.includes("신한")) insurer = "신한라이프";
          else if (nameLower.includes("흥국")) insurer = category === "생명보험" ? "흥국생명" : "흥국화재";

          let publishMonth = "2026-06";
          const dateMatch = file.name.match(/(202[0-9])[년_\-]?([0-1][0-9])월?/);
          if (dateMatch) publishMonth = `${dateMatch[1]}-${dateMatch[2]}`;

          const sizeBytes = parseInt(file.size || "0");
          const sizeStr = sizeBytes > 0 ? (sizeBytes / (1024 * 1024)).toFixed(1) + " MB" : "크기 미상";

          filesList.push({
            id: file.id,
            name: file.name,
            folder: category,
            insurer,
            publishMonth,
            size: sizeStr,
            modifiedTime: file.modifiedTime
              ? file.modifiedTime.slice(0, 16).replace("T", " ")
              : "2026-06-15 00:00",
            summary: {
              title: `${insurer} 소식지 (${publishMonth})`,
              highlights: [
                `${insurer}에서 발행한 공식 소식지 파일입니다.`,
                `구글 드라이브 연동에 의해 실시간 로드되었습니다.`
              ],
              mainProducts: [{
                name: `구글 드라이브 파일: ${file.name}`,
                features: [
                  `드라이브 고유 파일 ID: ${file.id}`,
                  "본 대시보드의 PDF 리더 프록시를 통해 즉시 원본 열람이 가능합니다."
                ],
                target: "해당 보험 상품 가입 대상자 구조",
                benefit: "핵심 판매 특약 및 소식지 본문의 세부 혜택을 참조해 주십시오."
              }],
              salesPoint: "원본 PDF 보기 탭을 선택하여 세부 영업 가이드와 상품 비교 요약표를 직접 확인하실 수 있습니다.",
              notes: "※ 실제 구글 드라이브 연동 문서이며 실시간 수집된 메타데이터 정보입니다."
            }
          });
        }
      }
    };

    await fetchFilesFromFolder(lifeFolderId, "생명보험");
    await fetchFilesFromFolder(nonLifeFolderId, "손해보험");

    res.json({
      success: true,
      hasLifeFolder: true,
      hasNonLifeFolder: true,
      lifeFolderId,
      nonLifeFolderId,
      files: filesList
    });

  } catch (err: any) {
    console.error("구글 드라이브 파일 탐색 오류:", err);
    res.status(500).json({ error: err.message || "구글 드라이브 파일 목록을 조회하지 못했습니다." });
  }
}
