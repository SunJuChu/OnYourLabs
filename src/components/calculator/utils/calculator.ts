import {
  CalculationInput,
  CalculationResult,
  DeductionDetail,
} from '../types';
import { GENERATION_INFOS, HOSPITAL_LEVEL_INFOS } from '../data/insuranceRules';

export function calculateInsuranceRefund(input: CalculationInput): CalculationResult {
  const { generation, medicalType, hospitalLevel, expenses, limits } = input;

  const coveredSelfPaid = Math.max(0, expenses.coveredSelfPaid || 0);
  const uncoveredExpense = Math.max(0, expenses.uncoveredExpense || 0);
  const specialManual = Math.max(0, expenses.specialManualTherapy || 0);
  const specialInjection = Math.max(0, expenses.specialInjection || 0);
  const specialMri = Math.max(0, expenses.specialMri || 0);
  const pharmacyExpense = Math.max(0, expenses.pharmacyExpense || 0);

  const totalSpecialExpense = specialManual + specialInjection + specialMri;
  const totalMedicalExpense = coveredSelfPaid + uncoveredExpense + totalSpecialExpense + pharmacyExpense;

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
      // 약제비
      if (pharmacyExpense > 0) {
        pharmacyDeductible = Math.min(pharmacyExpense, 5000);
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
      // 약제비: 8,000원 vs 10~20% 중 큰 금액
      if (pharmacyExpense > 0) {
        pharmacyDeductible = Math.max(8000, Math.round(pharmacyExpense * 0.2));
        pharmacyDeductible = Math.min(pharmacyExpense, pharmacyDeductible);
        notes.push('2세대 약제비: 최소 공제액 8,000원 또는 20% 중 큰 금액 차감.');
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
      if (pharmacyExpense > 0) {
        pharmacyDeductible = Math.max(8000, Math.round(pharmacyExpense * 0.2));
        pharmacyDeductible = Math.min(pharmacyExpense, pharmacyDeductible);
        notes.push('3세대 약제비: 8,000원 또는 20% 중 큰 금액 차감.');
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
      if (pharmacyExpense > 0) {
        pharmacyDeductible = Math.max(8000, Math.round(pharmacyExpense * 0.2));
        pharmacyDeductible = Math.min(pharmacyExpense, pharmacyDeductible);
        notes.push('4세대 약제비: 최소 8,000원 공제.');
      }
    }
  } else {
    // 5세대 (최신 개정 실손) - 급여 20%, 비급여 35%~40% (최소 3만~5만원)
    if (medicalType === 'inpatient') {
      coveredDeductible = Math.round(coveredSelfPaid * 0.2);
      uncoveredDeductible = Math.round(uncoveredExpense * 0.35);
      if (totalSpecialExpense > 0) {
        specialDeductible = Math.max(40000, Math.round(totalSpecialExpense * 0.4));
        specialDeductible = Math.min(totalSpecialExpense, specialDeductible);
      }
      notes.push('5세대 입원: 급여 20%, 비급여 35%~40% 자기부담.');
    } else if (medicalType === 'outpatient') {
      if (coveredSelfPaid > 0) {
        const minCovered = hospitalLevel === 'clinic' ? 10000 : 20000;
        coveredDeductible = Math.max(minCovered, Math.round(coveredSelfPaid * 0.2));
        coveredDeductible = Math.min(coveredSelfPaid, coveredDeductible);
      }
      if (uncoveredExpense > 0) {
        uncoveredDeductible = Math.max(35000, Math.round(uncoveredExpense * 0.35));
        uncoveredDeductible = Math.min(uncoveredExpense, uncoveredDeductible);
      }
      if (totalSpecialExpense > 0) {
        specialDeductible = Math.max(40000, Math.round(totalSpecialExpense * 0.4));
        specialDeductible = Math.min(totalSpecialExpense, specialDeductible);
      }
      notes.push('5세대 외래: 급여 20%, 비급여 35% (최소 3.5만원 공제), 3대 특약 40% (최소 4만원).');
    } else {
      if (pharmacyExpense > 0) {
        pharmacyDeductible = Math.max(10000, Math.round(pharmacyExpense * 0.25));
        pharmacyDeductible = Math.min(pharmacyExpense, pharmacyDeductible);
        notes.push('5세대 약제비: 최소 10,000원 공제.');
      }
    }
  }

  // --- Limits calculation ---
  let tempClaimable = totalMedicalExpense - (coveredDeductible + uncoveredDeductible + specialDeductible + pharmacyDeductible);
  tempClaimable = Math.max(0, tempClaimable);

  if (medicalType === 'outpatient') {
    const outpatientLimit = limits.outpatientLimitPerVisit || 200000;
    if (tempClaimable > outpatientLimit) {
      exceededLimitDeduction = tempClaimable - outpatientLimit;
      notes.push(`통원 1회당 보장 한도(${outpatientLimit.toLocaleString()}원)를 초과하여 ${exceededLimitDeduction.toLocaleString()}원이 차감되었습니다.`);
    }
  } else if (medicalType === 'pharmacy') {
    const pharmacyLimit = limits.pharmacyLimitPerVisit || 50000;
    if (tempClaimable > pharmacyLimit) {
      exceededLimitDeduction = tempClaimable - pharmacyLimit;
      notes.push(`약제 1회당 보장 한도(${pharmacyLimit.toLocaleString()}원)를 초과하여 ${exceededLimitDeduction.toLocaleString()}원이 차감되었습니다.`);
    }
  }

  const totalDeductible = coveredDeductible + uncoveredDeductible + specialDeductible + pharmacyDeductible + exceededLimitDeduction;
  const reimbursementAmount = Math.max(0, totalMedicalExpense - totalDeductible);
  const coveragePercentage = totalMedicalExpense > 0 ? Math.round((reimbursementAmount / totalMedicalExpense) * 1000) / 10 : 0;

  // Breakdown Summary Cards
  if (coveredSelfPaid > 0) {
    breakdownSummary.push({
      label: '급여 공제액',
      amount: coveredDeductible,
      description: `급여 발생액 ${coveredSelfPaid.toLocaleString()}원 중 공제`,
    });
  }
  if (uncoveredExpense > 0) {
    breakdownSummary.push({
      label: '일반 비급여 공제액',
      amount: uncoveredDeductible,
      description: `비급여 발생액 ${uncoveredExpense.toLocaleString()}원 중 공제`,
    });
  }
  if (totalSpecialExpense > 0) {
    breakdownSummary.push({
      label: '3대 특약 비급여 공제액',
      amount: specialDeductible,
      description: `3대 특약 ${totalSpecialExpense.toLocaleString()}원 중 차감`,
    });
  }
  if (pharmacyExpense > 0) {
    breakdownSummary.push({
      label: '처방 약제비 공제액',
      amount: pharmacyDeductible,
      description: `약제비 ${pharmacyExpense.toLocaleString()}원 중 차감`,
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
