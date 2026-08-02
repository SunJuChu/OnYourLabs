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
    // 1세대 (구실손): 3대 비급여 구분 없음 (주계약에 통합)
    if (medicalType === 'inpatient') {
      coveredDeductible = 0;
      uncoveredDeductible = 0;
      specialDeductible = 0;
      notes.push('1세대 입원 치료는 본인부담금 100% 전액 보장됩니다 (공제금액 0원).');
    } else if (medicalType === 'outpatient') {
      const baseDeductible = hospitalLevel === 'clinic' ? 5000 : hospitalLevel === 'hospital' ? 8000 : 10000;
      const totalOutpatientExpense = coveredSelfPaid + uncoveredExpense + totalSpecialExpense;
      
      if (totalOutpatientExpense > 0) {
        const actualDeductible = Math.min(totalOutpatientExpense, baseDeductible);
        coveredDeductible = Math.round(actualDeductible * (coveredSelfPaid / Math.max(1, totalOutpatientExpense)));
        uncoveredDeductible = actualDeductible - coveredDeductible;
        notes.push(`1세대 외래 정액 공제: ${hospitalInfo.name} 기준 1회 당 ${baseDeductible.toLocaleString()}원 차감.`);
      }
    } else {
      if (pharmacyExpense > 0) {
        pharmacyDeductible = Math.min(pharmacyExpense, 5000);
        notes.push('1세대 약제비: 1회당 5,000원 정액 공제.');
      }
    }
  } else if (generation === '2gen') {
    // 2세대 (표준화 실손): 3대 비급여 구분 없음 (주계약에 통합)
    if (medicalType === 'inpatient') {
      coveredDeductible = Math.round(coveredSelfPaid * 0.1);
      uncoveredDeductible = Math.round((uncoveredExpense + totalSpecialExpense) * 0.2);
      notes.push('2세대 입원: 급여 10% 자기부담, 비급여 20% 자기부담.');
    } else if (medicalType === 'outpatient') {
      const outpatientTotal = coveredSelfPaid + uncoveredExpense + totalSpecialExpense;
      if (outpatientTotal > 0) {
        const ratioDeductible = (coveredSelfPaid * 0.1) + ((uncoveredExpense + totalSpecialExpense) * 0.2);
        
        if (ratioDeductible >= minHospitalDeductible) {
          coveredDeductible = Math.round(coveredSelfPaid * 0.1);
          uncoveredDeductible = Math.round((uncoveredExpense + totalSpecialExpense) * 0.2);
          notes.push(`2세대 외래: 비율 공제(${Math.round(ratioDeductible).toLocaleString()}원) 적용.`);
        } else {
          coveredDeductible = Math.round(minHospitalDeductible * (coveredSelfPaid / Math.max(1, outpatientTotal)));
          uncoveredDeductible = Math.min(outpatientTotal, minHospitalDeductible) - coveredDeductible;
          notes.push(`2세대 외래: 병원급 최소 공제액(${minHospitalDeductible.toLocaleString()}원) 적용.`);
        }
      }
    } else {
      if (pharmacyExpense > 0) {
        pharmacyDeductible = Math.max(8000, Math.round(pharmacyExpense * 0.2));
        pharmacyDeductible = Math.min(pharmacyExpense, pharmacyDeductible);
        notes.push('2세대 약제비: 최소 공제액 8,000원 또는 20% 중 큰 금액 차감.');
      }
    }
  } else if (generation === '3gen') {
    // 3세대 (착한실손): 3대 특약 30% vs 2만원 별도 공제
    if (medicalType === 'inpatient') {
      coveredDeductible = Math.round(coveredSelfPaid * 0.1);
      uncoveredDeductible = Math.round(uncoveredExpense * 0.2);
      if (totalSpecialExpense > 0) {
        specialDeductible = Math.max(20000, Math.round(totalSpecialExpense * 0.3));
        specialDeductible = Math.min(totalSpecialExpense, specialDeductible);
      }
      notes.push('3세대 입원: 급여 10%, 일반비급여 20%, 3대특약 30%(최소 2만원) 차감.');
    } else if (medicalType === 'outpatient') {
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
      // 3대 특약 항목별 공제 (회당 30% vs 2만원)
      if (specialManual > 0) {
        specialDeductible += Math.min(specialManual, Math.max(20000, Math.round(specialManual * 0.3)));
      }
      if (specialInjection > 0) {
        specialDeductible += Math.min(specialInjection, Math.max(20000, Math.round(specialInjection * 0.3)));
      }
      if (specialMri > 0) {
        specialDeductible += Math.min(specialMri, Math.max(20000, Math.round(specialMri * 0.3)));
      }
      notes.push(`3세대 외래: 기본 진료비(최소 ${minHospitalDeductible.toLocaleString()}원 vs 10~20%) + 3대특약(30% vs 2만원) 별도 공제.`);
    } else {
      if (pharmacyExpense > 0) {
        pharmacyDeductible = Math.max(8000, Math.round(pharmacyExpense * 0.2));
        pharmacyDeductible = Math.min(pharmacyExpense, pharmacyDeductible);
        notes.push('3세대 약제비: 8,000원 또는 20% 중 큰 금액 차감.');
      }
    }
  } else if (generation === '4gen') {
    // 4세대 (개편실손): 급여 20%, 비급여 합산 30% (최소 3만원)
    const combinedUncovered = uncoveredExpense + totalSpecialExpense;
    
    if (medicalType === 'inpatient') {
      coveredDeductible = Math.round(coveredSelfPaid * 0.2);
      uncoveredDeductible = Math.round(combinedUncovered * 0.3);
      notes.push('4세대 입원: 급여 20% 공제, 비급여(3대특약 포함) 30% 공제.');
    } else if (medicalType === 'outpatient') {
      // 급여 공제 (최소 1만~2만 원 vs 20%)
      if (coveredSelfPaid > 0) {
        const minCoveredDeductible = hospitalLevel === 'clinic' ? 10000 : 20000;
        coveredDeductible = Math.max(minCoveredDeductible, Math.round(coveredSelfPaid * 0.2));
        coveredDeductible = Math.min(coveredSelfPaid, coveredDeductible);
      }
      // 비급여 전체 합산 공제 (최소 3만 원 vs 30%)
      if (combinedUncovered > 0) {
        const totalUncoveredDed = Math.max(30000, Math.round(combinedUncovered * 0.3));
        const finalUncoveredDed = Math.min(combinedUncovered, totalUncoveredDed);
        
        // 표 구분을 위해 비율대로 나눠 배분
        if (totalSpecialExpense > 0 && uncoveredExpense > 0) {
          uncoveredDeductible = Math.round(finalUncoveredDed * (uncoveredExpense / combinedUncovered));
          specialDeductible = finalUncoveredDed - uncoveredDeductible;
        } else if (totalSpecialExpense > 0) {
          specialDeductible = finalUncoveredDed;
        } else {
          uncoveredDeductible = finalUncoveredDed;
        }
      }
      notes.push('4세대 외래: 급여(20% vs 최소 1만~2만원), 비급여 전체(30% vs 최소 3만원) 통합 공제.');
    } else {
      if (pharmacyExpense > 0) {
        pharmacyDeductible = Math.max(8000, Math.round(pharmacyExpense * 0.2));
        pharmacyDeductible = Math.min(pharmacyExpense, pharmacyDeductible);
        notes.push('4세대 약제비: 최소 8,000원 공제.');
      }
    }
  }

  // --- Limits & Capping Logic (한도 차감 연산) ---
  if (medicalType === 'outpatient') {
    const outpatientLimit = limits.outpatientLimitPerVisit || 200000;

    if (generation === '1gen' || generation === '2gen') {
      // 1·2세대는 3대 비급여 구분 없이 통원 청구가능액 전체를 1일 통원 한도로 캡핑
      const totalClaimable = Math.max(0, totalMedicalExpense - (coveredDeductible + uncoveredDeductible));
      if (totalClaimable > outpatientLimit) {
        exceededLimitDeduction = totalClaimable - outpatientLimit;
        notes.push(`1일 통원 보장 한도(${outpatientLimit.toLocaleString()}원) 초과로 ${exceededLimitDeduction.toLocaleString()}원이 차감되었습니다.`);
      }
    } else {
      // 3·4세대는 기본형(급여+일반비급여) 한도와 3대 특약 한도를 분리 적용
      const basicClaimable = Math.max(0, (coveredSelfPaid - coveredDeductible) + (uncoveredExpense - uncoveredDeductible));
      const specialClaimable = Math.max(0, totalSpecialExpense - specialDeductible);

      if (basicClaimable > outpatientLimit) {
        const basicExceeded = basicClaimable - outpatientLimit;
        exceededLimitDeduction += basicExceeded;
        notes.push(`통원(급여+일반비급여) 1회당 보장 한도(${outpatientLimit.toLocaleString()}원)를 초과하여 ${basicExceeded.toLocaleString()}원이 차감되었습니다.`);
      }

      if (totalSpecialExpense > 0) {
        const specialLimit = limits.specialLimitPerVisit || 200000;
        if (specialClaimable > specialLimit) {
          const specialExceeded = specialClaimable - specialLimit;
          exceededLimitDeduction += specialExceeded;
          notes.push(`3대 비급여 특약 1회당 보장 한도(${specialLimit.toLocaleString()}원)를 초과하여 ${specialExceeded.toLocaleString()}원이 차감되었습니다.`);
        }
      }
    }
  } else if (medicalType === 'pharmacy') {
    const pharmacyClaimable = Math.max(0, pharmacyExpense - pharmacyDeductible);
    const pharmacyLimit = limits.pharmacyLimitPerVisit || 50000;
    if (pharmacyClaimable > pharmacyLimit) {
      exceededLimitDeduction = pharmacyClaimable - pharmacyLimit;
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
