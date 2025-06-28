// src/dashboard.js
import React, { useState, useEffect, useRef } from 'react';
import './dashboard.css';
import ChartComponent from './ChartComponent';
import KpiCard from './KpiCard'; // 우리가 새로 만든 카드를 불러옵니다.
import { fetchStockData } from './api/stockApi';
import { getDummyChartData } from './dummyChartData';
import { getDummyTrades } from './ChartComponent';

// 첨부 이미지의 거래내역을 하드코딩 (type: buy, note 포함)
const customTrades = [
  {
    x: new Date(Date.UTC(2021, 8, 25, 0, 15)), // 2021-09-25 00:15 UTC
    y: 148.40,
    date: '2021/09/25 12:15 AM',
    type: 'buy',
    price: 148.40,
    shares: 2,
    note: '크 여기서 더 샀다면...!'
  },
  {
    x: new Date(Date.UTC(2022, 0, 15, 3, 21)), // 2022-01-15 03:21 UTC
    y: 147.00,
    date: '2022/01/15 3:21 AM',
    type: 'buy',
    price: 147.00,
    shares: 1,
    note: ''
  },
  {
    x: new Date(Date.UTC(2022, 1, 25, 0, 37)), // 2022-02-25 00:37 UTC
    y: 134.00,
    date: '2022/02/25 12:37 AM',
    type: 'buy',
    price: 134.00,
    shares: 2,
    note: ''
  },
  {
    x: new Date(Date.UTC(2022, 3, 7, 23, 16)), // 2022-04-07 23:16 UTC
    y: 127.66,
    date: '2022/04/07 11:16 PM',
    type: 'buy',
    price: 127.66,
    shares: 1,
    note: ''
  },
  {
    x: new Date(Date.UTC(2022, 3, 12, 0, 2)), // 2022-04-12 00:02 UTC
    y: 124.56,
    date: '2022/04/12 12:02 AM',
    type: 'buy',
    price: 124.56,
    shares: 1,
    note: ''
  },
  {
    x: new Date(Date.UTC(2022, 4, 6, 0, 14)), // 2022-05-06 00:14 UTC
    y: 119.72,
    date: '2022/05/06 12:14 AM',
    type: 'buy',
    price: 119.72,
    shares: 1,
    note: ''
  },
];

function Dashboard() {
  const [timeRange, setTimeRange] = useState('1Y');
  const [priceData, setPriceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // 직접입력용 날짜 상태
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // CSV 데이터 fetch 및 파싱
  useEffect(() => {
    async function loadCsvData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(process.env.PUBLIC_URL + '/nike_stock_data.csv');
        if (!response.ok) throw new Error('public/nike_stock_data.csv 파일이 없습니다.');
        const text = await response.text();
        const lines = text.split('\n').filter(Boolean);
        const header = lines[0].split(',');
        const dateIdx = 0;
        const priceIdx = 1; // Price 컬럼
        const dataLines = lines.slice(1);
        const parsed = dataLines.map(line => {
          const cols = line.split(',');
          return {
            x: new Date(cols[dateIdx]),
            y: parseFloat(cols[priceIdx])
          };
        }).filter(d => !isNaN(d.x) && !isNaN(d.y));
        setPriceData(parsed);
        setIsLoading(false);
      } catch (err) {
        setError('CSV 데이터 로드 실패: ' + err.message);
        setIsLoading(false);
      }
    }
    loadCsvData();
  }, []);

  // 구간별 데이터 슬라이싱
  const getFilteredData = () => {
    if (!priceData.length) return [];
    const now = priceData[priceData.length - 1]?.x;
    let startDate = null;
    let endDate = now;
    if (timeRange === '직접입력' && customStartDate && customEndDate) {
      // customStartDate, customEndDate는 'YYYY-MM-DD' 형식
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      // endDate를 하루 뒤로 보정 (포함되게)
      endDate.setDate(endDate.getDate() + 1);
    } else {
      switch (timeRange) {
        case '1M': startDate = new Date(now); startDate.setMonth(now.getMonth() - 1); break;
        case '3M': startDate = new Date(now); startDate.setMonth(now.getMonth() - 3); break;
        case '6M': startDate = new Date(now); startDate.setMonth(now.getMonth() - 6); break;
        case '1Y': startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); break;
        case '3Y': startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 3); break;
        case '5Y': startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 5); break;
        case 'MAX': default: startDate = priceData[0]?.x;
      }
    }
    return priceData.filter(d => d.x >= startDate && d.x <= endDate);
  };

  const filteredData = getFilteredData();
  const firstPrice = filteredData.length > 0 ? filteredData[0].y : null;
  const lastPrice = filteredData.length > 0 ? filteredData[filteredData.length - 1].y : null;
  const priceChange = (firstPrice && lastPrice) ? ((lastPrice - firstPrice) / firstPrice) * 100 : null;

  // 내 거래내역 기반 KPI 계산
  const buyCount = customTrades.filter(t => t.type === 'buy').length;
  const sellCount = customTrades.filter(t => t.type === 'sell').length;
  const totalShares = customTrades.reduce((sum, t) => t.type === 'buy' ? sum + t.shares : sum - t.shares, 0);
  const totalCost = customTrades.reduce((sum, t) => t.type === 'buy' ? sum + t.price * t.shares : sum, 0);
  const avgPrice = totalShares > 0 ? totalCost / (customTrades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.shares, 0)) : null;
  const profit = (lastPrice && avgPrice) ? (lastPrice - avgPrice) * totalShares : null;
  const myReturn = (lastPrice && avgPrice) ? ((lastPrice - avgPrice) / avgPrice) * 100 : null;

  // 타임옵션별 한글 라벨
  const timeOptionLabels = {
    '1D': '1일 전',
    '5D': '5일 전',
    '1M': '1개월 전',
    '3M': '3개월 전',
    '6M': '6개월 전',
    '1Y': '1년 전',
    '3Y': '3년 전',
    '5Y': '5년 전',
    'MAX': '', // 아래에서 동적 처리
  };

  // KPI 카드의 주가(타이틀) 값 분기
  const isCustom = timeRange === '직접입력';
  const mainLastPrice = isCustom
    ? (priceData.length > 0 ? priceData[priceData.length - 1].y : null)
    : (filteredData.length > 0 ? filteredData[filteredData.length - 1].y : null);

  // change 텍스트 구체화 (첫번째 KPI 카드만)
  let changeLabel = '';
  let changeColor = undefined;
  // 상승/하락/변동 없음 추세에 따라 changeColor 결정 (차트 라인과 동일)
  if (filteredData.length > 1 && firstPrice != null && lastPrice != null) {
    if (lastPrice < firstPrice) {
      changeColor = 'negative';
    } else if (lastPrice > firstPrice) {
      changeColor = 'positive';
    } else {
      changeColor = 'neutral';
    }
  }

  if (isCustom) {
    if (!customStartDate || !customEndDate) {
      changeLabel = '기간을 입력하세요.';
      changeColor = 'neutral';
    } else if (filteredData.length > 1 && firstPrice && lastPrice) {
      let label = '입력 기간 전';
      const change = lastPrice - firstPrice;
      const changePercent = firstPrice ? (change / firstPrice) * 100 : 0;
      const isPlus = change >= 0;
      changeLabel = `${label}보다 ${isPlus ? '+' : '-'}$${Math.abs(change).toFixed(2)}(${Math.abs(changePercent).toFixed(1)}%)`;
    }
  } else if (filteredData.length > 1 && firstPrice && lastPrice) {
    let label = '';
    if (timeRange === 'MAX') {
      const startYear = filteredData[0].x.getFullYear();
      const endYear = filteredData[filteredData.length - 1].x.getFullYear();
      const diffYear = endYear - startYear;
      label = `${diffYear}년 전`;
    } else {
      label = timeOptionLabels[timeRange] || '';
    }
    const change = lastPrice - firstPrice;
    const changePercent = firstPrice ? (change / firstPrice) * 100 : 0;
    const isPlus = change >= 0;
    changeLabel = `${label}보다 ${isPlus ? '+' : '-'}$${Math.abs(change).toFixed(2)}(${Math.abs(changePercent).toFixed(1)}%)`;
  }

  // 전체 데이터의 최신 가격 (기간 필터와 무관)
  const latestPrice = priceData.length > 0 ? priceData[priceData.length - 1].y : null;

  // 두번째 KPI 카드: 평가금액, 평가손익, 수익률 (항상 전체 데이터 기준)
  let evalValue = '...';
  let evalChange = '';
  let evalChangeColor = undefined;
  if (latestPrice !== null && totalShares !== null) {
    const evalAmount = latestPrice * totalShares;
    evalValue = `$${Math.abs(evalAmount).toFixed(2)}`;
    const profitAmount = (avgPrice !== null && totalShares !== null) ? (latestPrice - avgPrice) * totalShares : 0;
    const profitPercent = (avgPrice && avgPrice !== 0) ? ((latestPrice - avgPrice) / avgPrice) * 100 : 0;
    const isPlus = profitAmount >= 0;
    evalChange = `${isPlus ? '+' : '-'}$${Math.abs(profitAmount).toFixed(2)} (${Math.abs(profitPercent).toFixed(2)}%)`;
    evalChangeColor = isPlus ? 'positive' : 'negative';
  }

  return (
    <div className="dashboard-container">
      <div className="metrics-grid">
        <KpiCard
          title="NKE - Nike, Inc."
          value={mainLastPrice !== null ? `$${mainLastPrice.toFixed(2)}` : '...'}
          change={changeLabel}
          changeColor={changeColor}
          variant="primary"
        />
        <KpiCard
          title="내 평가금"
          value={evalValue}
          change={evalChange}
          changeColor={evalChangeColor}
          variant="secondary"
        />
        <KpiCard
          title="내 보유 현황"
          value={avgPrice && totalShares ? `$${avgPrice.toFixed(2)} × ${totalShares}주` : '...'}
          subtext={`매수 ${buyCount}회, 매도 ${sellCount}회`}
          variant="tertiary"
        />
      </div>
      <div className="chart-section-container">
        <main className="chart-card">
          <ChartComponent
            symbol="NKE"
            timeRange={timeRange}
            allTrades={customTrades}
            priceData={filteredData}
          />
        </main>
        <div className="chart-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="time-selector">
              {['1D','5D','1M','3M','6M','1Y','3Y','5Y','MAX','직접입력'].map(opt => (
                <button
                  key={opt}
                  className={`time-option ${timeRange === opt ? 'active' : ''}`}
                  onClick={() => setTimeRange(opt)}
                  style={opt === '직접입력' ? { minWidth: 80, fontWeight: 700 } : {}}
                >
                  {opt}
                </button>
              ))}
            </div>
            {timeRange === '직접입력' && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  style={{
                    border: '1px solid #E0E0E0',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontSize: 14,
                    fontFamily: 'Roboto Mono',
                    outline: 'none',
                    background: '#fff',
                    color: '#222',
                    width: 160
                  }}
                  placeholder="YYYY.MM.DD"
                />
                <span style={{ alignSelf: 'center', color: '#B0B0B0', fontWeight: 700 }}>~</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  style={{
                    border: '1px solid #E0E0E0',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontSize: 14,
                    fontFamily: 'Roboto Mono',
                    outline: 'none',
                    background: '#fff',
                    color: '#222',
                    width: 160
                  }}
                  placeholder="YYYY.MM.DD"
                />
              </div>
            )}
          </div>
          <div className="action-buttons">
            <button className="action-btn primary">CSV 업로드</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;