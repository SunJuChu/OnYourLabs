import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileId, accessToken } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "필수 인자(fileId)가 누락되었습니다." });
  }

  try {
    // 데모 Mock 파일 처리
    if (fileId.startsWith("mock_")) {
      let simulatedSummary: any = {
        title: "[실시간 AI 분석] 삼성생명 6월 개정이슈 및 핵심 상품 분석",
        highlights: [
          "단기납 종신보험 더블업 환급률 대폭 강화 (7년납 최대 124.5% 보장)",
          "신간편 건강보험 가입 편의성 확대 (3.10.5 장기 무사고 할인 옵션 신설)",
          "비갱신형 표적항암진단비 한도 확대 및 업계 최초 가입 연령 인상 (최대 75세)"
        ],
        mainProducts: [{
          name: "삼성 단기납 종신보험 Plus (AI 추천)",
          features: [
            "5년납/7년납 납입 완료 직후 10년 시점 업계 최상위 확정 환급률 제공",
            "유지 보너스 적립 보강 정책으로 장기 거치 고객 혜택 추가 확대",
            "사망보험금의 연금/저축 계약 전환 특별 보조 옵션 탑재"
          ],
          target: "안정성 높은 확정 금리형 목적 자금 마련과 유가족 생활비/상속세를 동시 해소하려는 고객",
          benefit: "시중 예적금 변동 금리 리스크를 극복하고 압도적인 장기 비과세 자산 구축 솔루션 제공"
        }],
        salesPoint: "1. 금리 인하기 최선의 저축 대안으로서의 단기납 종신 환급률 셀링 가치 수립 화법\n2. 간편 가입형 건강보험 고지 조건 보완을 기회 삼아, 기존 고지 불일치 유병자들의 리모델링 권유\n3. 전이암 및 표적치료 한도 결합형 저가 플랜을 미끼로 한 서브 청약 계약률 증가",
        notes: "※ 본 가이드라인은 데모 모드 Gemini AI 시뮬레이팅 엔진을 통해 신속 가공 완료된 전용 명세서입니다."
      };

      if (fileId.includes("hanwha")) {
        simulatedSummary = {
          title: "[실시간 AI 분석] 한화생명 6월 시그니처 암/연금 명품 분석 리포트",
          highlights: [
            "시그니처 암보험 v3 전격 리뉴얼: 전이암 진단비 무제한 반복 지급 파격 조건",
            "장기보증 변액연금보험 최저 보증이율 3.25% 세팅 완료 (업계 유일)",
            "유병자 맞춤형 간편 전용 3.5.5 건강 고지 간소화"
          ],
          mainProducts: [{
            name: "한화 시그니처 암보험 v3 (AI 추천)",
            features: [
              "림프절, 뼈, 폐 등 부위 및 차수 제한 없는 반복 전이암 치료비 지급",
              "소액 암 및 유사암 면책기간 한시적 폐지 프로모션 진행",
              "가입 기간별 무사고 특별 감액 요율 적용으로 보험료 절감"
            ],
            target: "가족 중 암력이 있거나 원발암 치료 후 전이 우려로 중복 치료 자금을 갈망하는 40-50대",
            benefit: "전이암이라는 실질적이고 가혹한 위협에 대해 추가 가입 부담 없이 온전한 평생 보장망 구축"
          }],
          salesPoint: "1. 신형 전이암 무제한 특약을 무기로, 기존 구형 암보험 가입자들의 특약 보완 상담 유도\n2. 3.25% 공시 최저보증을 바탕으로 고령화 은퇴 세대의 평생 고정 파이프라인 연금 강조\n3. 건강 상태 확인 시 즉시 연 10% 이상 요율 할인을 제공하는 스마트 가입 프로모션 추천",
          notes: "※ 본 가이드라인은 데모 모드 Gemini AI 시뮬레이팅 엔진을 통해 신속 가공 완료된 전용 명세서."
        };
      } else if (fileId.includes("meritz") || fileId.includes("nonlife") || fileId.includes("samsung_fire")) {
        simulatedSummary = {
          title: "[실시간 AI 분석] 손해보험(메리츠/삼성화재/현대) 6월 핵심 개정 요약",
          highlights: [
            "간병인 및 1인실 종합 지원비 일당 하루 최대 15만원 파격 상향",
            "운전자보험 변호사비 경찰조사 조기 선임 조항 강화 및 전 GA 채널 도입",
            "자녀보험 가입 나이 상한선 확대 및 성장 주기별 특약 탑재"
          ],
          mainProducts: [{
            name: "무배당 골드 메디컬 종합 간병보험 (AI 추천)",
            features: [
              "체증형 간병비로 나중의 인건비 급등 리스크 완벽 제거",
              "응급실 이용 및 특수 수액 비급여 치료비 신설 지원",
              "비사고 보너스 리워드로 실질적 입원 케어 혜택 강화"
            ],
            target: "간병 비 부담으로 독박 간병을 걱정하는 40-50대 장년층 및 독신 가구주",
            benefit: "가족에게 폐 끼치지 않고 프리미엄 입원실과 최고 수준 간병 혜택을 합리적 요율로 장전"
          }],
          salesPoint: "1. 인플레이션으로 급증한 하루 간병 비용 충당을 '체증형 간병일당'으로 설득력 있게 마케팅\n2. 운전자 전용 경찰조사단계 변호사비 조기 탑재를 연계하여 기존 운전자보험 무료 비교 서비스 전환\n3. 자녀 건강보험 내 심장/혈관 질환 특화 보장 신규 요율 적용으로 우량 고객 계약 발굴",
          notes: "※ 본 가이드라인은 데모 모드 Gemini AI 시뮬레이팅 엔진을 통해 신속 가공 완료된 전용 명세서."
        };
      }

      return res.json({ success: true, analysis: simulatedSummary });
    }

    // 실제 구글 드라이브 파일 분석
    if (!accessToken || accessToken === "demo_token") {
      return res.json({
        success: false,
        error: "실시간 PDF 분석은 유효한 구글 드라이브 연동 파일 혹은 권한이 필요합니다."
      });
    }

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!driveRes.ok) {
      const errorText = await driveRes.text();
      return res.status(driveRes.status).json({
        success: false,
        error: `구글 드라이브에서 파일 다운로드 실패: ${driveRes.statusText} (${errorText.substring(0, 50)})`
      });
    }

    const arrayBuffer = await driveRes.arrayBuffer();
    const pdfBase64 = Buffer.from(arrayBuffer).toString("base64");

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY 환경 변수가 설정되어 있지 않습니다.");
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
        mainProducts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              features: { type: Type.ARRAY, items: { type: Type.STRING } },
              target: { type: Type.STRING },
              benefit: { type: Type.STRING },
            },
            required: ["name", "features", "target", "benefit"],
          },
        },
        salesPoint: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
      required: ["title", "highlights", "mainProducts", "salesPoint", "notes"],
    };

    const response = await ai.models.generateContent({
      model: "models/gemini-2.0-flash",
      contents: [
        {
          parts: [
            { inlineData: { data: pdfBase64, mimeType: "application/pdf" } },
            {
              text: `당신은 대한민국 최고 보험 보장 분석 사내 강사이자 FC 세일즈 교육 담당자입니다.
제공된 보험사 핵심 개정 소식지/뉴스레터 PDF 내용을 꼼꼼하게 읽고 분석하여 정형화된 JSON 데이터 구조로 반환해 주세요.

[요구 분석 범위]
1. 이번 달 핵심 개정 사항 및 신상품 핵심 특징 요약 (highlights 세 가지)
2. 주력 추천 상품 리스트 (mainProducts): 대표 상품 1~2개, 특장점/추천대상/혜택 포함
3. 현장 우수 상담 기법 및 제안 포인트 (salesPoint): 3대 핵심 셀링 포인트

반드시 한글로 전문성 있게 응답해 주세요.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const rawText = response.text || "{}";
    const parsedAnalysis = JSON.parse(rawText.trim());

    res.json({ success: true, analysis: parsedAnalysis });

  } catch (err: any) {
    console.error("[Gemini AI Error] name:", err?.name);
    console.error("[Gemini AI Error] message:", err?.message);
    console.error("[Gemini AI Error] stack:", err?.stack);
    res.status(500).json({
      success: false,
      error: `[${err?.name || 'Error'}] ${err?.message || "인공지능 분석 처리 도중 서버 에러가 발생했습니다."}`
    });
  }
}
