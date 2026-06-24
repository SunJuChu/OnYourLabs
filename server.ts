import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dns from "dns";

// Fix Node.js 17+ localhost address resolution issues
dns.setDefaultResultOrder("ipv4first");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add parsed body capabilities
  app.use(express.json());

  // 1. Health check API endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  /**
   * PDF Proxy Router for Google Drive Files
   * Google Drive API file download returns binary data. Serving it directly with authorization
   * avoids CORS issues and iframe authentication constraints on the frontend.
   *
   * 구글 드라이브 API에서 파일 바이너리를 다운로드해 브라우저에 직접 스트리밍합니다.
   * 이 프록시를 사용하면 크로스 오리진(CORS) 오류나 대화형 iframe의 세션 인증 한계를 완벽히 해결할 수 있습니다.
   */
  app.get("/api/proxy/pdf", async (req, res) => {
    const fileId = req.query.fileId as string;
    const accessToken = req.query.accessToken as string;

    if (!fileId || !accessToken) {
      return res.status(400).send("필수 인자(fileId, accessToken)가 누락되었습니다.");
    }

    try {
      console.log(`구글 드라이브 PDF 파일 프록시 요청 시작: FileID = ${fileId}`);
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google API 오류 응답: ${response.status} - ${errorText}`);
        throw new Error(`Google 드라이브 파일(ID: ${fileId}) 로드 실패. 응답 상태: ${response.status}`);
      }

      // Stream PDF from Google endpoints to browser
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=\"document.pdf\"");
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
      
    } catch (err: any) {
      console.error("PDF 프록시 서빙 장애 발생:", err);
      res.status(500).send(`[API 오류] 구글 드라이브 PDF 파일을 불러오는데 실패했습니다: ${err.message}`);
    }
  });

  /**
   * Google Drive Folders & PDFs Listing API
   * 
   * [구글 드라이브 API 연동 및 파일 검색 메커니즘 설명]
   * 1. 사용자의 Google OAuth 액세스 토큰을 기반으로 특정 이름('생명보험', '손해보험')을 가진 폴더를 먼저 검색합니다.
   *    - API Endpoint: `https://www.googleapis.com/drive/v3/files`
   *    - Query: `name = '폴더이름' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
   * 2. 각 폴더가 존재하는 경우, 해당 폴더 ID를 부모로 가진 PDF 문서들을 검색합니다.
   *    - Query: `'폴더ID' in parents and mimeType = 'application/pdf' and trashed = false`
   * 3. 검색된 파일들의 메타데이터(이름, 크기, 수정시간 등)를 받아와 프론트엔드가 즉시 렌더링할 수 있는 객체 형식으로 파싱해 정렬합니다.
   */
  app.get("/api/drive/list", async (req, res) => {
    const accessToken = req.query.accessToken as string;
    if (!accessToken) {
      return res.status(400).json({ error: "Google 드라이브 접근 토큰이 필요합니다." });
    }

    try {
      // 지정된 구글 드라이브 폴더 ID 직접 매핑
      const lifeFolderId = "1nZLxDmT9GvhFNccbpqP8aIeCa7AL0AqM";
      const nonLifeFolderId = "1yCQk2lX1-gxLelzpCkgBt10MrzLHD1qy";

      console.log(`지정된 구글 드라이브 '생명보험'(${lifeFolderId}) 및 '손해보험'(${nonLifeFolderId}) 폴더 목록을 조회합니다...`);

      const filesList: any[] = [];

      // 2. 해당 폴더 하위의 PDF 파일들을 긁어오는 헬퍼 함수
      const fetchFilesFromFolder = async (folderId: string, category: "생명보험" | "손해보험") => {
        const q = `'${folderId}' in parents and mimeType = 'application/pdf' and trashed = false`;
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,size,modifiedTime)&pageSize=100`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`폴더 내 파일 목록 조회 API 요청 실패: ${response.statusText} (${errBody})`);
        }

        const data: any = await response.json();
        if (data.files && data.files.length > 0) {
          for (const file of data.files) {
            // 파일명 바탕으로 보험사(교보, 삼성 등) 자동 스마트 매칭
            let insurer = category === "생명보험" ? "기타 생보사" : "기타 손보사";
            const nameLower = file.name.toLowerCase();

            if (nameLower.includes("삼성")) {
              insurer = category === "생명보험" ? "삼성생명" : "삼성화재";
            } else if (nameLower.includes("한화")) {
              insurer = category === "생명보험" ? "한화생명" : "한화손보";
            } else if (nameLower.includes("교보")) {
              insurer = "교보생명";
            } else if (nameLower.includes("현대")) {
              insurer = "현대해상";
            } else if (nameLower.includes("db")) {
              insurer = "DB손해보험";
            } else if (nameLower.includes("kb")) {
              insurer = category === "생명보험" ? "KB생명" : "KB손해보험";
            } else if (nameLower.includes("메리츠")) {
              insurer = "메리츠화재";
            } else if (nameLower.includes("동양")) {
              insurer = "동양생명";
            } else if (nameLower.includes("신한")) {
              insurer = "신한라이프";
            } else if (nameLower.includes("흥국")) {
              insurer = category === "생명보험" ? "흥국생명" : "흥국화재";
            }

            // 파일명에서 발행월(예: 2026-06 또는 2026년 06월) 추출 시도
            let publishMonth = "2026-06"; // 기본값
            const dateMatch = file.name.match(/(202[0-9])[년_\-]?([0-1][0-9])월?/);
            if (dateMatch && dateMatch[1] && dateMatch[2]) {
              publishMonth = `${dateMatch[1]}-${dateMatch[2]}`;
            }

            // 바이트 크기 변환 (MB 단위)
            const sizeBytes = parseInt(file.size || "0");
            let sizeStr = "크기 미상";
            if (sizeBytes > 0) {
              sizeStr = (sizeBytes / (1024 * 1024)).toFixed(1) + " MB";
            }

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
                mainProducts: [
                  {
                    name: `구글 드라이브 파일: ${file.name}`,
                    features: [
                      `드라이브 고유 파일 ID: ${file.id}`,
                      "본 대시보드의 PDF 리더 프록시를 통해 즉시 원본 열람이 가능합니다."
                    ],
                    target: "해당 보험 상품 가입 대상자 구조",
                    benefit: "핵심 판매 특약 및 소식지 본문의 세부 혜택을 참조해 주십시오."
                  }
                ],
                salesPoint: "원본 PDF 보기 탭을 선택하여 세부 영업 가이드와 상품 비교 요약표를 직접 확인하실 수 있습니다.",
                notes: "※ 실제 구글 드라이브 연동 문서이며 실시간 수집된 메타데이터 정보입니다."
              }
            });
          }
        }
      };

      // 3. 비동기로 양측 폴더 파일들 긁어오기
      if (lifeFolderId) {
        await fetchFilesFromFolder(lifeFolderId, "생명보험");
      }
      if (nonLifeFolderId) {
        await fetchFilesFromFolder(nonLifeFolderId, "손해보험");
      }

      console.log(`구글 드라이브 파일 로드 완료. 생명보험 폴더 존재: ${!!lifeFolderId}, 손해보험 폴더 존재: ${!!nonLifeFolderId}, 총 탐색건수: ${filesList.length}개`);

      res.json({
        success: true,
        hasLifeFolder: !!lifeFolderId,
        hasNonLifeFolder: !!nonLifeFolderId,
        lifeFolderId,
        nonLifeFolderId,
        files: filesList
      });

    } catch (err: any) {
      console.error("구글 드라이브 파일 탐색 오류:", err);
      res.status(500).json({ error: err.message || "구글 드라이브 파일 목록을 조회하지 못했습니다." });
    }
  });

  /**
   * Gemini Real-time Analysis for PDF Files
   * 공인된 Gemini 3.5 Flash 모델과 구글 드라이브 다운로드 하이브리드를 활용해 실시간 PDF 분석을 진행합니다.
   */
  app.post("/api/gemini/analyze", async (req, res) => {
    const { fileId, accessToken } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: "필수 인자(fileId)가 누락되었습니다." });
    }

    try {
      console.log(`[Gemini AI] PDF 분석 요청 접수: FileID = ${fileId}`);

      // 0. 만약 mock_ 파일인 경우, 드라이브 연동 에러를 사전 차단하기 위해 실시간 정제 시뮬레이션 데이터를 반환합니다.
      if (fileId.startsWith("mock_")) {
        console.log(`[Gemini AI] 데모 Mock 파일 요청 감지: ${fileId}. 가상의 고품격 AI 분석 결과를 즉시 연출합니다.`);
        
        let simulatedSummary = {
          title: "[실시간 AI 분석] 삼성생명 6월 개정이슈 및 핵심 상품 분석",
          highlights: [
            "단기납 종신보험 더블업 환급률 대폭 강화 (7년납 최대 124.5% 보장)",
            "신간편 건강보험 가입 편의성 확대 (3.10.5 장기 무사고 할인 옵션 신설)",
            "비갱신형 표적항암진단비 한도 확대 및 업계 최초 가입 연령 인상 (최대 75세)"
          ],
          mainProducts: [
            {
              name: "삼성 단기납 종신보험 Plus (AI 추천)",
              features: [
                "5년납/7년납 납입 완료 직후 10년 시점 업계 최상위 확정 환급률 제공",
                "유지 보너스 적립 보강 정책으로 장기 거치 고객 혜택 추가 확대",
                "사망보험금의 연금/저축 계약 전환 특별 보조 옵션 탑재"
              ],
              target: "안정성 높은 확정 금리형 목적 자금 마련과 유가족 생활비/상속세를 동시 해소하려는 고객",
              benefit: "시중 예적금 변동 금리 리스크를 극복하고 압도적인 장기 비과세 자산 구축 솔루션 제공"
            }
          ],
          salesPoint: "1. 금리 인하기 최선의 저축 대안으로서의 단기납 종신 환급률 셀링 가치 수립 화법\n2. 간편 가입형 건강보험 고지 조건 보완을 기회 삼아, 기존 고지 불일치 유병자들의 리모델링 권유\n3. 전이암 및 표적치료 한도 결합형 저가 플랜을 미끼로 한 서브 청약 계약률 증가",
          notes: "※ 본 가이드라인은 데모 모드 실시간 AI 분석 요청에 대응하여, Gemini 3.5 Flash 시뮬레이팅 엔진을 통해 신속 가공 완료된 전용 명세서입니다."
        };

        if (fileId.includes("hanwha")) {
          simulatedSummary = {
            title: "[실시간 AI 분석] 한화생명 6월 시그니처 암/연금 명품 분석 리포트",
            highlights: [
              "시그니처 암보험 v3 전격 리뉴얼: 전이암 진단비 무제한 반복 지급 파격 조건",
              "장기보증 변액연금보험 최저 보증이율 3.25% 세팅 완료 (업계 유일)",
              "유병자 맞춤형 간편 전용 3.5.5 건강 고지 간소화"
            ],
            mainProducts: [
              {
                name: "한화 시그니처 암보험 v3 (AI 추천)",
                features: [
                  "림프절, 뼈, 폐 등 부위 및 차수 제한 없는 반복 전이암 치료비 지급",
                  "소액 암 및 유사암 면책기간 한시적 폐지 프로모션 진행",
                  "가입 기간별 무사고 특별 감액 요율 적용으로 보험료 절감"
                ],
                target: "가족 중 암력이 있거나 원발암 치료 후 전이 우려로 중복 치료 자금을 갈망하는 40-50대",
                benefit: "전이암이라는 실질적이고 가혹한 위협에 대해 추가 가입 부담 없이 온전한 평생 보장망 구축"
              }
            ],
            salesPoint: "1. 신형 전이암 무제한 특약을 무기로, 기존 구형 암보험 가입자들의 특약 보완 상담 유도\n2. 3.25% 공시 최저보증을 바탕으로 고령화 은퇴 세대의 평생 고정 파이프라인 연금 강조\n3. 건강 상태 확인 시 즉시 연 10% 이상 요율 할인을 제공하는 스마트 가입 프로모션 추천",
            notes: "※ 본 가이드라인은 데모 모드 실시간 AI 분석 요청에 대응하여, Gemini 3.5 Flash 시뮬레이팅 엔진을 통해 신속 가공 완료된 전용 명세서."
          };
        } else if (fileId.includes("meritz") || fileId.includes("nonlife") || fileId.includes("samsung_fire")) {
          simulatedSummary = {
            title: "[실시간 AI 분석] 손해보험(메리츠/삼성화재/현대) 6월 핵심 개정 핵심 요약",
            highlights: [
              "간병인 및 1인실 종합 지원비 일당 하루 최대 15만원 파격 상향",
              "운전자보험 변호사비 경찰조사 조기 선임 조항 강화 및 전 GA 채널 도입",
              "자녀보험 가입 나이 상한선 확대 및 성장 주기별 특약 탑재"
            ],
            mainProducts: [
              {
                name: "무배당 골드 메디컬 종합 간병보험 (AI 추천)",
                features: [
                  "체증형 간병비로 나중의 인건비 급등 리스크 완벽 제거",
                  "응급실 이용 및 특수 수액 비급여 치료비 신설 지원",
                  "비사고 보너스 리워드로 실질적 입원 케어 혜택 강화"
                ],
                target: "간병 비 부담으로 독박 간병을 걱정하는 40-50대 장년층 및 독신 가구주",
                benefit: "가족에게 폐 끼치지 않고 프리미엄 입원실과 최고 수준 간병 혜택을 합리적 요율로 장전"
              }
            ],
            salesPoint: "1. 인플레이션으로 급증한 하루 간병 비용 충당을 '체증형 간병일당'으로 설득력 있게 마케팅\n2. 운전자 전용 경찰조사단계 변호사비 조기 탑재를 연계하여 기존 운전자보험 무료 비교 서비스 전환\n3. 자녀 건강보험 내 심장/혈관 질환 특화 보장 신규 요율 적용으로 우량 고객 계약 발굴",
            notes: "※ 본 가이드라인은 데모 모드 실시간 AI 분석 요청에 대응하여, Gemini 3.5 Flash 시뮬레이팅 엔진을 통해 신속 가공 완료된 전용 명세서."
          };
        }

        return res.json({
          success: true,
          analysis: simulatedSummary
        });
      }

      // 1. 구글 드라이브 토큰이 있는 경우, 구글 드라이브로부터 파일 직접 내려받기
      let pdfBase64 = "";

      if (accessToken && accessToken !== "demo_token") {
        console.log(`[Gemini AI] 구글 드라이브 API 연동 진행 중... FileID = ${fileId}`);
        const driveRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!driveRes.ok) {
          const errorText = await driveRes.text();
          console.error(`Google API 오류 응답: ${driveRes.status} - ${errorText}`);
          return res.status(driveRes.status).json({
            success: false,
            error: `구글 드라이브에서 파일 다운로드 실패: ${driveRes.statusText} (${errorText.substring(0, 50)})`
          });
        }

        const arrayBuffer = await driveRes.arrayBuffer();
        pdfBase64 = Buffer.from(arrayBuffer).toString("base64");
      }

      // 2. 만약 PDF가 없고, 데모 모드이거나 실패했을 경우 대비 (또는 sample file 이어서 토큰이 없었을 때)
      if (!pdfBase64) {
        return res.json({
          success: false,
          error: "실시간 PDF 분석은 유효한 구글 드라이브 연동 파일 혹은 권한이 필요합니다."
        });
      }

      // 3. Gemini API SDK 지연(Lazy) 초기화 - 서버 기동 충돌 방지
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        throw new Error("GEMINI_API_KEY 환경 변수가 설정되어 있지 않습니다. 설정에서 API Key를 입력해주세요.");
      }

      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      console.log("[Gemini AI] Gemini 3.5 Flash 모델 가동 및 PDF 컨텍스트 주입 중...");

      const pdfPart = {
        inlineData: {
          data: pdfBase64,
          mimeType: "application/pdf"
        }
      };

      const promptPart = {
        text: `당신은 대한민국 최고 보험 보장 분석 사내 강사이자 FC 세일즈 교육 담당자입니다.
제공된 보험사 핵심 개정 소식지/뉴스레터 PDF 내용을 꼼꼼하게 읽고 분석하여 정형화된 JSON 데이터 구조로 반환해 주세요.

[요구 분석 범위]
1. 이번 달 핵심 개정 사항 및 신상품 핵심 특징 요약 (highlights 세 가지): 반드시 각각 유용한 보험 혜택이나 특약 중심의 완성된 문장 형태로 3가지를 도출해야 합니다.
2. 주력 추천 상품 리스트 (mainProducts): 대표적인 주력 상품 약 1~2개를 선정해 분석하고, 해당 상품의 상세 특장점(features 2~3개), 추천 가입 대상 고객(target), 고객이 얻는 가치제안 및 혜택(benefit)을 논리적으로 기재해 주세요.
3. 현장 우수 상담 기법 및 제안 포인트 (salesPoint): 해당 소식지 본문에서 도출할 수 있는 설계사 영업용 '3대 핵심 셀링 포인트'를 풍성하고 자세하게 작성해 주십시오. (예: 어떤 고객 세그먼트에게 이런 화법으로 가치를 전달해야 하는지)

반드시 한글로 친절하고 전문성이 가득 느껴지게 응답해 주세요.`
      };

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "요약 리서치보드 타이틀 (형식: [보험사명] 6월 개정이슈 및 핵심 상품 분석)",
          },
          highlights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "이번 달 꼭 알아야 하는 핵심 개정 소식/담보 안내 3가지 리스트 (반드시 3개의 요소가 꽉 차야 함)",
          },
          mainProducts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "주력 영업 추천 상품명",
                },
                features: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "상품의 3대 핵심 특장점 및 수수료/보장 메리트 상세 소개 리스트",
                },
                target: {
                  type: Type.STRING,
                  description: "상담 및 클로징에 용이한 가입 추천 대상군 설명",
                },
                benefit: {
                  type: Type.STRING,
                  description: "고객 가치 제안 및 판매 메리트(Benefit)",
                },
              },
              required: ["name", "features", "target", "benefit"],
            },
            description: "보험사의 주요 추천 상품 분석 (1-2개 항목)",
          },
          salesPoint: {
            type: Type.STRING,
            description: "보험설계사(FC)를 위한 현장 3대 핵심 셀링 포인트 실전 세일즈 가이드 화법 및 팁 종합",
          },
          notes: {
            type: Type.STRING,
            description: "추가 분석 명세 (예: ※ 본 가이드는 실시간 수집된 구글 드라이브 원본 PDF 내용을 기반으로 Gemini 3.5 Flash 인공지능이 실시간 분석하여 작성한 영업 자료입니다.)",
          }
        },
        required: ["title", "highlights", "mainProducts", "salesPoint", "notes"],
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [pdfPart, promptPart],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      console.log("[Gemini AI] PDF 실시간 분석 완성!");
      const rawText = response.text || "{}";
      const parsedAnalysis = JSON.parse(rawText.trim());

      res.json({
        success: true,
        analysis: parsedAnalysis
      });

    } catch (err: any) {
      console.error("[Gemini AI Error] 실시간 소식지 분석 전송 중 오류:", err);
      res.status(500).json({
        success: false,
        error: err.message || "인공지능 분석 처리 도중 서버 에러가 발생했습니다."
      });
    }
  });


  // 2. Vite Middleware Setup (Development vs Production)
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite 개발 모드 미들웨어 바인딩 중...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("프로덕션 모드 정적 자원 서빙 시작...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind exclusively to port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Streamlit Express App] 서버가 시작되었습니다! 포트: ${PORT}`);
    console.log(`주소: http://localhost:${PORT}`);
  });
}

startServer();
