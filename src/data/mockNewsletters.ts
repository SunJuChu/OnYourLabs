export interface Newsletter {
  id: string;
  name: string;
  folder: '생명보험' | '손해보험';
  insurer: string;
  publishMonth: string;
  size: string;
  modifiedTime: string;
  summary: {
    title: string;
    highlights: string[];
    mainProducts: {
      name: string;
      features: string[];
      target: string;
      benefit: string;
    }[];
    salesPoint: string;
    notes: string;
  };
  demoPdfUrl?: string; // fallback PDF url
}

export const mockNewsletters: Newsletter[] = [
  {
    id: "mock_life_samsung_06",
    name: "삼성생명_2026년_06월_보험소식지.pdf",
    folder: "생명보험",
    insurer: "삼성생명",
    publishMonth: "2026-06",
    size: "1.4 MB",
    modifiedTime: "2026-06-01 09:12",
    summary: {
      title: "삼성생명 6월 핵심 신상품 및 개정 안내",
      highlights: [
        "단기납 종신보험 더블업 환급률 대폭 강화 (7년납 최대 124.5% 보장)",
        "신간편 건강보험 가입 편의성 확대 (3.5.5 -> 3.10.5 옵션 신설)",
        "유병자 대상 간편 가입형 표적항암보장 업계 최초 도입"
      ],
      mainProducts: [
        {
          name: "삼성 단기납 종신보험 Plus",
          features: [
            "5년납/7년납 납입 완료 후 10년 시점 최대 환급률 제공",
            "가입자 건강관리에 따른 추가 보너스 적립",
            "업계 최초 계약전환 특별 옵션 탑재"
          ],
          target: "30-50대 목적자금 마련 및 사망 보장을 동시에 원하는 고객",
          benefit: "납입 완료 후 거치 기간 중 이율 변동 리스크 상쇄, 안정적 자금 운용"
        },
        {
          name: "The간편한 다사랑 건강보험 v2",
          features: [
            "암, 뇌혈관, 심장질환 등 3대 진단비 최대 5,000만원 보장",
            "간주 고지기간 적용 및 장기 무사고 전환 할인 제공",
            "통원 수수료 및 간병인 지원금 보장 강화"
          ],
          target: "고혈압·당뇨가 있는 50-70대 실버층 고객",
          benefit: "까다로운 심사 없이 간단한 고지만으로 종합 보장 가입 가능"
        }
      ],
      salesPoint: "금리 인하 전망 시기에 확정 가치 중심의 환급 구조를 지닌 종신 플러스 상품과 초간편 건강 보장을 복합 제안하여 청약 성공률 극대화.",
      notes: "★ 6월 15일까지 초회 보험료 납입 고객 대상 모바일 쿠폰 증정 이벤트 진행 중"
    },
    demoPdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    id: "mock_life_hanwha_06",
    name: "한화생명_2026년_06월_영업지원_소식지.pdf",
    folder: "생명보험",
    insurer: "한화생명",
    publishMonth: "2026-06",
    size: "2.1 MB",
    modifiedTime: "2026-06-02 14:35",
    summary: {
      title: "한화생명 6월 시그니처 암보험 및 연금 집중 보장",
      highlights: [
        "시그니처 암보험 v3 출시: 전이암 보장 횟수 무제한 파격 혜택",
        "연금보험 최저보증 보증이율 3.25% 업계 최고 수준 적용",
        "GA 채널 전용 더블업 건강 플랜 가동"
      ],
      mainProducts: [
        {
          name: "한화 시그니처 암보험 v3",
          features: [
            "최초 암 진단부터 재발암, 전이암까지 보장 한도 복원",
            "부위별 전이암 진단 자금 신설 (림프절, 뼈, 폐 등)",
            "소액암 면책기간 단축 프로모션 적용"
          ],
          target: "가족 중 암 내력이 있어 종합 암케어를 원하는 20-50대",
          benefit: "단 한 번의 암보험 가입으로 평생 추가 진단비 걱정 없이 케어 가능"
        },
        {
          name: "백세보증 변액연금 플러스",
          features: [
            "시중 금리 변동에 관계없이 납입 원금의 최대 200% 최저보증",
            "연금 개시 전 사망 시 특별 준비금 지급 정책",
            "글로벌 우량주 ETF 자동 분산 투자 구성"
          ],
          target: "은퇴 준비를 본격 시작하는 30-40대 직장인",
          benefit: "안정성(원금 보증)과 수익성(변액 운용)을 모두 챙길 수 있는 상품"
        }
      ],
      salesPoint: "전이암 치료로 지친 고객에게 면제 및 지속 보장 장점을 결합하여 부담을 덜어주는 무제한 전이암 플랜 상담 추천.",
      notes: "변액 연금 가입 시 펀드 믹스 정책을 글로벌 채권형 30%, 글로벌 기술주 70% 구성을 적극 검토 권장."
    },
    demoPdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    id: "mock_life_kyobo_05",
    name: "교보생명_2026년_05월_마케팅_소식지.pdf",
    folder: "생명보험",
    insurer: "교보생명",
    publishMonth: "2026-05",
    size: "1.8 MB",
    modifiedTime: "2026-05-18 10:05",
    summary: {
      title: "교보생명 5월 가정의 달 패밀리 보장 캠페인",
      highlights: [
        "우리아이 하이브리드 교육연금 및 보장 설계 개편",
        "가족 결합 할인율 확대 적용 (주계약 기준 최대 3.5% 할인)",
        "헬스케어 서비스 '교보 패밀리 케어' 서비스 대상 범위 확장"
      ],
      mainProducts: [
        {
          name: "교보 우리아이 하이브리드 보장보험",
          features: [
            "유아기 다빈도 질환부터 청소년기 디스크, 척추측만증 보장",
            "대학 등록금 및 학자금 마련을 위한 적립 전환 기능 제공",
            "부모 사망 시 양육 자금 매년 분할 지급"
          ],
          target: "태아 및 미취학 아동 자녀를 둔 초보 부모",
          benefit: "성장기 건강 보장과 대학교육 수준에 맞는 목돈 마련을 한 번에 준비"
        }
      ],
      salesPoint: "가정의 달을 맞아 자녀와 부모 통합 설계를 통해 패밀리 결합 할인을 받고 맞춤형 웰니스 서비스를 신청하도록 유도.",
      notes: "계약자 사망 시 보험료 납입 면제 특약 탑재 요건 확인 필수."
    },
    demoPdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    id: "mock_nonlife_hyundai_06",
    name: "현대해상_2026년_06월_화이어_소식지.pdf",
    folder: "손해보험",
    insurer: "현대해상",
    publishMonth: "2026-06",
    size: "1.2 MB",
    modifiedTime: "2026-06-03 16:20",
    summary: {
      title: "현대해상 6월 장기 손해보험 핵심 이슈 리포트",
      highlights: [
        "운전자보험 변호사선임비용 '경찰조사 단계' 포함 무제한 한도 확대",
        "간편종합보험 v5 '연세 많으신 부모님' 전용 암통원 일당 70만원 보장",
        "주택화재보험 붕괴/가재도구 배상 한계 전면 완화"
      ],
      mainProducts: [
        {
          name: "하이카 운전자상해보험 v7",
          features: [
            "경찰 조사 단계 변호사 선임 비용 최대 5,000만원 신속 선지급",
            "실제 손실뿐만 아니라 행정처분(스쿨존 위반) 벌금 완벽 대비",
            "자가용 및 영업용 차량 구별 맞춤 특약 설정 가능"
          ],
          target: "매일 출퇴근하는 직장인 및 차량 사용이 잦은 영업맨",
          benefit: "사고 발생 후 경찰 초기 진술부터 변호인의 전문적 조력을 즉각 활용"
        },
        {
          name: "퍼펙트플러스 종합보험",
          features: [
            "뇌혈관/허혈성심장질환 수술 시 매회 반복 보장 적용",
            "가족 일상생활중 배상책임(일배책) 누수 탐지 한도 500만원 증액",
            "특정 항암약물 및 호르몬 치료 통원 일당 신설"
          ],
          target: "종합적인 상해 및 질병 솔루션을 단일 계약으로 구축하려는 세대",
          benefit: "각종 실손 사각지대를 메우는 고액 진단 및 수술비를 저렴하게 통합 설계"
        }
      ],
      salesPoint: "교통사고 처리 특례법 개정에 맞추어 경찰 수사 초기부터 적용되는 최신 운전자 보장에 집중 설계 권유.",
      notes: "영업용 차량 가입 시 별도 인수기준 가이드라인을 참조할 것."
    },
    demoPdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    id: "mock_nonlife_db_06",
    name: "DB손해보험_2026년_06월_업무지원_안내장.pdf",
    folder: "손해보험",
    insurer: "DB손해보험",
    publishMonth: "2026-06",
    size: "1.9 MB",
    modifiedTime: "2026-06-03 08:30",
    summary: {
      title: "DB손보 6월 나에게 맞춘 간편 건강보험 집중 분석",
      highlights: [
        "10년 고지 세그먼트 신설로 우량 건강자 대상 보험료 대폭 할인",
        "암 무사고 환급 특약 신설 (가입 중 암 미발병 시 만기 환급금 가산)",
        "치아 치료 레진/임플란트 보증 횟수 한계 제거"
      ],
      mainProducts: [
        {
          name: "나에게 맞춘 간편건강보험 26.06",
          features: [
            "최대 10년간 무사고 시 정기 전환을 통한 누적 할인 적용",
            "심장 부정맥 및 무증상 심근경색 보장 고지 완화",
            "간접 충격 및 상해 치료 요양 급여금 매치 제도"
          ],
          target: "현재 매우 건강하지만 기왕력 우려로 가입하려는 장노년층",
          benefit: "유병자 분류 등급에서 탈출하여 실제 건강도에 따른 최대 30% 절세 효과"
        }
      ],
      salesPoint: "기존의 3.5.5 간편 보험을 가입해 둔 고객들 중 무사고 기준을 채운 대상자에게 맞춤 가입 전환을 적극 환매 제안.",
      notes: "대형 할인 적용 대상 여부를 전산 자동조회 기능을 통해 즉시 조회할 수 있습니다."
    },
    demoPdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    id: "mock_nonlife_kb_05",
    name: "KB손해보험_2026년_05월_소식지_영업자료.pdf",
    folder: "손해보험",
    insurer: "KB손해보험",
    publishMonth: "2026-05",
    size: "2.3 MB",
    modifiedTime: "2026-05-15 11:45",
    summary: {
      title: "KB손보 5월 스마트 반려견 및 가족 복합보험 리포트",
      highlights: [
        "반려동물 보험(금쪽같은 댕댕이) 보장 비율 최대 90%로 확대 상향",
        "상해 입원 일당 및 골절 수술 도수치료 연계 패밀리 보장",
        "화재 대물 배상 자영업자 대상 요건 간소화"
      ],
      mainProducts: [
        {
          name: "KB 금쪽같은 펫보험 v2",
          features: [
            "슬개골 탈구 및 대형 질병(피부병, 치주질환) 기본 보장화",
            "동물병원 제휴 진료비 실시간 전산 정산 시스템 연동",
            "반려견 사망 시 위로비 지급 및 장례 서비스 연계 옵션"
          ],
          target: "반려견의 노후 의료비 부담을 덜고 싶어 하는 펫 보호자 가구",
          benefit: "진료비가 비싼 동물의료비 리스크를 전면 상쇄하고 상호 케어 서비스 이용 가능"
        }
      ],
      salesPoint: "펫팸족 증가 추세에 맞게, 펫보험 가입 시 견주에 대한 상해 보장 특약 무료 가입 프로모션(5월 한정 연장)을 안내.",
      notes: "가입 연령은 생후 60일 이상부터 최대 10세까지 가능하며, 갱신을 통해 평생 보장."
    },
    demoPdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  }
];
