// ChartComponent.js
import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { ko } from 'date-fns/locale';
import { fetchStockData } from './api/stockApi';
import './ChartComponent.css';
import { getDummyChartData } from './dummyChartData';
import annotationPlugin from 'chartjs-plugin-annotation';

// 전역(혹은 ref)으로 마지막 crosshair 상태 저장
let lastCrosshair = { caretX: null, price: null, date: null, show: false };

// afterDraw에서 세로선(크로스헤어) 직접 그림 (더 강조)
const customCrosshair = {
  id: 'customCrosshair',
  afterDraw: (chart) => {
    // labelDiv가 block이면(즉, crosshair label이 보이면) 세로선 그림
    let labelDiv = document.getElementById('chart-crosshair-label');
    if (labelDiv && labelDiv.style.display === 'block' && lastCrosshair.show && lastCrosshair.caretX !== null) {
      const ctx = chart.ctx;
      const x = lastCrosshair.caretX;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, chart.chartArea.top);
      ctx.lineTo(x, chart.chartArea.bottom);
      ctx.lineWidth = 1; 
      ctx.strokeStyle = '#D4D4D4';
      ctx.shadowBlur = 6;
      ctx.setLineDash([0]); // 실선
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.restore();
    }
  }
};

// 거래내역 포인트를 항상 라인 위에 오버레이로 그리는 플러그인
const overlayTradePointsPlugin = {
  id: 'overlayTradePoints',
  afterDraw: (chart) => {
    const ctx = chart.ctx;
    const tradesDatasetIndex = chart.data.datasets.findIndex(ds => ds.label === 'My Trades');
    if (tradesDatasetIndex === -1) return;
    const tradesDataset = chart.data.datasets[tradesDatasetIndex];
    const meta = chart.getDatasetMeta(tradesDatasetIndex);
    meta.data.forEach((point, i) => {
      const trade = tradesDataset.data[i];
      if (!point || !trade) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4.5, 0, 2 * Math.PI); // 반지름 6px
      ctx.fillStyle = '#000';
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.restore();
    });
  }
};

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  TimeScale,
  annotationPlugin,
  customCrosshair,
  overlayTradePointsPlugin
);

const getCssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function addFluctuation(data, amplitude = 2) {
  return data.map((point, i) => ({
    ...point,
    y: Math.round((point.y + (Math.random() - 0.5) * amplitude) * 100) / 100
  }));
}

// timeRange별 x축 포맷 매핑
const timeRangeFormat = {
  '1D': { unit: 'minute', stepSize: 5, format: 'yyyy.MM.dd.HH:mm' }, // 5분 단위
  '5D': { unit: 'minute', stepSize: 10, format: 'yyyy.MM.dd.HH:mm' }, // 10분 단위
  '1M': { unit: 'day', stepSize: 1, format: 'yyyy.MM.dd' },
  '3M': { unit: 'day', stepSize: 1, format: 'yyyy.MM.dd' },
  '6M': { unit: 'day', stepSize: 1, format: 'yyyy.MM.dd' },
  'YTD': { unit: 'month', stepSize: 1, format: 'yyyy.MM.dd' },
  '1Y': { unit: 'day', stepSize: 1, format: 'yyyy.MM.dd' },
  '3Y': { unit: 'month', stepSize: 1, format: 'yyyy.MM.dd' },
  '5Y': { unit: 'month', stepSize: 1, format: 'yyyy.MM.dd' },
  'MAX': { unit: 'month', stepSize: 1, format: 'yyyy.MM.dd' },
  'ALL': { unit: 'month', stepSize: 1, format: 'yyyy.MM.dd' },
};

// 커스텀 툴팁 핸들러: 세로선 위에 가격/날짜 표시 (가운데 정렬, z-index 최상위)
function customTooltipHandler(context) {
  const { chart, tooltip } = context;
  let labelDiv = document.getElementById('chart-crosshair-label');
  if (!labelDiv) {
    labelDiv = document.createElement('div');
    labelDiv.id = 'chart-crosshair-label';
    labelDiv.style.position = 'absolute';
    labelDiv.style.top = '0';
    labelDiv.style.zIndex = '9999';
    labelDiv.style.pointerEvents = 'none';
    labelDiv.style.fontWeight = 'bold';
    labelDiv.style.fontSize = '14px';
    labelDiv.style.background = 'rgba(255,255,255,0.95)';
    labelDiv.style.padding = '4px 12px';
    labelDiv.style.border = '1px solid #111111';
    labelDiv.style.borderRadius = '8px';
    labelDiv.style.transition = 'left 0.05s';
    labelDiv.style.textAlign = 'center';
    chart.canvas.parentNode.appendChild(labelDiv);
  }
  if (tooltip && tooltip.dataPoints && tooltip.dataPoints.length > 0) {
    const dp = tooltip.dataPoints[0];
    const isTradePoint = dp.dataset.label === 'My Trades' && dp.raw;
    if (isTradePoint) {
      // 거래내역 툴팁: crosshair와 동일한 폰트/색상, 세로선 항상 보이게, 배경/글자색 반전
      const trade = dp.raw;
      const typeText = trade.type === 'buy' ? '매수' : '매도';
      let date = dp.label || '';
      if (dp.parsed.x) {
        const d = new Date(dp.parsed.x);
        const pad = n => n.toString().padStart(2, '0');
        if (date.length > 10) {
          date = `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}.${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } else {
          date = `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`;
        }
      }
      labelDiv.innerHTML = `
        <div style='font-size:16px;font-weight:700;color:#fff;font-family:Roboto Mono, monospace;'>${typeText} $${trade.price} x ${trade.shares}주</div>
        <div style='font-size:12px;font-weight:500;color:#fff;font-family:Roboto Mono, monospace;'>${date}</div>
        <div style='font-size:12px;color:#fff;margin-top:2px;font-family:Roboto Mono, monospace;'>${trade.note || ''}</div>
      `;
      labelDiv.style.display = 'block';
      labelDiv.style.left = `${tooltip.caretX}px`;
      labelDiv.style.transform = 'translate(-50%, 0)';
      labelDiv.style.background = '#222';
      labelDiv.style.color = '#fff';
      lastCrosshair = { caretX: tooltip.caretX, price: `${typeText} $${trade.price} x ${trade.shares}주`, date, show: true };
    } else {
      // crosshair 툴팁만 노출
      const price = typeof dp.parsed.y === 'number' ? `$${dp.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
      let date = dp.label || '';
      if (dp.parsed.x) {
        const d = new Date(dp.parsed.x);
        const pad = n => n.toString().padStart(2, '0');
        if (date.length > 10) {
          date = `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}.${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } else {
          date = `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`;
        }
      }
      labelDiv.innerHTML = `
        <div style='font-size:16px;font-weight:700;color:#00000;font-family:Roboto Mono, monospace;'>${price}</div>
        <div style='font-size:12px;font-weight:500;color:#66666;font-family:Roboto Mono, monospace;'>${date}</div>
      `;
      labelDiv.style.display = 'block';
      labelDiv.style.left = `${tooltip.caretX}px`;
      labelDiv.style.transform = 'translate(-50%, 0)';
      labelDiv.style.background = 'rgba(255,255,255,0.95)';
      labelDiv.style.color = '#222';
      lastCrosshair = { caretX: tooltip.caretX, price, date, show: true };
    }
  } else {
    // 마우스가 차트 밖으로 나가도 crosshair label은 남김 (숨기지 않음)
    if (lastCrosshair.show) {
      let labelDiv = document.getElementById('chart-crosshair-label');
      if (labelDiv) {
        labelDiv.innerHTML = `
          <div style='font-size:16px;font-weight:700;color:#00000;font-family:Roboto Mono, monospace;'>$${lastCrosshair.price}</div>
          <div style='font-size:12px;font-weight:500;color:#64748b;font-family:Roboto Mono, monospace;'>${lastCrosshair.date}</div>
        `;
        labelDiv.style.display = 'block';
        labelDiv.style.left = `${lastCrosshair.caretX}px`;
        labelDiv.style.transform = 'translate(-50%, 0)';
      }
    } else {
      // 거래점 툴팁은 마우스 아웃시 숨김
      if (labelDiv) labelDiv.style.display = 'none';
    }
  }
}

function ChartComponent({ symbol = 'NKE', timeRange, useDummy = false, dummyData, allTrades, priceData }) {
  const [chartData, setChartData] = useState({ datasets: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 거래내역은 그대로 사용
  const trades = allTrades || [];

  // 상승/하락 추세에 따라 라인 컬러 결정
  let lineColor = '#F44336'; // 기본: 상승(붉은색)
  if (priceData && priceData.length > 1) {
    const first = priceData[0].y;
    const last = priceData[priceData.length - 1].y;
    if (last < first) {
      lineColor = '#0090FF'; // 하락: 파란색
    }
  }

  useEffect(() => {
    // priceData prop이 있으면 그걸 그대로 사용
    if (priceData && priceData.length > 0) {
      setChartData({
        datasets: [
          {
            label: 'Nike Stock Price',
            data: priceData,
            borderColor: lineColor,
            borderWidth: 1.2,
            tension: 0,
            pointRadius: 0,
            fill: false,
            order: 1,
          },
          {
            label: 'My Trades',
            type: 'scatter',
            data: trades,
            pointBackgroundColor: trades.map(trade => trade.type === 'buy' ? '#000000' : '#A8C5DA'),
            pointBorderColor: '#fff',
            pointBorderWidth: 1, // 추가: 테두리 두께
            pointRadius: 4.5,
            pointStyle: 'circle',
            showLine: false,
            order: 99,
          }
        ]
      });
      setIsLoading(false);
      return;
    }
    async function loadCsvData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(process.env.PUBLIC_URL + '/nike_stock_data.csv');
        if (!response.ok) throw new Error('public/nike_stock_data.csv 파일이 없습니다. (src/nike_stock_data.csv를 public/으로 복사하세요)');
        const text = await response.text();
        const lines = text.split('\n').filter(Boolean);
        // 헤더 파싱 (Price,Close,High,Low,Open,Volume)
        const header = lines[0].split(',');
        const dateIdx = 0;
        const priceIdx = 1; // Price 컬럼
        const dataLines = lines.slice(1);
        // 최신순이 아니라 오래된 순이므로, 최신 데이터가 뒤에 있음
        const parsed = dataLines.map(line => {
          const cols = line.split(',');
          return {
            x: new Date(cols[dateIdx]),
            y: parseFloat(cols[priceIdx])
          };
        }).filter(d => !isNaN(d.x) && !isNaN(d.y));
        // 최신 데이터가 마지막에 있으므로, 최신 날짜 기준으로 슬라이싱
        const now = parsed[parsed.length - 1]?.x;
        let startDate = null;
        switch (timeRange) {
          case '1M':
            startDate = new Date(now); startDate.setMonth(now.getMonth() - 1); break;
          case '3M':
            startDate = new Date(now); startDate.setMonth(now.getMonth() - 3); break;
          case '6M':
            startDate = new Date(now); startDate.setMonth(now.getMonth() - 6); break;
          case '1Y':
            startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); break;
          case '5Y':
            startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 5); break;
          case 'MAX':
          default:
            startDate = parsed[0]?.x;
        }
        const filtered = parsed.filter(d => d.x >= startDate && d.x <= now);
        setChartData({
          datasets: [
            {
              label: 'Nike Stock Price',
              data: filtered,
              borderColor: lineColor,
              borderWidth: 1.2,
              tension: 0,
              pointRadius: 0,
              fill: false,
              order: 1,
            },
            {
              label: 'My Trades',
              type: 'scatter',
              data: trades,
              pointBackgroundColor: trades.map(trade => trade.type === 'buy' ? '#000000' : '#A8C5DA'),
              pointBorderColor: '#fff',
              pointRadius: 4,
              pointStyle: 'circle',
              showLine: false,
              order: 99,
            }
          ]
        });
        setIsLoading(false);
      } catch (err) {
        setError('CSV 데이터 로드 실패: ' + err.message);
        setIsLoading(false);
      }
    }
    loadCsvData();
  }, [allTrades, timeRange, priceData]);

  // priceData(즉, filteredData) 유효성 체크 및 경고
  useEffect(() => {
    if (!priceData || priceData.length === 0) {
      console.warn('ChartComponent: priceData(즉, filteredData)가 비어 있습니다. 라인 차트가 그려지지 않습니다.');
    } else {
      const yVals = priceData.map(d => d.y);
      const minY = Math.min(...yVals);
      const maxY = Math.max(...yVals);
      if (!isFinite(minY) || !isFinite(maxY)) {
        console.warn('ChartComponent: priceData의 y값이 비정상입니다.', yVals);
      }
    }
  }, [priceData]);

  if (isLoading) {
    return <div className="chart-loading">Loading...</div>;
  }

  if (error) {
    return <div className="chart-error">Error: {error}</div>;
  }

  if (!priceData || priceData.length === 0) {
    return <div className="chart-error">차트 데이터가 없습니다. (기간/데이터를 확인하세요)</div>;
  }

  // Find first/last x for min/max
  const mainData = chartData.datasets[0]?.data || [];
  const xMin = mainData.length > 0 ? mainData[0].x : undefined;
  const xMax = mainData.length > 0 ? mainData[mainData.length - 1].x : undefined;

  // 최고가/최저가 계산
  const yValues = mainData.map(d => d.y);
  const high = yValues.length ? Math.max(...yValues) : null;
  const low = yValues.length ? Math.min(...yValues) : null;

  // 평단가 계산 (실제 거래 데이터만 사용)
  let totalShares = 0, totalCost = 0;
  trades.forEach(t => {
    if (t.type === 'buy') {
      totalShares += t.shares;
      totalCost += t.price * t.shares;
    }
  });
  const avgPrice = totalShares ? totalCost / totalShares : null;

  const { unit, format, stepSize } = timeRangeFormat[timeRange] || { unit: 'day', format: 'yyyy.MM.dd', stepSize: 1 };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'nearest', // 거래내역 점에 가까울 때만 해당 툴팁이 뜨고, 그 외에는 crosshair 툴팁
      intersect: false,
      axis: 'x',
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: customTooltipHandler
      },
      customCrosshair,
      annotation: avgPrice ? {
        annotations: {
          avgLine: {
            type: 'line',
            yMin: avgPrice,
            yMax: avgPrice,
            borderColor: '#00000',
            borderWidth: 1,
            borderDash: [4, 4],
            label: {
              display: true,
              content: avgPrice ? [`$${avgPrice.toFixed(2)}`] : '',
              position: 'start',
              backgroundColor: '#fff',
              color: '#222',
              borderColor: 'rgb(0, 0, 0)',
              borderWidth: 1,
              font: { family: 'Roboto Mono', weight: 'bold', size: 12 },
              padding: { left: 8, right: 8, top: 4, bottom: 4 },
              cornerRadius: 6,
            },
          }
        }
      } : undefined,
    },
    scales: {
      y: { 
        grid: { color: getCssVar('--color-chart-grid') }, 
        ticks: { 
          color: getCssVar('--color-text-muted'),
          font: {
            size: 10,
            family: "Roboto Mono"
          },
          padding: 8,
          callback: function(value) {
            return `$${value}`;
          }
        },
        border: {
          display: false,
        },
      },
      x: { 
        type: 'time',
        min: xMin,
        max: xMax,
        time: {
          unit,
          stepSize,
          displayFormats: { [unit]: format },
          tooltipFormat: format,
        },
        grid: { display: false }, 
        ticks: { 
          color: getCssVar('--color-text-muted'),
          font: {
            size: 10,
            family: "Roboto Mono"
          },
          padding: 8,
          maxRotation: 0, 
          minRotation: 0, 
          autoSkip: true, 
          maxTicksLimit: 7,
          callback: function(value, index, values) {
            // 숫자만 나오게 date-fns format 사용
            const date = this.getLabelForValue ? this.getLabelForValue(value) : value;
            if (!date) return '';
            try {
              // date-fns format을 직접 적용
              const d = new Date(date);
              const pad = n => n.toString().padStart(2, '0');
              if (format === 'yyyy.MM.dd.HH:mm') {
                return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}.${pad(d.getHours())}:${pad(d.getMinutes())}`;
              } else if (format === 'yyyy.MM.dd') {
                return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`;
              }
              return '';
            } catch {
              return '';
            }
          }
        } 
      }
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="chart-highlow" style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 14, color: 'var(--color-text-muted)' }}>
        {high !== null && <span>최고가: ${high.toFixed(2)}</span>}
        {low !== null && <span>최저가: ${low.toFixed(2)}</span>}
      </div>
      <Line options={options} data={chartData} />
      {/* 상단에 가격/날짜가 표시될 div는 JS에서 동적으로 생성됨 */}
    </div>
  );
}

export default ChartComponent;