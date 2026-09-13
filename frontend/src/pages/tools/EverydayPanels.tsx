import { useMemo, useState } from "react";
import { ArrowLeftRight, Coins, Shuffle } from "lucide-react";
import { ChoiceMenu, type Choice } from "@/components/ChoiceMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/language";
import {
  calculateCompoundSavings,
  calculateLoanRepayment,
  calculateTripFuelCost,
} from "@/lib/tool-engines";

type EverydayToolId =
  | "currency-converter"
  | "random-picker"
  | "loan-calculator"
  | "savings-calculator"
  | "trip-cost-calculator";

export function EverydayToolPanel({ toolId }: { toolId: string }) {
  switch (toolId as EverydayToolId) {
    case "currency-converter": return <CurrencyConverter />;
    case "random-picker": return <RandomPicker />;
    case "loan-calculator": return <LoanCalculator />;
    case "savings-calculator": return <SavingsCalculator />;
    case "trip-cost-calculator": return <TripCostCalculator />;
    default: return null;
  }
}

const currencies = [
  ["THB", "Thai baht"], ["USD", "US dollar"], ["EUR", "Euro"],
  ["JPY", "Japanese yen"], ["GBP", "British pound"], ["CNY", "Chinese yuan"],
  ["KRW", "South Korean won"], ["SGD", "Singapore dollar"],
  ["AUD", "Australian dollar"], ["CAD", "Canadian dollar"],
] as const;

function CurrencyConverter() {
  const { language, text } = useLanguage();
  const [amount, setAmount] = useState("100");
  const [rate, setRate] = useState("");
  const [from, setFrom] = useState("THB");
  const [to, setTo] = useState("USD");
  const choices: Choice[] = currencies.map(([code, name]) => ({
    value: code,
    label: `${code} · ${language === "th" ? currencyNameTh(code) : name}`,
    compact: code,
  }));
  const numericAmount = readNumber(amount);
  const numericRate = readNumber(rate);
  const result = numericAmount !== null && numericRate !== null && numericRate > 0
    ? numericAmount * numericRate
    : null;
  const swap = () => {
    setFrom(to);
    setTo(from);
    if (numericRate !== null && numericRate > 0) setRate(formatNumber(1 / numericRate, language, 8));
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">{text("แปลงค่าเงิน", "Currency conversion")}</h2>
        <p className="text-sm text-muted-foreground">
          {text("ใส่อัตราแลกเปลี่ยนล่าสุดด้วยตัวเอง เครื่องมือนี้ไม่ดึงราคาและไม่ส่งข้อมูลออกจากเบราว์เซอร์", "Enter a current exchange rate yourself. No live rates are fetched and your values stay in this browser.")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
          <Field label={text("สกุลเงินต้นทาง", "From currency")}>
            <ChoiceMenu className="choice-field" label={text("สกุลเงินต้นทาง", "From currency")} value={from} icon={Coins} choices={choices} onSelect={setFrom} />
          </Field>
          <Button className="justify-self-center" variant="outline" size="icon" aria-label={text("สลับสกุลเงิน", "Swap currencies")} onClick={swap}><ArrowLeftRight size={17} /></Button>
          <Field label={text("สกุลเงินปลายทาง", "To currency")}>
            <ChoiceMenu className="choice-field" label={text("สกุลเงินปลายทาง", "To currency")} value={to} icon={Coins} choices={choices} onSelect={setTo} />
          </Field>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <Field label={text(`จำนวน (${from})`, `Amount (${from})`)}>
            <Input inputMode="decimal" type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </Field>
          <Field label={text(`1 ${from} เท่ากับกี่ ${to}`, `Rate: 1 ${from} equals how many ${to}?`)}>
            <Input inputMode="decimal" type="number" min="0" step="any" value={rate} onChange={(event) => setRate(event.target.value)} placeholder={text("เช่น 0.028", "For example, 0.028")} />
          </Field>
        </div>
        {result !== null && Number.isFinite(result) ? (
          <ResultPanel label={text("จำนวนเงินโดยประมาณ", "Estimated amount")} value={`${formatNumber(result, language, 4)} ${to}`} detail={`${formatNumber(numericAmount!, language, 2)} ${from} × ${formatNumber(numericRate!, language, 8)}`} />
        ) : (
          <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground" role="status">
            {text("ใส่อัตราแลกเปลี่ยนเพื่อดูผลลัพธ์", "Enter an exchange rate to see the result.")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RandomPicker() {
  const { text } = useLanguage();
  const [items, setItems] = useState("");
  const [count, setCount] = useState("1");
  const [result, setResult] = useState<string[]>([]);
  const [error, setError] = useState("");
  const pick = () => {
    const entries = items.split(/\r?\n/u).map((item) => item.trim()).filter(Boolean);
    const requested = Number(count);
    if (entries.length === 0) {
      setResult([]);
      setError(text("ใส่รายการอย่างน้อยหนึ่งบรรทัด", "Enter at least one item, one per line."));
      return;
    }
    if (!Number.isInteger(requested) || requested < 1 || requested > entries.length) {
      setResult([]);
      setError(text(`เลือกได้ตั้งแต่ 1 ถึง ${entries.length} รายการ`, `Choose between 1 and ${entries.length} items.`));
      return;
    }
    const pool = [...entries];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const target = secureIndex(index + 1);
      [pool[index], pool[target]] = [pool[target], pool[index]];
    }
    setResult(pool.slice(0, requested));
    setError("");
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">{text("สุ่มเลือกชื่อหรือรายการ", "Random picker")}</h2>
        <p className="text-sm text-muted-foreground">{text("ใส่หนึ่งรายการต่อหนึ่งบรรทัด รายการจะอยู่ในหน้านี้เท่านั้น", "Enter one item per line. The list stays in this page only.")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label={text("รายการ", "Items")}>
          <Textarea value={items} onChange={(event) => { setItems(event.target.value); setResult([]); setError(""); }} rows={8} placeholder={text("เช่น\nข้าวผัด\nก๋วยเตี๋ยว\nส้มตำ", "For example\nPizza\nNoodles\nSalad")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Field label={text("จำนวนที่ต้องการสุ่ม", "Number of picks")}>
            <Input type="number" min="1" max="500" step="1" value={count} onChange={(event) => setCount(event.target.value)} />
          </Field>
          <Button onClick={pick}><Shuffle size={16} />{text("สุ่มเลือก", "Pick randomly")}</Button>
        </div>
        {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
        {result.length > 0 && <ol className="grid gap-2 sm:grid-cols-2" aria-live="polite" aria-label={text("ผลการสุ่ม", "Random picks")}>
          {result.map((item, index) => <li key={`${index}-${item}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground">{index + 1}</span><strong className="break-words">{item}</strong></li>)}
        </ol>}
      </CardContent>
    </Card>
  );
}

function LoanCalculator() {
  const { language, text } = useLanguage();
  const [principal, setPrincipal] = useState("500000");
  const [annualRate, setAnnualRate] = useState("6.5");
  const [months, setMonths] = useState("60");
  const calculation = useMemo(() => {
    try {
      return { result: calculateLoanRepayment(Number(principal), Number(annualRate), Number(months)), error: "" };
    } catch {
      return { result: null, error: text("ตรวจยอดเงิน อัตราดอกเบี้ย และจำนวนเดือนอีกครั้ง", "Check the principal, annual rate, and number of months.") };
    }
  }, [annualRate, months, principal, text]);
  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">{text("คำนวณค่างวดสินเชื่อ", "Loan payment estimate")}</h2>
        <p className="text-sm text-muted-foreground">{text("ประมาณค่างวดแบบลดต้นลดดอกด้วยอัตราคงที่ ไม่รวมค่าธรรมเนียมหรือเงื่อนไขเฉพาะผู้ให้กู้", "Estimates a fixed-rate amortizing loan. Fees and lender-specific terms are not included.")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
          <Field label={text("ยอดสินเชื่อ (บาท)", "Loan amount (THB)")}><Input type="number" min="1" step="1000" inputMode="decimal" value={principal} onChange={(event) => setPrincipal(event.target.value)} /></Field>
          <Field label={text("ดอกเบี้ยต่อปี (%)", "Annual interest (%)")}><Input type="number" min="0" max="100" step="0.01" inputMode="decimal" value={annualRate} onChange={(event) => setAnnualRate(event.target.value)} /></Field>
          <Field label={text("ระยะเวลา (เดือน)", "Term (months)")}><Input type="number" min="1" max="600" step="1" value={months} onChange={(event) => setMonths(event.target.value)} /></Field>
        </div>
        {calculation.error ? <ErrorNotice message={calculation.error} /> : calculation.result && <div className="grid gap-3 sm:grid-cols-3" aria-live="polite">
          <ResultMetric label={text("จ่ายต่อเดือน", "Monthly payment")} value={formatCurrency(calculation.result.monthlyPayment, language)} prominent />
          <ResultMetric label={text("ดอกเบี้ยรวม", "Total interest")} value={formatCurrency(calculation.result.totalInterest, language)} />
          <ResultMetric label={text("ยอดชำระรวม", "Total repayment")} value={formatCurrency(calculation.result.totalPayment, language)} />
        </div>}
      </CardContent>
    </Card>
  );
}

function SavingsCalculator() {
  const { language, text } = useLanguage();
  const [startingBalance, setStartingBalance] = useState("0");
  const [monthlyDeposit, setMonthlyDeposit] = useState("1000");
  const [annualRate, setAnnualRate] = useState("2.5");
  const [years, setYears] = useState("5");
  const calculation = useMemo(() => {
    try {
      return { result: calculateCompoundSavings(Number(startingBalance), Number(monthlyDeposit), Number(annualRate), Number(years)), error: "" };
    } catch {
      return { result: null, error: text("ตรวจเงินตั้งต้น เงินออม ดอกเบี้ย และระยะเวลาอีกครั้ง", "Check the starting balance, monthly deposit, interest rate, and term.") };
    }
  }, [annualRate, monthlyDeposit, startingBalance, text, years]);
  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">{text("คำนวณเงินออมทบต้น", "Compound savings estimate")}</h2>
        <p className="text-sm text-muted-foreground">{text("ประมาณผลตอบแทนเมื่อฝากเงินปลายเดือนและทบต้นรายเดือน อัตราจริงอาจเปลี่ยนแปลง", "Estimates monthly compounding with deposits at the end of each month. Actual rates can change.")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={text("เงินตั้งต้น (บาท)", "Starting balance (THB)")}><Input type="number" min="0" step="100" inputMode="decimal" value={startingBalance} onChange={(event) => setStartingBalance(event.target.value)} /></Field>
          <Field label={text("ออมต่อเดือน (บาท)", "Monthly deposit (THB)")}><Input type="number" min="0" step="100" inputMode="decimal" value={monthlyDeposit} onChange={(event) => setMonthlyDeposit(event.target.value)} /></Field>
          <Field label={text("ดอกเบี้ยต่อปี (%)", "Annual interest (%)")}><Input type="number" min="0" max="100" step="0.01" inputMode="decimal" value={annualRate} onChange={(event) => setAnnualRate(event.target.value)} /></Field>
          <Field label={text("ระยะเวลา (ปี)", "Term (years)")}><Input type="number" min="1" max="80" step="1" value={years} onChange={(event) => setYears(event.target.value)} /></Field>
        </div>
        {calculation.error ? <ErrorNotice message={calculation.error} /> : calculation.result && <div className="grid gap-3 sm:grid-cols-3" aria-live="polite">
          <ResultMetric label={text("เงินปลายทางโดยประมาณ", "Estimated ending balance")} value={formatCurrency(calculation.result.endingBalance, language)} prominent />
          <ResultMetric label={text("เงินที่ฝากทั้งหมด", "Total contributions")} value={formatCurrency(calculation.result.contributed, language)} />
          <ResultMetric label={text("ดอกผลโดยประมาณ", "Estimated interest earned")} value={formatCurrency(calculation.result.interestEarned, language)} />
        </div>}
      </CardContent>
    </Card>
  );
}

function TripCostCalculator() {
  const { language, text } = useLanguage();
  const [distance, setDistance] = useState("400");
  const [efficiency, setEfficiency] = useState("15");
  const [fuelPrice, setFuelPrice] = useState("35.5");
  const [travelers, setTravelers] = useState("2");
  const calculation = useMemo(() => {
    try {
      return { result: calculateTripFuelCost(Number(distance), Number(efficiency), Number(fuelPrice), Number(travelers)), error: "" };
    } catch {
      return { result: null, error: text("ตรวจระยะทาง อัตราสิ้นเปลือง ราคาน้ำมัน และจำนวนคนอีกครั้ง", "Check the distance, fuel efficiency, fuel price, and number of travelers.") };
    }
  }, [distance, efficiency, fuelPrice, text, travelers]);
  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">{text("คำนวณค่าน้ำมันเดินทาง", "Trip fuel cost estimate")}</h2>
        <p className="text-sm text-muted-foreground">{text("ใส่ระยะทางรวมของทริป หากเดินทางไป-กลับให้รวมระยะทางทั้งสองขา", "Enter the total trip distance. Include both directions for a round trip.")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={text("ระยะทางรวม (กม.)", "Total distance (km)")}><Input type="number" min="0.1" step="1" inputMode="decimal" value={distance} onChange={(event) => setDistance(event.target.value)} /></Field>
          <Field label={text("รถวิ่งได้ (กม./ลิตร)", "Fuel efficiency (km/L)")}><Input type="number" min="0.1" max="100" step="0.1" inputMode="decimal" value={efficiency} onChange={(event) => setEfficiency(event.target.value)} /></Field>
          <Field label={text("ราคาน้ำมัน (บาท/ลิตร)", "Fuel price (THB/L)")}><Input type="number" min="0.01" step="0.1" inputMode="decimal" value={fuelPrice} onChange={(event) => setFuelPrice(event.target.value)} /></Field>
          <Field label={text("จำนวนผู้เดินทาง", "Travelers")}><Input type="number" min="1" max="1000" step="1" value={travelers} onChange={(event) => setTravelers(event.target.value)} /></Field>
        </div>
        {calculation.error ? <ErrorNotice message={calculation.error} /> : calculation.result && <div className="grid gap-3 sm:grid-cols-3" aria-live="polite">
          <ResultMetric label={text("น้ำมันที่ใช้", "Fuel used")} value={`${formatNumber(calculation.result.litersUsed, language, 2)} L`} prominent />
          <ResultMetric label={text("ค่าน้ำมันรวม", "Total fuel cost")} value={formatCurrency(calculation.result.totalCost, language)} />
          <ResultMetric label={text("เฉลี่ยต่อคน", "Cost per traveler")} value={formatCurrency(calculation.result.costPerTraveler, language)} />
        </div>}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>;
}

function ResultPanel({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center" aria-live="polite"><span className="text-sm font-semibold text-muted-foreground">{label}</span><strong className="mt-1 block break-words text-3xl font-black text-foreground">{value}</strong><p className="mt-2 break-all text-xs text-muted-foreground">{detail}</p></section>;
}

function ResultMetric({ label, value, prominent = false }: { label: string; value: string; prominent?: boolean }) {
  return <div className={prominent ? "min-w-0 rounded-2xl border border-primary/35 bg-primary/8 p-4 sm:col-span-2 lg:col-span-1" : "min-w-0 rounded-2xl border border-border bg-background p-4"}><span className="block text-xs font-semibold text-muted-foreground">{label}</span><strong className={prominent ? "mt-1 block break-words text-2xl font-black text-foreground sm:text-3xl" : "mt-1 block break-words text-lg font-bold text-foreground"}>{value}</strong></div>;
}

function ErrorNotice({ message }: { message: string }) {
  return <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{message}</p>;
}

function readNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number, language: "th" | "en", maximumFractionDigits: number) {
  return new Intl.NumberFormat(language === "en" ? "en-US" : "th-TH", { maximumFractionDigits }).format(value);
}

function formatCurrency(value: number, language: "th" | "en") {
  return new Intl.NumberFormat(language === "en" ? "en-US" : "th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function currencyNameTh(code: string) {
  const names: Record<string, string> = { THB: "บาทไทย", USD: "ดอลลาร์สหรัฐ", EUR: "ยูโร", JPY: "เยนญี่ปุ่น", GBP: "ปอนด์สเตอร์ลิง", CNY: "หยวนจีน", KRW: "วอนเกาหลีใต้", SGD: "ดอลลาร์สิงคโปร์", AUD: "ดอลลาร์ออสเตรเลีย", CAD: "ดอลลาร์แคนาดา" };
  return names[code] ?? code;
}

function secureIndex(maxExclusive: number) {
  const range = 0x1_0000_0000;
  const limit = Math.floor(range / maxExclusive) * maxExclusive;
  const value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % maxExclusive;
}
