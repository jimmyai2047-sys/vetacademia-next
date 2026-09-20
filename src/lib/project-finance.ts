// Livestock project financial appraisal engine (bank-PDF convention).
// Locked decisions: discount rate 14% p.a., loan interest 14% p.a., analysis Year 1..6.
// Year-1 total cost includes capital investment + Year-1 working cost (Goat PDF convention).
// Formula source: Livestock_Financial_Model.xlsx (same set; workbook Year-0 shifted to Year-1).
// IRR/Payback treat Year-1 start as t=0 (same semantics as Excel IRR on the net series).

export const DISCOUNT_RATE = 0.14;
export const LOAN_INTEREST_RATE = 0.14;
export const PROJECT_YEARS = 6;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function sum(values: number[]): number {
  return values.reduce(function (s, v) {
    return s + v;
  }, 0);
}

/** DF = 1/(1+r)^year, year = 1..6 (Year-end convention, matches PDF). */
export function discountFactor(rate: number, year: number): number {
  return 1 / Math.pow(1 + rate, year);
}

/** NPV of a Year1..6 series at the given rate. */
export function npvOf(values: number[], rate: number): number {
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    total += values[i] * discountFactor(rate, i + 1);
  }
  return total;
}

/**
 * Excel-IRR-equivalent on a Year1..6 net series (Year-1 value treated as t=0).
 * Returns null when there is no sign change / no real root.
 */
export function irrOf(net: number[]): number | null {
  function npvAt(r: number): number {
    let total = 0;
    for (let i = 0; i < net.length; i++) {
      total += net[i] / Math.pow(1 + r, i);
    }
    return total;
  }
  let lo = -0.9999;
  let hi = 10;
  let fLo = npvAt(lo);
  let fHi = npvAt(hi);
  if (fLo === 0) return lo;
  if (fHi === 0) return hi;
  if (fLo * fHi > 0) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const f = npvAt(mid);
    if (f === 0) return mid;
    if (fLo * f < 0) {
      hi = mid;
      fHi = f;
    } else {
      lo = mid;
      fLo = f;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Payback period (project years, t=0 at Year-1 start).
 * Standard interpolation: last negative-cumulative year + (|cum| / next net).
 * Returns null when never recovered.
 */
export function paybackOf(net: number[]): number | null {
  let cum = 0;
  let prev = 0;
  for (let i = 0; i < net.length; i++) {
    prev = cum;
    cum += net[i];
    if (cum >= 0) {
      if (i === 0) return 0;
      if (net[i] === 0) return i - 1;
      return i - 1 + Math.abs(prev) / net[i];
    }
  }
  return null;
}

export interface AppraisalInput {
  /** Year1..Year6 totals; Year-1 cost must include capital investment. */
  totalCost: number[];
  totalIncome: number[];
  rate?: number;
}

export interface AppraisalResult {
  df: number[];
  pvCost: number[];
  pvIncome: number[];
  pvNet: number[];
  cumNet: number[];
  npvCost: number;
  npvIncome: number;
  npw: number;
  bcr: number;
  irr: number | null;
  payback: number | null;
}

export function appraise(input: AppraisalInput): AppraisalResult {
  const rate = input.rate == null ? DISCOUNT_RATE : input.rate;
  const n = Math.min(input.totalCost.length, input.totalIncome.length);
  const df: number[] = [];
  const pvCost: number[] = [];
  const pvIncome: number[] = [];
  const pvNet: number[] = [];
  const cumNet: number[] = [];
  const net: number[] = [];
  let cum = 0;
  for (let i = 0; i < n; i++) {
    const d = discountFactor(rate, i + 1);
    const pc = input.totalCost[i] * d;
    const pi = input.totalIncome[i] * d;
    const yearlyNet = input.totalIncome[i] - input.totalCost[i];
    cum += yearlyNet;
    df.push(d);
    pvCost.push(pc);
    pvIncome.push(pi);
    pvNet.push(pi - pc);
    cumNet.push(cum);
    net.push(yearlyNet);
  }
  const npvCost = sum(pvCost);
  const npvIncome = sum(pvIncome);
  return {
    df: df,
    pvCost: pvCost,
    pvIncome: pvIncome,
    pvNet: pvNet,
    cumNet: cumNet,
    npvCost: npvCost,
    npvIncome: npvIncome,
    npw: npvIncome - npvCost,
    bcr: npvCost === 0 ? 0 : npvIncome / npvCost,
    irr: irrOf(net),
    payback: paybackOf(net),
  };
}

export interface LoanScheduleRow {
  year: number;
  opening: number;
  principal: number;
  interest: number;
  debtService: number;
  closing: number;
  netIncome: number;
  dscr: number | null;
}

/**
 * Equal-principal loan schedule starting Year-1, reducing-balance interest.
 * netIncomes = Gross income minus recurring cost per year (workbook definition).
 */
export function loanSchedule(
  loanAmount: number,
  years: number,
  interestRate: number,
  netIncomes: number[]
): LoanScheduleRow[] {
  const rows: LoanScheduleRow[] = [];
  let balance = loanAmount;
  const installment = years > 0 ? loanAmount / years : 0;
  for (let y = 1; y <= years; y++) {
    const interest = balance * interestRate;
    const debtService = installment + interest;
    const netIncome = y - 1 < netIncomes.length ? netIncomes[y - 1] : 0;
    rows.push({
      year: y,
      opening: round2(balance),
      principal: round2(installment),
      interest: round2(interest),
      debtService: round2(debtService),
      closing: round2(balance - installment),
      netIncome: round2(netIncome),
      dscr: debtService === 0 ? null : round4(netIncome / debtService),
    });
    balance -= installment;
  }
  return rows;
}

export interface BreakEvenInput {
  price: number;
  fixedCost: number;
  vc1: number;
  vc2: number;
}

export interface BreakEvenResult {
  discriminant: number;
  q1: number | null;
  q2: number | null;
  sales1: number | null;
  sales2: number | null;
}

/** Curvilinear break-even: VC2*Q^2 + (VC1-P)*Q + FC = 0 → two outputs Q1, Q2. */
export function breakEven(input: BreakEvenInput): BreakEvenResult {
  const d = Math.pow(input.vc1 - input.price, 2) - 4 * input.vc2 * input.fixedCost;
  if (d < 0 || input.vc2 === 0) {
    return { discriminant: d, q1: null, q2: null, sales1: null, sales2: null };
  }
  const root = Math.sqrt(d);
  const q1 = (-(input.vc1 - input.price) - root) / (2 * input.vc2);
  const q2 = (-(input.vc1 - input.price) + root) / (2 * input.vc2);
  return {
    discriminant: d,
    q1: round2(q1),
    q2: round2(q2),
    sales1: round2(input.price * q1),
    sales2: round2(input.price * q2),
  };
}