export type UnitCategory = "distance" | "weight" | "temperature" | "area";

const unitFactors: Record<Exclude<UnitCategory, "temperature">, Record<string, number>> = {
  distance: {
    มิลลิเมตร: 0.001,
    เซนติเมตร: 0.01,
    เมตร: 1,
    กิโลเมตร: 1000,
    นิ้ว: 0.0254,
    ฟุต: 0.3048,
    ไมล์: 1609.344,
  },
  weight: {
    มิลลิกรัม: 0.000001,
    กรัม: 0.001,
    กิโลกรัม: 1,
    ปอนด์: 0.45359237,
    ออนซ์: 0.028349523125,
  },
  area: {
    "ตารางเมตร": 1,
    "ตารางฟุต": 0.09290304,
    "ตารางวา": 4,
    งาน: 400,
    ไร่: 1600,
  },
};

export function unitsFor(category: UnitCategory): string[] {
  return category === "temperature"
    ? ["เซลเซียส", "ฟาเรนไฮต์", "เคลวิน"]
    : Object.keys(unitFactors[category]);
}

export function convertUnitValue(
  category: UnitCategory,
  value: number,
  from: string,
  to: string,
): number {
  if (!Number.isFinite(value)) throw new Error("กรุณาระบุตัวเลขที่ต้องการแปลง");
  if (category === "temperature") {
    const celsius =
      from === "ฟาเรนไฮต์"
        ? (value - 32) * (5 / 9)
        : from === "เคลวิน"
          ? value - 273.15
          : value;
    const converted =
      to === "ฟาเรนไฮต์"
        ? celsius * (9 / 5) + 32
        : to === "เคลวิน"
          ? celsius + 273.15
          : celsius;
    if (to === "เคลวิน" && converted < 0)
      throw new Error("อุณหภูมิต่ำกว่าศูนย์เคลวินไม่ได้");
    return converted;
  }
  const factors = unitFactors[category];
  if (!(from in factors) || !(to in factors))
    throw new Error("เลือกหน่วยต้นทางและปลายทางให้ถูกต้อง");
  return (value * factors[from]) / factors[to];
}

export type BillBreakdown = {
  subtotal: number;
  service: number;
  vat: number;
  tip: number;
  total: number;
  perPerson: number;
};

const roundSatang = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export function calculateBillBreakdown(
  subtotal: number,
  people: number,
  servicePercent: number,
  vatPercent: number,
  tipPercent: number,
): BillBreakdown {
  const numbers = [subtotal, people, servicePercent, vatPercent, tipPercent];
  if (!numbers.every(Number.isFinite) || subtotal < 0 || people < 1)
    throw new Error("ตรวจยอดเงินและจำนวนคนอีกครั้ง");
  if ([servicePercent, vatPercent, tipPercent].some((value) => value < 0 || value > 100))
    throw new Error("เปอร์เซ็นต์ต้องอยู่ระหว่าง 0 ถึง 100");
  const service = roundSatang((subtotal * servicePercent) / 100);
  const vat = roundSatang(((subtotal + service) * vatPercent) / 100);
  const tip = roundSatang((subtotal * tipPercent) / 100);
  const total = roundSatang(subtotal + service + vat + tip);
  return {
    subtotal: roundSatang(subtotal),
    service,
    vat,
    tip,
    total,
    perPerson: roundSatang(total / people),
  };
}

export type SexAtBirthForTdee = "female" | "male";

export function calculateBmiTdee(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: SexAtBirthForTdee,
  activity: number,
): { bmi: number; tdee: number } {
  if (
    ![weightKg, heightCm, age, activity].every(Number.isFinite) ||
    weightKg <= 0 ||
    heightCm <= 0 ||
    age < 18 ||
    ![1.2, 1.375, 1.55, 1.725, 1.9].includes(activity)
  ) {
    throw new Error("กรอกอายุ 18 ปีขึ้นไป น้ำหนัก ส่วนสูง และระดับกิจกรรมให้ถูกต้อง");
  }
  const bmi = weightKg / (heightCm / 100) ** 2;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
  return { bmi: Math.round(bmi * 10) / 10, tdee: Math.round(bmr * activity) };
}
