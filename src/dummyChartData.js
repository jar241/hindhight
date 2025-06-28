// Seeded random number generator for consistent data
class SeededRandom {
  constructor(seed = 12345) {
    this.seed = seed;
  }

  // Returns a random number between 0 and 1
  random() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Returns a random number between min and max
  randomRange(min, max) {
    return min + (max - min) * this.random();
  }
}

const seededRandom = new SeededRandom();

// 동적 더미 차트 데이터 생성 함수들
function addNoise(y, amp = 2) {
  return y + (Math.random() - 0.5) * amp;
}

export function generate1DData() {
  const today = new Date();
  return [{ x: new Date(today), y: addNoise(75, 1) }];
}

export function generate5DData() {
  const today = new Date();
  const data = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    data.push({ x: new Date(d), y: addNoise(74 + i, 2) });
  }
  return data;
}

export function generate1MData() {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(today.getMonth() - 1);
  const data = [];
  let d = new Date(start);
  let base = 72;
  while (d <= today) {
    data.push({ x: new Date(d), y: addNoise(base, 2) });
    d.setDate(d.getDate() + 5);
    base += Math.random() * 1.5 - 0.5;
  }
  return data;
}

export function generate3MData() {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(today.getMonth() - 3);
  const data = [];
  let d = new Date(start);
  let base = 75;
  while (d <= today) {
    data.push({ x: new Date(d), y: addNoise(base, 3) });
    d.setDate(d.getDate() + 7);
    base += Math.random() * 2 - 0.5;
  }
  return data;
}

export function generate6MData() {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(today.getMonth() - 6);
  const data = [];
  let d = new Date(start);
  let base = 80;
  while (d <= today) {
    data.push({ x: new Date(d), y: addNoise(base, 4) });
    d.setDate(d.getDate() + 14);
    base += Math.random() * 2.5 - 1;
  }
  return data;
}

export function generateYTDData() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  const data = [];
  let d = new Date(start);
  let base = 78;
  while (d <= today) {
    data.push({ x: new Date(d), y: addNoise(base, 3) });
    d.setMonth(d.getMonth() + 1);
    base += Math.random() * 2 - 1;
  }
  return data;
}

export function generate1YData() {
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(today.getFullYear() - 1);
  const data = [];
  let d = new Date(start);
  let base = 85;
  while (d <= today) {
    data.push({ x: new Date(d), y: addNoise(base, 6) });
    d.setMonth(d.getMonth() + 1);
    base += Math.random() * 3 - 1.5;
  }
  return data;
}

export function generate5YData() {
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(today.getFullYear() - 5);
  const data = [];
  let d = new Date(start);
  let base = 110;
  while (d <= today) {
    data.push({ x: new Date(d), y: addNoise(base, 10) });
    d.setMonth(d.getMonth() + 3);
    base += Math.random() * 5 - 2.5;
  }
  return data;
}

export function generateMAXData() {
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(today.getFullYear() - 10);
  const data = [];
  let d = new Date(start);
  let base = 80;
  while (d <= today) {
    data.push({ x: new Date(d), y: addNoise(base, 15) });
    d.setFullYear(d.getFullYear() + 1);
    base += Math.random() * 10 - 5;
  }
  return data;
}

export function getDummyChartData(timeRange) {
  const today = new Date();
  let startDate = new Date();
  let interval = 1; // 일 단위 기본

  switch (timeRange) {
    case '1D':
      startDate = new Date(today);
      interval = 0; // 1시간 단위로 아래에서 별도 처리
      break;
    case '5D':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 4); // 오늘 포함 5일
      interval = 1; // 1일 단위
      break;
    case '1M':
      startDate.setMonth(today.getMonth() - 1);
      interval = 1; // 1일 단위
      break;
    case '3M':
      startDate.setMonth(today.getMonth() - 3);
      interval = 3; // 3일 단위
      break;
    case '6M':
      startDate.setMonth(today.getMonth() - 6);
      interval = 7; // 1주 단위
      break;
    case 'YTD':
      startDate = new Date(today.getFullYear(), 0, 1);
      interval = 7; // 1주 단위
      break;
    case '1Y':
      startDate.setFullYear(today.getFullYear() - 1);
      interval = 14; // 2주 단위
      break;
    case '5Y':
      startDate.setFullYear(today.getFullYear() - 5);
      interval = 30; // 1달 단위 (30일)
      break;
    case 'MAX':
    case 'ALL':
      startDate = new Date('1980-12-01'); // Nike IPO date
      interval = 365; // 1년 단위
      break;
    default:
      startDate.setMonth(today.getMonth() - 1);
      interval = 1;
  }

  const data = [];
  let currentDate = new Date(startDate);
  let basePrice = 100; // 시작 가격

  if (timeRange === '1D') {
    // 오늘 하루, 1시간 단위 (예: 7개)
    for (let h = 9; h <= 15; h++) { // 9시~15시
      const d = new Date(today);
      d.setHours(h, 0, 0, 0);
      const randomChange = seededRandom.randomRange(-2, 2);
      basePrice = Math.max(0, basePrice + randomChange);
      data.push({ x: new Date(d), y: basePrice });
    }
  } else {
    while (currentDate <= today) {
      const randomChange = seededRandom.randomRange(-2, 2);
      basePrice = Math.max(0, basePrice + randomChange);
      data.push({
        x: new Date(currentDate),
        y: basePrice
      });
      currentDate.setDate(currentDate.getDate() + interval);
    }
  }

  return data;
}

export function getDummyTrades(timeRange, chartData, numTrades = 10) {
  console.log('getDummyTrades called!');
  if (!chartData || chartData.length < 2) return [];
  const trades = [];
  // step을 조정하여 거래가 차트 전체에 고르게 분포하도록 함
  const step = Math.max(1, Math.floor(chartData.length / numTrades));

  for (let i = step; i < chartData.length && trades.length < numTrades; i += step) {
    const prev = chartData[i - step];
    const curr = chartData[i];
    let type;
    // 상승 구간이면 매수, 하락 구간이면 매도
    if (curr.y > prev.y) {
      type = 'buy';
    } else {
      type = 'sell';
    }
    trades.push({
      x: curr.x,
      y: curr.y,
      date: curr.x,
      type,
      price: curr.y,
      shares: 50,
      note: `${type === 'buy' ? 'Bought' : 'Sold'} 50 shares at $${curr.y.toFixed(2)}`
    });
  }
  return trades;
}

const staticDummyChartData = {
  '3M': [
    { x: new Date('2025-04-01'), y: 77.60 },
    { x: new Date('2025-04-15'), y: 76.10 },
    { x: new Date('2025-05-01'), y: 74.30 },
    { x: new Date('2025-05-15'), y: 73.00 },
    { x: new Date('2025-06-01'), y: 72.10 },
    { x: new Date('2025-06-15'), y: 74.80 },
    { x: new Date('2025-07-01'), y: 75.90 },
  ],
  '6M': [
    { x: new Date('2025-01-01'), y: 83.50 },
    { x: new Date('2025-02-01'), y: 81.20 },
    { x: new Date('2025-03-01'), y: 79.80 },
    { x: new Date('2025-04-01'), y: 77.60 },
    { x: new Date('2025-05-01'), y: 74.30 },
    { x: new Date('2025-06-01'), y: 72.10 },
  ],
  '1Y': [
    { x: new Date('2024-07-01'), y: 75.12 },
    { x: new Date('2024-08-01'), y: 77.45 },
    { x: new Date('2024-09-01'), y: 80.33 },
    { x: new Date('2024-10-01'), y: 78.90 },
    { x: new Date('2024-11-01'), y: 82.10 },
    { x: new Date('2024-12-01'), y: 85.00 },
    { x: new Date('2025-01-01'), y: 83.50 },
    { x: new Date('2025-02-01'), y: 81.20 },
    { x: new Date('2025-03-01'), y: 79.80 },
    { x: new Date('2025-04-01'), y: 77.60 },
    { x: new Date('2025-05-01'), y: 74.30 },
    { x: new Date('2025-06-01'), y: 72.10 },
  ],
  'ALL': [
    { x: new Date('2021-07-01'), y: 130.00 },
    { x: new Date('2021-10-01'), y: 145.00 },
    { x: new Date('2022-01-01'), y: 140.00 },
    { x: new Date('2022-04-01'), y: 135.00 },
    { x: new Date('2022-07-01'), y: 120.00 },
    { x: new Date('2022-10-01'), y: 100.00 },
    { x: new Date('2023-01-01'), y: 110.00 },
    { x: new Date('2023-04-01'), y: 115.00 },
    { x: new Date('2023-07-01'), y: 105.00 },
    { x: new Date('2023-10-01'), y: 95.00 },
    { x: new Date('2024-01-01'), y: 90.00 },
    { x: new Date('2024-04-01'), y: 85.00 },
    { x: new Date('2024-07-01'), y: 75.12 },
    { x: new Date('2024-10-01'), y: 78.90 },
    { x: new Date('2025-01-01'), y: 83.50 },
    { x: new Date('2025-04-01'), y: 77.60 },
    { x: new Date('2025-06-01'), y: 72.10 },
  ]
}; 