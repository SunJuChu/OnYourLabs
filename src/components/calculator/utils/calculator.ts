import {
  CalculationInput,
  CalculationResult,
  DeductionDetail,
} from '../types';
import { GENERATION_INFOS, HOSPITAL_LEVEL_INFOS } from '../data/insuranceRules';

export function calculateInsuranceRefund(input: CalculationInput): CalculationResult {
  const { generation, medicalType, hospitalLevel, expenses, limits, customOptions } = input;

  const coveredSelfPaid = Math.max(0, expenses.coveredSelfPaid || 0);
  const uncoveredExpense = Math.max(0, expenses.uncoveredExpense || 0);
  const specialManual = Math.max(0, expenses.specialManualTherapy || 0);
  const specialInjection = Math.max(0, expenses.specialInjection || 0);
  const specialMri = Math.max(0, expenses.specialMri || 0);
  const uncoveredRoomFee = Math.max(0, expenses.uncoveredRoomFee || 0);

  // 5세대 전용 옵션
  const isSanjeongTeukrye = !!customOptions?.isSanjeongTeukrye;
  const isHealthInsuranceExempt = !!customOptions?.isHealthInsuranceExempt;
  const admissionDays = Math.max(0, customOptions?.admissionDays || 0);
  // 기존 3단계 병원유형(clinic/hospital/tertiary) 체계는 그대로 유지하되, 5세대 계산에서만
  // 'hospital'(일반병원/종합병원 통칭) 선택 시 실제로 종합병원급 이상인지 별도로 구분한다.
  const is5genUpperHospital = hospitalLevel === 'tertiary' || (hospitalLevel === 'hospital' && !!customOptions?.isGeneralHospitalOrAbove);

  const totalSpecialExpense = specialManual + specialInjection + specialMri;
  // 약국(처방약제비) 방문 시에는 coveredSelfPaid/uncoveredExpense가 약제비 계산서의
  // "본인부담금"/"비급여전액본인부담금"을 의미한다 (별도 pharmacyExpense 필드 없음).
  const pharmacyTotal = coveredSelfPaid + uncoveredExpense;
  const totalMedicalExpense = coveredSelfPaid + uncoveredExpense + totalSpecialExpense + uncoveredRoomFee;

  const hospitalInfo = HOSPITAL_LEVEL_INFOS[hospitalLevel];
  const minHospitalDeductible = hospitalInfo.minDeductibles[generation] || 10000;

  let coveredDeductible = 0;
  let uncoveredDeductible = 0;
  let specialDeductible = 0;
  let pharmacyDeductible = 0;
  let exceededLimitDeduction = 0;

  const notes: string[] = [];
  const breakdownSummary: { label: string; amount: number; description: string }[] = [];

  if (totalMedicalExpense === 0) {
    return {
      totalMedicalExpense: 0,
      deductionDetail: {
        coveredDeductible: 0,
        uncoveredDeductible: 0,
        specialDeductible: 0,
        pharmacyDeductible: 0,
        exceededLimitDeduction: 0,
        totalDeductible: 0,
      },
      reimbursementAmount: 0,
      coveragePercentage: 0,
      generationName: GENERATION_INFOS[generation].title,
      hospitalLevelName: hospitalInfo.name,
      notes: ['진료비를 입력해주세요.'],
      breakdownSummary: [],
    };
  }

  // --- Generation Specific Logic ---
  if (generation === '1gen') {
    // 1세대 (구실손)
    if (medicalType === 'inpatient') {
      // 입원: 100% 보장 (공제 0원)
      coveredDeductible = 0;
      uncoveredDeductible = 0;
      specialDeductible = 0;
      notes.push('1세대 입원 치료는 본인부담금 100% 전액 보장됩니다 (공제금액 0원).');
    } else if (medicalType === 'outpatient') {
      // 외래: 병원급 정액 공제 (의원 5천원, 병원 8천원, 상급 1만원)
      const baseDeductible = hospitalLevel === 'clinic' ? 5000 : hospitalLevel === 'hospital' ? 8000 : 10000;
      const totalOutpatientExpense = coveredSelfPaid + uncoveredExpense + totalSpecialExpense;
      
      if (totalOutpatientExpense > 0) {
        // 정액 공제 적용
        const actualDeductible = Math.min(totalOutpatientExpense, baseDeductible);
        coveredDeductible = Math.round(actualDeductible * (coveredSelfPaid / Math.max(1, totalOutpatientExpense)));
        uncoveredDeductible = actualDeductible - coveredDeductible;
        notes.push(`1세대 외래 정액 공제: ${hospitalInfo.name} 기준 1회 당 ${baseDeductible.toLocaleString()}원 차감.`);
      }
    } else {
      // 약제비: 1회당 5,000원 정액 공제
      if (pharmacyTotal > 0) {
        pharmacyDeductible = Math.min(pharmacyTotal, 5000);
        notes.push('1세대 약제비: 1회당 5,000원 정액 공제.');
      }
    }
  } else if (generation === '2gen') {
    // 2세대 (표준화 실손 - 선택형II 기준 10%/20%)
    if (medicalType === 'inpatient') {
      coveredDeductible = Math.round(coveredSelfPaid * 0.1); // 급여 10%
      uncoveredDeductible = Math.round((uncoveredExpense + totalSpecialExpense) * 0.2); // 비급여 20%
      notes.push('2세대 입원: 급여 10% 자기부담, 비급여 20% 자기부담.');
    } else if (medicalType === 'outpatient') {
      const outpatientTotal = coveredSelfPaid + uncoveredExpense + totalSpecialExpense;
      if (outpatientTotal > 0) {
        // 급여 10%, 비급여 20% 비율 공제 합계 vs 병원급 최소 공제액 중 큰 금액
        const ratioDeductible = (coveredSelfPaid * 0.1) + ((uncoveredExpense + totalSpecialExpense) * 0.2);
        const finalDeductible = Math.max(minHospitalDeductible, ratioDeductible);
        
        if (ratioDeductible >= minHospitalDeductible) {
          coveredDeductible = Math.round(coveredSelfPaid * 0.1);
          uncoveredDeductible = Math.round((uncoveredExpense + totalSpecialExpense) * 0.2);
          notes.push(`2세대 외래: 비율 공제(${Math.round(ratioDeductible).toLocaleString()}원)가 최소 공제액(${minHospitalDeductible.toLocaleString()}원)보다 크므로 비율 적용.`);
        } else {
          // 최소 공제액이 더 큼 -> 비율대로 분등
          coveredDeductible = Math.round(minHospitalDeductible * (coveredSelfPaid / Math.max(1, outpatientTotal)));
          uncoveredDeductible = Math.min(outpatientTotal, minHospitalDeductible) - coveredDeductible;
          notes.push(`2세대 외래: 최소 공제액(${minHospitalDeductible.toLocaleString()}원) 적용.`);
        }
      }
    } else {
      // 약제비: 1회당 8,000원 정액 공제 (비율 비교 없음)
      if (pharmacyTotal > 0) {
        pharmacyDeductible = Math.min(pharmacyTotal, 8000);
        notes.push('2세대 약제비: 1회당 8,000원 정액 공제.');
      }
    }
  } else if (generation === '3gen') {
    // 3세대 (착한실손) - 3대 특약 30%/2만원 분리
    if (medicalType === 'inpatient') {
      coveredDeductible = Math.round(coveredSelfPaid * 0.1); // 급여 10~20% (10% 적용)
      uncoveredDeductible = Math.round(uncoveredExpense * 0.2); // 일반 비급여 20%
      // 3대 특약: 30% 와 2만원 중 큰 금액
      if (totalSpecialExpense > 0) {
        specialDeductible = Math.max(20000, Math.round(totalSpecialExpense * 0.3));
        specialDeductible = Math.min(totalSpecialExpense, specialDeductible);
      }
      notes.push('3세대 입원: 급여 10%, 일반비급여 20%, 3대특약 30%(최소 2만원) 차감.');
    } else if (medicalType === 'outpatient') {
      // 급여 & 일반비급여
      const baseTotal = coveredSelfPaid + uncoveredExpense;
      if (baseTotal > 0) {
        const ratioDeductible = (coveredSelfPaid * 0.1) + (uncoveredExpense * 0.2);
        if (ratioDeductible >= minHospitalDeductible) {
          coveredDeductible = Math.round(coveredSelfPaid * 0.1);
          uncoveredDeductible = Math.round(uncoveredExpense * 0.2);
        } else {
          const actualMin = Math.min(baseTotal, minHospitalDeductible);
          coveredDeductible = Math.round(actualMin * (coveredSelfPaid / Math.max(1, baseTotal)));
          uncoveredDeductible = actualMin - coveredDeductible;
        }
      }
      // 3대 특약 별도 계산 (회당 30% vs 2만원)
      if (specialManual > 0) {
        const mDed = Math.max(20000, Math.round(specialManual * 0.3));
        specialDeductible += Math.min(specialManual, mDed);
      }
      if (specialInjection > 0) {
        const iDed = Math.max(20000, Math.round(specialInjection * 0.3));
        specialDeductible += Math.min(specialInjection, iDed);
      }
      if (specialMri > 0) {
        const mriDed = Math.max(20000, Math.round(specialMri * 0.3));
        specialDeductible += Math.min(specialMri, mriDed);
      }
      notes.push(`3세대 외래: 기본 진료비(병원급 최소 ${minHospitalDeductible.toLocaleString()}원 vs 10~20%) + 3대특약(30% vs 2만원 중 큰 금액) 별도 공제.`);
    } else {
      // 약제비: MAX[8,000원, (급여분 10% + 비급여분 20%)]
      if (pharmacyTotal > 0) {
        const ratioDed = Math.round(coveredSelfPaid * 0.1 + uncoveredExpense * 0.2);
        pharmacyDeductible = Math.max(8000, ratioDed);
        pharmacyDeductible = Math.min(pharmacyTotal, pharmacyDeductible);
        notes.push('3세대 약제비: 급여분 10%+비급여분 20% 합산액과 8,000원 중 큰 금액 차감.');
      }
    }
  } else if (generation === '4gen') {
    // 4세대 (개편실손) - 급여 20%, 비급여 30% (최소 비급여 3만원)
    if (medicalType === 'inpatient') {
      coveredDeductible = Math.round(coveredSelfPaid * 0.2); // 급여 20%
      uncoveredDeductible = Math.round(uncoveredExpense * 0.3); // 비급여 30%
      if (totalSpecialExpense > 0) {
        specialDeductible = Math.max(30000, Math.round(totalSpecialExpense * 0.3));
        specialDeductible = Math.min(totalSpecialExpense, specialDeductible);
      }
      notes.push('4세대 입원: 급여 20% 공제, 비급여 30% 공제.');
    } else if (medicalType === 'outpatient') {
      // 급여 공제: 급여 20% vs 병원급 최소공제(의원 1만, 상급 2만) 중 큰 금액
      if (coveredSelfPaid > 0) {
        const minCoveredDeductible = hospitalLevel === 'clinic' ? 10000 : 20000;
        coveredDeductible = Math.max(minCoveredDeductible, Math.round(coveredSelfPaid * 0.2));
        coveredDeductible = Math.min(coveredSelfPaid, coveredDeductible);
      }
      // 비급여 공제: 비급여 30% vs 최소 3만원 중 큰 금액
      if (uncoveredExpense > 0) {
        uncoveredDeductible = Math.max(30000, Math.round(uncoveredExpense * 0.3));
        uncoveredDeductible = Math.min(uncoveredExpense, uncoveredDeductible);
      }
      // 3대 특약: 비급여 30% vs 최소 3만원 중 큰 금액
      if (totalSpecialExpense > 0) {
        specialDeductible = Math.max(30000, Math.round(totalSpecialExpense * 0.3));
        specialDeductible = Math.min(totalSpecialExpense, specialDeductible);
      }
      notes.push('4세대 외래: 급여(20% vs 최소 1만~2만원 중 큰 금액), 비급여(30% vs 최소 3만원 중 큰 금액).');
    } else {
      // 4세대 처방조제비 (개편): 급여분/비급여분을 각각 일반 진료비와 동일한 방식으로 별도 공제
      // 급여: MAX[병원급 최소(1만~2만원), 급여 20%] / 비급여: MAX[3만원, 비급여 30%]
      if (coveredSelfPaid > 0) {
        const minCoveredPharmacy = hospitalLevel === 'clinic' ? 10000 : 20000;
        let coveredPharmacyDed = Math.max(minCoveredPharmacy, Math.round(coveredSelfPaid * 0.2));
        coveredPharmacyDed = Math.min(coveredSelfPaid, coveredPharmacyDed);
        pharmacyDeductible += coveredPharmacyDed;
      }
      if (uncoveredExpense > 0) {
        let uncoveredPharmacyDed = Math.max(30000, Math.round(uncoveredExpense * 0.3));
        uncoveredPharmacyDed = Math.min(uncoveredExpense, uncoveredPharmacyDed);
        pharmacyDeductible += uncoveredPharmacyDed;
      }
      if (pharmacyTotal > 0) {
        notes.push('4세대 약제비(개편): 급여분(20% vs 병원급 최소 1만~2만원)과 비급여분(30% vs 최소 3만원)을 각각 별도 공제.');
      }
    }
  } else {
    // 5세대 (2025년 개정 실손) - 급여 / 중증 비급여(산정특례, 특약1) / 비중증 비급여(특약2) 3단계 체계
    // 최소공제: 의원·일반병원급 1만원 / 종합병원·상급종합병원 2만원
    const minCovered5gen = is5genUpperHospital ? 20000 : 10000;
    const uncoveredRateLabel = isSanjeongTeukrye ? '중증 비급여(산정특례, 자기부담 30%)' : '비중증 비급여(일반질환, 자기부담 50%)';

    if (medicalType === 'inpatient') {
      // ① 급여: 본인부담률 20% (입원은 병원급 최소공제 비교 없이 정률만 적용)
      coveredDeductible = Math.round(coveredSelfPaid * 0.2);

      if (isSanjeongTeukrye) {
        // ② 중증 비급여(특약1) 입원: 비급여의료비(병실료 제외) x 30% 공제
        uncoveredDeductible = Math.round(uncoveredExpense * 0.3);
        notes.push('5세대 입원(중증비급여·산정특례): 급여 20%, 비급여(병실료 제외) 30% 자기부담. (연간 보상한도 5,000만원, 정보 제공용)');
      } else {
        // ③ 비중증 비급여(특약2) 입원: 비급여의료비(병실료 제외) x 50% 공제
        uncoveredDeductible = Math.round(uncoveredExpense * 0.5);
        // 종합병원 이상이 아니면 1회 입원당 300만원 한도 적용
        if (!is5genUpperHospital) {
          const uncoveredClaimable = Math.max(0, uncoveredExpense - uncoveredDeductible);
          const cappedClaimable = Math.min(uncoveredClaimable, 3000000);
          if (cappedClaimable < uncoveredClaimable) {
            uncoveredDeductible += uncoveredClaimable - cappedClaimable;
            notes.push('5세대 비중증 비급여 입원: 종합병원 미만 의료기관은 1회 입원당 300만원 한도가 적용되어 초과분이 차감되었습니다.');
          }
        }
        notes.push(`5세대 입원(${uncoveredRateLabel}): 급여 20%, 비급여(병실료 제외) 50% 자기부담. (연간 보상한도 1,000만원, 정보 제공용)`);
      }

      // 상급병실료 차액: min(병실료 x 0.5, 입원일수 x 10만원) 만큼만 지급 (중증/비중증 공통)
      if (uncoveredRoomFee > 0) {
        const roomFeePayout = Math.min(uncoveredRoomFee * 0.5, admissionDays * 100000);
        const roomFeeDeductible = Math.max(0, uncoveredRoomFee - roomFeePayout);
        uncoveredDeductible += roomFeeDeductible;
        notes.push(`상급병실료 차액: ${uncoveredRoomFee.toLocaleString()}원 중 ${Math.round(roomFeePayout).toLocaleString()}원 지급 (병실료의 50% 와 입원일수×10만원 중 작은 금액).`);
      }

      // 3대 비급여 특약(도수/주사/MRI): 산정특례 여부에 따라 30%(최소 3만원) 또는 50%(최소 5만원)
      if (totalSpecialExpense > 0) {
        const specialRate = isSanjeongTeukrye ? 0.3 : 0.5;
        const specialMin = isSanjeongTeukrye ? 30000 : 50000;
        specialDeductible = Math.max(specialMin, Math.round(totalSpecialExpense * specialRate));
        specialDeductible = Math.min(totalSpecialExpense, specialDeductible);
        notes.push(`5세대 3대 비급여 특약: ${isSanjeongTeukrye ? '30%(최소 3만원)' : '50%(최소 5만원)'} 공제 (도수 연 350만/50회, 주사 연 250만/50회, MRI 연 300만원 한도는 정보 제공용).`);
      }
    } else if (medicalType === 'outpatient') {
      // ① 급여 통원 (회당): max(최소공제, 급여x20%) 공제 후 회당 20만원 한도
      if (coveredSelfPaid > 0) {
        coveredDeductible = Math.max(minCovered5gen, Math.round(coveredSelfPaid * 0.2));
        coveredDeductible = Math.min(coveredSelfPaid, coveredDeductible);
        const coveredClaimable = Math.max(0, coveredSelfPaid - coveredDeductible);
        if (coveredClaimable > 200000) {
          coveredDeductible += coveredClaimable - 200000;
        }
      }

      // ②③ 비급여 통원: 산정특례 여부에 따라 30%(최소 3만, 연 100회) 또는 50%(1일당, 최소 5만, 연 100일) 공제 후 회당(1일당) 20만원 한도
      if (uncoveredExpense > 0) {
        const uncoveredRate = isSanjeongTeukrye ? 0.3 : 0.5;
        const uncoveredMin = isSanjeongTeukrye ? 30000 : 50000;
        uncoveredDeductible = Math.max(uncoveredMin, Math.round(uncoveredExpense * uncoveredRate));
        uncoveredDeductible = Math.min(uncoveredExpense, uncoveredDeductible);
        const uncoveredClaimable = Math.max(0, uncoveredExpense - uncoveredDeductible);
        if (uncoveredClaimable > 200000) {
          uncoveredDeductible += uncoveredClaimable - 200000;
        }
      }

      // 3대 비급여 특약(도수/주사/MRI): 산정특례 여부에 따라 30%(최소 3만원) 또는 50%(최소 5만원)
      if (totalSpecialExpense > 0) {
        const specialRate = isSanjeongTeukrye ? 0.3 : 0.5;
        const specialMin = isSanjeongTeukrye ? 30000 : 50000;
        specialDeductible = Math.max(specialMin, Math.round(totalSpecialExpense * specialRate));
        specialDeductible = Math.min(totalSpecialExpense, specialDeductible);
      }

      notes.push(`5세대 통원: 급여(20% vs 최소 ${minCovered5gen.toLocaleString()}원, 회당 20만원 한도), ${uncoveredRateLabel}(1회/1일당 20만원 한도, ${isSanjeongTeukrye ? '연 100회' : '연 100일'} 한도는 정보 제공용).`);
    } else {
      // 약제비: 명시적 세대별 규정이 없어 5세대 급여/비급여 원칙(급여 20% vs 최소공제, 비급여 30%/50%)을 준용
      if (coveredSelfPaid > 0) {
        let coveredPharmacyDed = Math.max(minCovered5gen, Math.round(coveredSelfPaid * 0.2));
        coveredPharmacyDed = Math.min(coveredSelfPaid, coveredPharmacyDed);
        pharmacyDeductible += coveredPharmacyDed;
      }
      if (uncoveredExpense > 0) {
        const uncoveredRate = isSanjeongTeukrye ? 0.3 : 0.5;
        const uncoveredMin = isSanjeongTeukrye ? 30000 : 50000;
        let uncoveredPharmacyDed = Math.max(uncoveredMin, Math.round(uncoveredExpense * uncoveredRate));
        uncoveredPharmacyDed = Math.min(uncoveredExpense, uncoveredPharmacyDed);
        pharmacyDeductible += uncoveredPharmacyDed;
      }
      if (pharmacyTotal > 0) {
        notes.push(`5세대 약제비(※ 별도 세대 규정 미확정, 급여/비급여 원칙 준용): 급여분(20% vs 최소 ${minCovered5gen.toLocaleString()}원), ${uncoveredRateLabel.replace(/\(.*\)/, '')}분(${isSanjeongTeukrye ? '30% vs 최소 3만원' : '50% vs 최소 5만원'}) 각각 별도 공제.`);
      }
    }

    // ④ 건강보험/의료급여 미적용 예외 산식: 지급 = (실제부담금 - 공제금액) x 0.40
    if (isHealthInsuranceExempt) {
      const exemptAdjust = (expenseAmt: number, deductibleAmt: number) => {
        const claimable = Math.max(0, expenseAmt - deductibleAmt);
        return deductibleAmt + claimable * 0.6; // 잔액의 40%만 지급되도록 공제금액에 60%를 추가 반영
      };
      coveredDeductible = Math.round(exemptAdjust(coveredSelfPaid, coveredDeductible));
      uncoveredDeductible = Math.round(exemptAdjust(uncoveredExpense + uncoveredRoomFee, uncoveredDeductible));
      specialDeductible = Math.round(exemptAdjust(totalSpecialExpense, specialDeductible));
      pharmacyDeductible = Math.round(exemptAdjust(pharmacyTotal, pharmacyDeductible));
      notes.push('건강보험/의료급여 미적용자 예외 산식 적용: 공제 후 잔액의 40%만 지급됩니다.');
    }
  }

  // --- Limits calculation ---
  // 급여+비급여(기본형) 청구가능액과 3대 비급여 특약 청구가능액은 서로 다른 한도가 적용되므로 분리 산정한다.
  const basicClaimable = Math.max(0, (coveredSelfPaid - coveredDeductible) + (uncoveredExpense - uncoveredDeductible));
  const specialClaimable = Math.max(0, totalSpecialExpense - specialDeductible);
  const pharmacyClaimable = Math.max(0, pharmacyTotal - pharmacyDeductible);

  // 5세대는 급여/비급여/3대특약 각각의 회당 20만원 한도가 이미 해당 세대 분기 내에서
  // 개별적으로 반영되었으므로, 통합(급여+비급여) 방식의 일반 한도 로직은 5세대에는 적용하지 않는다.
  if (medicalType === 'outpatient' && generation !== '5gen') {
    const outpatientLimit = limits.outpatientLimitPerVisit || 200000;
    if (basicClaimable > outpatientLimit) {
      const basicExceeded = basicClaimable - outpatientLimit;
      exceededLimitDeduction += basicExceeded;
      notes.push(`통원(급여+비급여) 1회당 보장 한도(${outpatientLimit.toLocaleString()}원)를 초과하여 ${basicExceeded.toLocaleString()}원이 차감되었습니다.`);
    }

    if (totalSpecialExpense > 0) {
      const specialLimit = limits.specialLimitPerVisit || 200000;
      if (specialClaimable > specialLimit) {
        const specialExceeded = specialClaimable - specialLimit;
        exceededLimitDeduction += specialExceeded;
        notes.push(`3대 비급여 특약(도수/주사/MRI) 1회당 보장 한도(${specialLimit.toLocaleString()}원)를 초과하여 ${specialExceeded.toLocaleString()}원이 차감되었습니다.`);
      }
    }
  } else if (medicalType === 'pharmacy') {
    const pharmacyLimit = limits.pharmacyLimitPerVisit || 50000;
    if (pharmacyClaimable > pharmacyLimit) {
      exceededLimitDeduction += pharmacyClaimable - pharmacyLimit;
      notes.push(`약제 1회당 보장 한도(${pharmacyLimit.toLocaleString()}원)를 초과하여 ${(pharmacyClaimable - pharmacyLimit).toLocaleString()}원이 차감되었습니다.`);
    }
  }

  const totalDeductible = coveredDeductible + uncoveredDeductible + specialDeductible + pharmacyDeductible + exceededLimitDeduction;
  const reimbursementAmount = Math.max(0, totalMedicalExpense - totalDeductible);
  const coveragePercentage = totalMedicalExpense > 0 ? Math.round((reimbursementAmount / totalMedicalExpense) * 1000) / 10 : 0;

  // Breakdown Summary Cards
  // 약국(처방약제비) 방문 시에는 coveredSelfPaid/uncoveredExpense가 약제비 항목을 의미하므로
  // 급여/비급여 카드 대신 "처방 약제비 공제액" 카드 하나로 합쳐서 보여준다.
  if (medicalType === 'pharmacy') {
    if (pharmacyTotal > 0) {
      breakdownSummary.push({
        label: '처방 약제비 공제액',
        amount: pharmacyDeductible,
        description: `약제비 ${pharmacyTotal.toLocaleString()}원 중 차감`,
      });
    }
  } else {
    if (coveredSelfPaid > 0) {
      breakdownSummary.push({
        label: '급여 공제액',
        amount: coveredDeductible,
        description: `급여 발생액 ${coveredSelfPaid.toLocaleString()}원 중 공제`,
      });
    }
    if (uncoveredExpense > 0 || uncoveredRoomFee > 0) {
      const uncoveredLabel = generation === '5gen'
        ? (isSanjeongTeukrye ? '중증 비급여(산정특례) 공제액' : '비중증 비급여 공제액')
        : '일반 비급여 공제액';
      breakdownSummary.push({
        label: uncoveredLabel,
        amount: uncoveredDeductible,
        description: `비급여 발생액 ${uncoveredExpense.toLocaleString()}원${uncoveredRoomFee > 0 ? ` (+병실료 ${uncoveredRoomFee.toLocaleString()}원)` : ''} 중 공제`,
      });
    }
  }
  if (totalSpecialExpense > 0) {
    breakdownSummary.push({
      label: '3대 특약 비급여 공제액',
      amount: specialDeductible,
      description: `3대 특약 ${totalSpecialExpense.toLocaleString()}원 중 차감`,
    });
  }
  if (exceededLimitDeduction > 0) {
    breakdownSummary.push({
      label: '보장 한도 초과 차감',
      amount: exceededLimitDeduction,
      description: '1회당 보장 한도 초과 금액',
    });
  }

  const deductionDetail: DeductionDetail = {
    coveredDeductible,
    uncoveredDeductible,
    specialDeductible,
    pharmacyDeductible,
    exceededLimitDeduction,
    totalDeductible,
  };

  return {
    totalMedicalExpense,
    deductionDetail,
    reimbursementAmount,
    coveragePercentage,
    generationName: GENERATION_INFOS[generation].title,
    hospitalLevelName: hospitalInfo.name,
    notes,
    breakdownSummary,
  };
}
