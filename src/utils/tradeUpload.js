// 공통 거래내역 업로드 유틸
import * as XLSX from 'xlsx';

// 엑셀 시리얼 날짜를 YYYY-MM-DD 문자열로 변환
function excelDateToString(excelDate) {
  const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

// 거래를 비교 가능한 표준 포맷으로 변환
function normalizeTrade(trade) {
  return {
    ticker: (trade.ticker || '').toUpperCase(),
    type: (trade.type || '').toLowerCase(),
    date: (trade.date || '').slice(0, 10), // YYYY-MM-DD
    price: Number(trade.price),
    share: Number(trade.share),
  };
}

function tradeKey(trade) {
  const t = normalizeTrade(trade);
  return `${t.ticker}|${t.type}|${t.date}|${t.price}|${t.share}`;
}

// file: File 객체
// options: { tickerFilter: 'NKE', existing: [{date, price, share, type}], mode: 'replace'|'append' }
export async function parseTradeFile(file, { tickerFilter, existing = [], mode = 'append' } = {}) {
  const ext = file.name.split('.').pop().toLowerCase();
  let rows = [];
  if (ext === 'csv') {
    const text = await file.text();
    const lines = text.split('\n').filter(Boolean);
    const header = lines[0].split(',');
    const tickerIdx = header.findIndex(h => h.toLowerCase() === 'ticker');
    const dateIdx = header.findIndex(h => h.toLowerCase() === 'date');
    const priceIdx = header.findIndex(h => h.toLowerCase() === 'price');
    const shareIdx = header.findIndex(h => h.toLowerCase() === 'shares' || h.toLowerCase() === 'share');
    const typeIdx = header.findIndex(h => h.toLowerCase() === 'type');
    const journalIdx = header.findIndex(h => h.toLowerCase() === 'journal');
    if (tickerIdx === -1 || dateIdx === -1 || priceIdx === -1 || shareIdx === -1 || typeIdx === -1) {
      throw new Error('CSV 파일에 ticker, date, price, share, type 컬럼이 모두 필요합니다.');
    }
    rows = lines.slice(1).map(line => {
      const cols = line.split(',');
      let dateVal = cols[dateIdx]?.trim();
      if (!dateVal) return null;
      if (!isNaN(Number(dateVal))) dateVal = excelDateToString(Number(dateVal));
      return {
        ticker: cols[tickerIdx]?.trim().toUpperCase(),
        type: cols[typeIdx]?.trim().toLowerCase(),
        date: dateVal,
        price: Number(cols[priceIdx]),
        share: Number(cols[shareIdx]),
        journal: journalIdx !== -1 ? cols[journalIdx]?.trim() : '',
      };
    }).filter(Boolean);
  } else if (ext === 'xls' || ext === 'xlsx') {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
    const header = sheet[0].map(h => String(h).toLowerCase());
    const tickerIdx = header.indexOf('ticker');
    const dateIdx = header.indexOf('date');
    const priceIdx = header.indexOf('price');
    const shareIdx = header.findIndex(h => h === 'shares' || h === 'share');
    const typeIdx = header.indexOf('type');
    const journalIdx = header.indexOf('journal');
    if (tickerIdx === -1 || dateIdx === -1 || priceIdx === -1 || shareIdx === -1 || typeIdx === -1) {
      throw new Error('엑셀 파일에 ticker, date, price, share, type 컬럼이 모두 필요합니다.');
    }
    rows = sheet.slice(1).map(cols => {
      let dateVal = (cols[dateIdx] || '').toString().trim();
      if (!dateVal) return null;
      if (!isNaN(Number(dateVal))) dateVal = excelDateToString(Number(dateVal));
      return {
        ticker: (cols[tickerIdx] || '').toString().trim().toUpperCase(),
        type: (cols[typeIdx] || '').toString().trim().toLowerCase(),
        date: dateVal,
        price: Number(cols[priceIdx]),
        share: Number(cols[shareIdx]),
        journal: journalIdx !== -1 ? (cols[journalIdx] || '').toString().trim() : '',
      };
    }).filter(Boolean);
  } else {
    throw new Error('지원하지 않는 파일 형식입니다.');
  }
  // ticker 필터링
  if (tickerFilter) rows = rows.filter(row => row.ticker === tickerFilter.toUpperCase());
  // 중복 방지 (강화된 로직)
  if (mode === 'append' && existing.length > 0) {
    const existingSet = new Set(existing.map(tradeKey));
    rows = rows.filter(row => !existingSet.has(tradeKey(row)));
  }
  return rows;
} 