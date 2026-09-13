export type LoanCalculation = {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
};

export type SavingsCalculation = {
  endingBalance: number;
  contributed: number;
  interestEarned: number;
};

export type TripCostCalculation = {
  litersUsed: number;
  totalCost: number;
  costPerTraveler: number;
};

const roundSatang = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

function assertFinite(values: number[], message: string) {
  if (!values.every(Number.isFinite)) throw new Error(message);
}

export function calculateLoanRepayment(
  principal: number,
  annualInterestPercent: number,
  months: number,
): LoanCalculation {
  assertFinite([principal, annualInterestPercent, months], "ตรวจยอดสินเชื่อ อัตราดอกเบี้ย และระยะเวลาอีกครั้ง");
  if (principal <= 0 || principal > 1_000_000_000_000 || months < 1 || months > 600 || !Number.isInteger(months)) {
    throw new Error("ยอดสินเชื่อต้องมากกว่า 0 และระยะเวลาต้องอยู่ระหว่าง 1 ถึง 600 เดือน");
  }
  if (annualInterestPercent < 0 || annualInterestPercent > 100) {
    throw new Error("อัตราดอกเบี้ยต่อปีต้องอยู่ระหว่าง 0 ถึง 100 เปอร์เซ็นต์");
  }
  const monthlyRate = annualInterestPercent / 1200;
  const monthlyPayment = monthlyRate === 0
    ? principal / months
    : principal * monthlyRate / (1 - (1 + monthlyRate) ** -months);
  const totalPayment = monthlyPayment * months;
  return {
    monthlyPayment: roundSatang(monthlyPayment),
    totalPayment: roundSatang(totalPayment),
    totalInterest: roundSatang(Math.max(0, totalPayment - principal)),
  };
}

export function calculateCompoundSavings(
  startingBalance: number,
  monthlyDeposit: number,
  annualInterestPercent: number,
  years: number,
): SavingsCalculation {
  assertFinite([startingBalance, monthlyDeposit, annualInterestPercent, years], "ตรวจเงินต้น เงินออม ดอกเบี้ย และระยะเวลาอีกครั้ง");
  if (startingBalance < 0 || monthlyDeposit < 0 || startingBalance > 1_000_000_000_000 || monthlyDeposit > 1_000_000_000_000) {
    throw new Error("เงินต้นและเงินออมรายเดือนต้องไม่ติดลบและต้องไม่เกิน 1 ล้านล้านบาท");
  }
  if (startingBalance === 0 && monthlyDeposit === 0) throw new Error("กรอกเงินต้นหรือเงินออมรายเดือนอย่างน้อยหนึ่งค่า");
  if (annualInterestPercent < 0 || annualInterestPercent > 100) {
    throw new Error("อัตราดอกเบี้ยต่อปีต้องอยู่ระหว่าง 0 ถึง 100 เปอร์เซ็นต์");
  }
  if (years < 1 || years > 80 || !Number.isInteger(years)) {
    throw new Error("ระยะเวลาต้องอยู่ระหว่าง 1 ถึง 80 ปี");
  }

  const periods = years * 12;
  const monthlyRate = annualInterestPercent / 1200;
  const growth = (1 + monthlyRate) ** periods;
  const endingBalance = monthlyRate === 0
    ? startingBalance + monthlyDeposit * periods
    : startingBalance * growth + monthlyDeposit * ((growth - 1) / monthlyRate);
  const contributed = startingBalance + monthlyDeposit * periods;
  return {
    endingBalance: roundSatang(endingBalance),
    contributed: roundSatang(contributed),
    interestEarned: roundSatang(Math.max(0, endingBalance - contributed)),
  };
}

export function calculateTripFuelCost(
  distanceKm: number,
  kilometersPerLiter: number,
  fuelPricePerLiter: number,
  travelers: number,
): TripCostCalculation {
  assertFinite([distanceKm, kilometersPerLiter, fuelPricePerLiter, travelers], "ตรวจระยะทาง อัตราสิ้นเปลือง ราคาน้ำมัน และจำนวนคนอีกครั้ง");
  if (distanceKm <= 0 || distanceKm > 1_000_000) throw new Error("ระยะทางต้องมากกว่า 0 และไม่เกิน 1,000,000 กิโลเมตร");
  if (kilometersPerLiter <= 0 || kilometersPerLiter > 100) throw new Error("อัตราสิ้นเปลืองต้องอยู่ระหว่าง 0.1 ถึง 100 กิโลเมตรต่อลิตร");
  if (fuelPricePerLiter <= 0 || fuelPricePerLiter > 100_000) throw new Error("ราคาน้ำมันต่อลิตรต้องมากกว่า 0");
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 1_000) throw new Error("จำนวนผู้เดินทางต้องเป็นจำนวนเต็มตั้งแต่ 1 คน");
  const litersUsed = distanceKm / kilometersPerLiter;
  const totalCost = litersUsed * fuelPricePerLiter;
  return {
    litersUsed: Math.round((litersUsed + Number.EPSILON) * 100) / 100,
    totalCost: roundSatang(totalCost),
    costPerTraveler: roundSatang(totalCost / travelers),
  };
}

