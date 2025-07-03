// src/dashboard.js
import React, { useState, useEffect, useRef } from 'react';
import './dashboard.css';
import ChartComponent from './ChartComponent';
import KpiCard from './KpiCard'; // 우리가 새로 만든 카드를 불러옵니다.
import { fetchStockData } from './api/stockApi';
import { getDummyChartData } from './dummyChartData';
import { getDummyTrades } from './ChartComponent';
import Header from './Header';
import Tooltip from './components/Tooltip';
import nikeLogo from './assets/img/nike_logo.png';
import oLogo from './assets/img/o_logo.png';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import supabase from './supabaseClient';
import DropdownMenu from './components/DropdownMenu';
import * as XLSX from 'xlsx';
import { parseTradeFile } from './utils/tradeUpload';
import Modal from './components/Modal';
import CustomAddStockModal from './components/CustomAddStockModal';
import CustomPricingModal from './components/CustomPricingModal';

function Dashboard() {
  const { ticker } = useParams();
  const { user } = useAuth();
  const stockMeta = {
    nke: { name: 'Nike, Inc. (NKE)', logo: nikeLogo },
    o: { name: 'Realty Income (O)', logo: oLogo }
  };
  const meta = stockMeta[ticker] || stockMeta['nke'];

  // 거래내역 더미 데이터는 -처리 (주석)
  // const nikeTrades = [...];
  // const oTrades = [...];
  // const customTrades = ticker === 'o' ? oTrades : nikeTrades;
  // 실제 거래 데이터가 없으면 빈 배열로 초기화 (업로드 시 업데이트)
  const [customTrades, setCustomTrades] = useState([]);

  const [timeRange, setTimeRange] = useState('MAX');
  const [priceData, setPriceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // 직접입력용 날짜 상태
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [userTickers, setUserTickers] = useState([]);
  const stocks = userTickers
    .map(ticker => {
      const key = ticker.toLowerCase();
      return stockMeta[key] ? { logo: stockMeta[key].logo, ticker: ticker.toUpperCase(), name: stockMeta[key].name } : { logo: '', ticker: ticker.toUpperCase(), name: ticker.toUpperCase() };
    })
    .filter(stock => stock.ticker !== (meta.ticker || ticker?.toUpperCase()));
  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);
  const navigate = useNavigate();
  // Handle stock select
  const handleStockSelect = (stock) => {
    setDropdownOpen(false);
    navigate(`/dashboard/${stock.ticker.toLowerCase()}`);
  };

  // Supabase에서 거래내역 불러오기
  useEffect(() => {
    async function loadTrades() {
      if (!user) return;
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('ticker', ticker?.toUpperCase())
        .order('date', { ascending: true });
      if (!error && data) {
        // 변환: x, y, shares 필드 추가, share 필드 제거
        const mapped = data.map(t => {
          const shares = t.share ?? t.shares ?? 0;
          const { share, ...rest } = t; // share 필드 제거
          return {
            ...rest,
            x: t.date ? new Date(t.date) : undefined,
            y: typeof t.price === 'number' ? t.price : Number(t.price),
            shares,
          };
        });
        setCustomTrades(mapped);
      }
    }
    loadTrades();
  }, [user, ticker]);

  // CSV 데이터 fetch 및 파싱
  useEffect(() => {
    async function loadCsvData() {
      setIsLoading(true);
      setError(null);
      try {
        let csvFile = '';
        if (ticker === 'o') csvFile = '/o_stock_data.csv';
        else if (ticker === 'nke') csvFile = '/nike_stock_data.csv';
        else csvFile = `/nike_stock_data.csv`;
        const response = await fetch(process.env.PUBLIC_URL + csvFile);
        if (!response.ok) throw new Error(csvFile + ' 파일이 없습니다.');
        const text = await response.text();
        const lines = text.split('\n').filter(Boolean);
        const header = lines[0].split(',');
        const dateIdx = header.indexOf('Date');
        let priceIdx = header.indexOf('Price');
        if (priceIdx === -1) priceIdx = header.indexOf('Close');
        if (dateIdx === -1 || priceIdx === -1) {
          console.error('CSV 헤더에 Date 또는 Price/Close 컬럼이 없습니다.');
          setPriceData([]);
          setIsLoading(false);
          return;
        }
        const dataLines = lines.slice(1);
        const parsed = dataLines.map(line => {
          const cols = line.split(',');
          const dateStr = cols[dateIdx] ? cols[dateIdx].trim() : '';
          // UTC 기준으로 파싱
          const date = dateStr ? new Date(dateStr + 'T00:00:00Z') : null;
          const price = parseFloat(cols[priceIdx]);
          return {
            x: date,
            y: price
          };
        }).filter(d => d.x instanceof Date && !isNaN(d.x.getTime()) && !isNaN(d.y));
        setPriceData(parsed);
        setIsLoading(false);
      } catch (err) {
        setError('CSV 데이터 로드 실패: ' + err.message);
        setIsLoading(false);
      }
    }
    loadCsvData();
  }, [ticker]);

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
    let startYear = null, endYear = null;
    if (
      filteredData.length > 0 &&
      filteredData[0].x instanceof Date &&
      !isNaN(filteredData[0].x)
    ) {
      startYear = filteredData[0].x.getFullYear();
    }
    if (
      filteredData.length > 0 &&
      filteredData[filteredData.length - 1].x instanceof Date &&
      !isNaN(filteredData[filteredData.length - 1].x)
    ) {
      endYear = filteredData[filteredData.length - 1].x.getFullYear();
    }
    if (timeRange === 'MAX' && startYear !== null && endYear !== null) {
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

  // 두번째 KPI 카드: 평단가 · 보유수
  // 마지막 매수 거래 찾기
  const lastBuyIdx = [...customTrades].reverse().findIndex(t => t.type === 'buy');
  const lastBuyAbsIdx = lastBuyIdx !== -1 ? customTrades.length - 1 - lastBuyIdx : -1;
  let prevAvgPrice = null;
  if (lastBuyAbsIdx > 0) {
    // 마지막 매수 직전까지의 평단가 계산
    const prevTrades = customTrades.slice(0, lastBuyAbsIdx);
    const prevBuyShares = prevTrades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.shares, 0);
    const prevBuyCost = prevTrades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.price * t.shares, 0);
    prevAvgPrice = prevBuyShares > 0 ? prevBuyCost / prevBuyShares : null;
  }
  const avgPriceChange = (avgPrice !== null && prevAvgPrice !== null) ? avgPrice - prevAvgPrice : 0;
  const isNoChange = Math.abs(avgPriceChange) < 0.01;
  const avgChangeLabel = isNoChange
    ? '평단가 변화 없음'
    : (
      <span style={{display:'flex',alignItems:'center',gap:6}}>
        {`지난 매수 후 평단가 $${Math.abs(avgPriceChange).toFixed(2)}`}
        {avgPriceChange > 0 ? (
          <span style={{display:'inline-flex',verticalAlign:'middle'}} dangerouslySetInnerHTML={{__html: `<svg width=\"14\" height=\"14\" viewBox=\"0 0 18 18\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M9.00004 5C8.81788 4.99998 8.6388 5.04673 8.48008 5.13575C8.32136 5.22477 8.18835 5.35305 8.0939 5.5082L5.14495 10.4116C5.05128 10.5712 5.00131 10.7524 5.00003 10.9372C4.99874 11.1221 5.0462 11.304 5.13765 11.4648C5.22909 11.6256 5.36133 11.7597 5.52112 11.8536C5.68091 11.9475 5.86266 11.998 6.04818 12H11.9479C12.1333 11.9987 12.315 11.949 12.4751 11.8558C12.6351 11.7626 12.7678 11.6293 12.8599 11.469C12.952 11.3088 13.0003 11.1273 13 10.9426C12.9997 10.758 12.9507 10.5766 12.858 10.4167L9.9069 5.51001C9.81253 5.35449 9.67949 5.22584 9.52063 5.1365C9.36177 5.04716 9.18246 5.00015 9.00004 5Z\" fill=\"black\"/></svg>`}} />
        ) : (
          <span style={{display:'inline-flex',verticalAlign:'middle'}} dangerouslySetInnerHTML={{__html: `<svg width=\"14\" height=\"14\" viewBox=\"0 0 18 18\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M11.9515 5.98422H6.05289C5.86756 5.98553 5.68582 6.03543 5.52582 6.12895C5.36581 6.22246 5.23313 6.35631 5.14104 6.51714C5.04894 6.67797 5.00065 6.86014 5.00098 7.04547C5.00131 7.2308 5.05025 7.4128 5.14292 7.5733L8.09349 12.499C8.18788 12.6549 8.32083 12.7838 8.47953 12.8733C8.63822 12.9628 8.81729 13.0099 8.99949 13.0101C9.18169 13.0103 9.36086 12.9635 9.51973 12.8743C9.6786 12.7851 9.81181 12.6565 9.90651 12.5009L12.8549 7.57875C12.9487 7.41857 12.9987 7.23656 13 7.05095C13.0013 6.86534 12.9538 6.68265 12.8623 6.52117C12.7708 6.35969 12.6384 6.2251 12.4785 6.13086C12.3186 6.03662 12.1371 5.98606 11.9515 5.98422Z\" fill=\"black\"/></svg>`}} />
        )}
      </span>
    );

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

  // 마지막 거래 시점 계산
  const lastTrade = customTrades.length > 0 ? customTrades[customTrades.length - 1] : null;
  let noTradePeriod = '';
  if (lastTrade && lastTrade.x instanceof Date && !isNaN(lastTrade.x)) {
    const now = new Date();
    const last = lastTrade.x;
    const diffYear = now.getFullYear() - last.getFullYear();
    const diffMonth = now.getMonth() - last.getMonth() + diffYear * 12;
    if (diffYear >= 1) {
      noTradePeriod = `${diffYear}년간 거래 없음`;
    } else if (diffMonth >= 1) {
      noTradePeriod = `${diffMonth}개월간 거래 없음`;
    } else {
      noTradePeriod = '최근 1개월 이내 거래';
    }
  } else {
    noTradePeriod = '1년간 거래 없음';
  }

  // 파일 input ref 생성
  const fileInputRef = useRef();
  const handleAddTradeClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  // Modal 상태 추가
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingRows, setPendingRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const newRows = await parseTradeFile(file, {
        tickerFilter: ticker?.toUpperCase(),
        mode: 'replace',
      });
      if (newRows.length === 0) {
        alert('업로드할 거래가 없습니다.');
        return;
      }
      setPendingFile(file);
      setPendingRows(newRows);
      setUpdateModalOpen(true);
    } catch (err) {
      alert('업로드 실패: ' + (err.message || err.error_description || ''));
    }
  };

  // Modal에서 "진행하기" 클릭 시 실제 업로드
  const handleConfirmUpdate = async () => {
    setUploading(true);
    setUpdateModalOpen(false);
    try {
      await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id)
        .eq('ticker', ticker?.toUpperCase());
      const { error } = await supabase.from('trades').insert(
        pendingRows.map(row => ({
          user_id: user.id,
          ticker: row.ticker,
          date: row.date,
          price: row.price,
          share: row.share,
          type: row.type,
          ...(row.journal ? { journal: row.journal } : {})
        }))
      );
      if (error) {
        alert('업로드 실패: ' + error.message);
      } else {
        window.location.reload();
      }
    } catch (err) {
      alert('업로드 실패: ' + (err.message || err.error_description || ''));
    } finally {
      setUploading(false);
      setPendingFile(null);
      setPendingRows([]);
    }
  };

  // chart-top-bar용 전체 기간 기준 데이터 계산
  const chartFirst = filteredData.length > 0 ? filteredData[0] : null;
  const chartLast = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;
  let diffYear = 0;
  let diffMonth = 0;
  if (chartFirst?.x instanceof Date && chartLast?.x instanceof Date) {
    diffYear = chartLast.x.getFullYear() - chartFirst.x.getFullYear();
    diffMonth = (chartLast.x.getMonth() - chartFirst.x.getMonth()) + diffYear * 12;
  }
  const rawChangeAmount = (chartFirst && chartLast) ? (chartLast.y - chartFirst.y) : 0;
  const rawChangePercent = (chartFirst && chartLast && chartFirst.y !== 0) ? ((chartLast.y - chartFirst.y) / chartFirst.y) * 100 : 0;
  // 등락 컬러/부호/포맷 분기 로직 삭제 (KpiCard.js로 이전)
  // const isUp = rawChangeAmount > 0;
  // const isDown = rawChangeAmount < 0;
  // const sign = isUp ? '+' : isDown ? '-' : '';
  // const changeAmount = Math.abs(rawChangeAmount).toFixed(2);
  // const changePercent = Math.abs(rawChangePercent).toFixed(1);
  // const chartColor = isUp ? '#F44336' : isDown ? '#0090FF' : '#222';
  // 기간 단위 분기
  let periodLabel = '';
  if (diffYear > 0) {
    periodLabel = `${diffYear}년 전`;
  } else if (diffMonth > 0) {
    periodLabel = `${diffMonth}개월 전`;
  } else {
    periodLabel = '오늘';
  }

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const timeOptions = ['1D','1M','3M','6M','1Y','5Y','MAX','직접입력'];
  const optionRefs = useRef([]);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = timeOptions.indexOf(timeRange);
    const btn = optionRefs.current[idx];
    if (btn) {
      setSliderStyle({
        left: btn.offsetLeft,
        width: btn.offsetWidth
      });
    }
  }, [timeRange]);

  // 중복 거래 정리 함수 (강력한 정규화 적용)
  function normalizeTradeForDedup(trade) {
    return {
      ticker: (trade.ticker || '').toUpperCase(),
      type: (trade.type || '').toLowerCase(),
      date: (trade.date || '').slice(0, 10),
      price: Number(trade.price),
      share: Number(trade.share),
    };
  }
  function tradeKeyForDedup(trade) {
    const t = normalizeTradeForDedup(trade);
    return `${t.ticker}|${t.type}|${t.date}|${t.price}|${t.share}`;
  }

  async function handleDeduplicateTrades() {
    if (!user) return;
    // 1. 현재 종목의 모든 거래 불러오기
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', ticker?.toUpperCase());
    if (error) {
      alert('거래 불러오기 실패: ' + error.message);
      return;
    }
    // 2. 중복 거래 판별(정규화된 키 기준)
    const seen = new Set();
    const toDelete = [];
    for (const t of trades) {
      const key = tradeKeyForDedup(t);
      if (seen.has(key)) {
        toDelete.push(t.id);
      } else {
        seen.add(key);
      }
    }
    if (toDelete.length === 0) {
      alert('중복 거래가 없습니다!');
      return;
    }
    // 3. 중복 거래 삭제
    const { error: delError } = await supabase
      .from('trades')
      .delete()
      .in('id', toDelete);
    if (delError) {
      alert('중복 거래 삭제 실패: ' + delError.message);
    } else {
      alert(`중복 거래 ${toDelete.length}건이 삭제되었습니다!`);
      window.location.reload();
    }
  }

  const [stockCount, setStockCount] = useState(0);
  const [addStockModalOpen, setAddStockModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [exceedModalOpen, setExceedModalOpen] = useState(false);

  useEffect(() => {
    async function fetchStockCount() {
      if (!user) return;
      const { data, error } = await supabase
        .from('trades')
        .select('ticker', { count: 'exact', head: false })
        .eq('user_id', user.id);
      if (!error && data) {
        const uniqueTickers = Array.from(new Set(data.map(t => t.ticker)));
        setStockCount(uniqueTickers.length);
      }
    }
    fetchStockCount();
  }, [user]);

  const handleAddStock = () => {
    if (stockCount < 2) {
      setAddStockModalOpen(true);
    } else {
      setPricingModalOpen(true);
    }
  };

  // 템플릿 다운로드 함수 (랜딩페이지와 동일)
  function handleDownloadTemplate() {
    const data = [
      ["Ticker", "Type", "Date", "Price", "Share", "Journal"],
      ["NKE", "Buy", "2025-06-10", 63.50, 5, "떨어진거 같아서 일단 질러봄"],
      ["O", "Sell", "2025-06-21", 61.80, 2, "월세 받는것 같지만 요즘 뒤숭숭"],
      ["PLTR", "Buy", "2025-06-21", 142.80, 2, "더 오를거 같아서 추매"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trades");
    XLSX.writeFile(wb, "trade_template.xlsx");
  }

  // 업로드 로직 (랜딩페이지와 동일)
  async function handleAddStockUpload(file) {
    if (!user) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      let trades = XLSX.utils.sheet_to_json(sheet);
      trades = trades.map(t => {
        let dateVal = t.Date || t.date;
        if (typeof dateVal === 'number') {
          // 엑셀 시리얼 날짜 변환
          const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
          dateVal = date.toISOString().split('T')[0];
        }
        let dateUTC = dateVal ? new Date(dateVal + 'T00:00:00Z') : null;
        return {
          ticker: t.Ticker || t.ticker,
          type: (t.Type || t.type || '').toLowerCase(),
          date: dateUTC ? dateUTC.toISOString().slice(0, 10) : '',
          price: Number(t.Price || t.price),
          share: Number(t.Share || t.share),
          journal: t.Journal || t.journal || '',
        };
      });
      // 무료 플랜 종목 2개 제한 체크
      const tickersInFile = [...new Set(trades.map(t => t.ticker))];
      // 기존 종목 fetch
      const { data: existing, error: fetchError } = await supabase
        .from('trades')
        .select('ticker')
        .eq('user_id', user.id);
      const existingTickers = existing ? Array.from(new Set(existing.map(t => t.ticker))) : [];
      const totalTickers = Array.from(new Set([...existingTickers, ...tickersInFile])).length;
      if (totalTickers > 2) {
        setAddStockModalOpen(false);
        setExceedModalOpen(true);
        return;
      }
      // ticker별로 그룹핑 후 delete/insert
      const tickers = [...new Set(trades.map(t => t.ticker))];
      for (const ticker of tickers) {
        await supabase
          .from('trades')
          .delete()
          .eq('user_id', user.id)
          .eq('ticker', ticker);
        const tickerTrades = trades.filter(t => t.ticker === ticker);
        if (tickerTrades.length > 0) {
          const { error } = await supabase
            .from('trades')
            .insert(tickerTrades.map(t => ({ ...t, user_id: user.id })));
          if (error) throw error;
        }
      }
      setAddStockModalOpen(false);
      window.location.reload();
    } catch (e) {
      alert('업로드 실패: ' + (e.message || e.error_description || ''));
    }
  }

  useEffect(() => {
    async function fetchUserTickers() {
      if (!user) return;
      const { data, error } = await supabase
        .from('trades')
        .select('ticker')
        .eq('user_id', user.id);
      if (!error && data) {
        const uniqueTickers = Array.from(new Set(data.map(t => t.ticker)));
        setUserTickers(uniqueTickers);
      }
    }
    fetchUserTickers();
  }, [user]);

  return (
    <>
      <Header />
    <div className="dashboard-container">
      <div className="metrics-grid">
        <KpiCard
            title="내 평가금"
            value={latestPrice !== null && totalShares !== null ? `$${(latestPrice * totalShares).toFixed(2)}` : '...'}
            change={evalChange}
            changeColor={evalChangeColor}
            variant="primary"
        />
        <KpiCard
            title="내 평단가 · 보유수"
            value={avgPrice && totalShares ? (
              <span style={{display:'flex',alignItems:'center',gap:8}}>
                {`$${avgPrice.toFixed(2)}`}
                <span style={{fontWeight:600,margin:'0 2px',fontSize:20}}>&times;</span>
                {`${totalShares}주`}
              </span>
            ) : '...'}
            change={avgChangeLabel}
            changeColor="neutral"
            variant="secondary"
        />
        <KpiCard
            title="거래내역"
            value={
              <div className="kpi-main-value kpi-trade-value">
                <div className="kpi-trade-group">
                  <span className="kpi-trade-buy">{`매수 ${buyCount}`}</span>
                  <span className="kpi-dot"></span>
                  <span className="kpi-trade-sell">{`매도 ${sellCount}`}</span>
                </div>
                <Tooltip content="이 종목의 거래 내역을 업로드하세요">
                  <button
                    className="kpi-add-btn"
                    aria-label="거래내역 추가"
                    onClick={handleAddTradeClick}
                    type="button"
                  >
                    <span className="kpi-add-btn-icon" dangerouslySetInnerHTML={{__html: `<svg width=\"24\" height=\"25\" viewBox=\"0 0 24 25\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><g clip-path=\"url(#clip0_296_31321)\"><path d=\"M12 0.5L12.3888 0.5012L12.7704 0.506L13.5096 0.5264L13.8684 0.542L14.5632 0.5828L15.2268 0.638C20.9688 1.1948 23.3052 3.5312 23.862 9.2732L23.9172 9.9368L23.958 10.6316C23.964 10.7492 23.97 10.8692 23.9736 10.9904L23.994 11.7296L24 12.5L23.994 13.2704L23.9736 14.0096L23.958 14.3684L23.9172 15.0632L23.862 15.7268C23.3052 21.4688 20.9688 23.8052 15.2268 24.362L14.5632 24.4172L13.8684 24.458C13.7508 24.464 13.6308 24.47 13.5096 24.4736L12.7704 24.494L12 24.5L11.2296 24.494L10.4904 24.4736L10.1316 24.458L9.4368 24.4172L8.7732 24.362C3.0312 23.8052 0.6948 21.4688 0.138 15.7268L0.0828 15.0632L0.0420001 14.3684C0.0361623 14.2488 0.0309622 14.1292 0.0264001 14.0096L0.00600014 13.2704C0.00240014 13.0184 0 12.7616 0 12.5L0.00119991 12.1112L0.00600014 11.7296L0.0264001 10.9904L0.0420001 10.6316L0.0828 9.9368L0.138 9.2732C0.6948 3.5312 3.0312 1.1948 8.7732 0.638L9.4368 0.5828L10.1316 0.542C10.2492 0.536 10.3692 0.53 10.4904 0.5264L11.2296 0.506C11.4816 0.5024 11.7384 0.5 12 0.5ZM12 7.7C11.6817 7.7 11.3765 7.82643 11.1515 8.05147C10.9264 8.27652 10.8 8.58174 10.8 8.9V11.3H8.4L8.2596 11.3084C7.95589 11.3445 7.67743 11.4953 7.48112 11.7298C7.28481 11.9643 7.18547 12.265 7.20339 12.5703C7.22132 12.8757 7.35515 13.1626 7.57756 13.3726C7.79996 13.5825 8.09414 13.6997 8.4 13.7H10.8V16.1L10.8084 16.2404C10.8445 16.5441 10.9953 16.8226 11.2298 17.0189C11.4643 17.2152 11.765 17.3145 12.0703 17.2966C12.3757 17.2787 12.6626 17.1448 12.8726 16.9224C13.0825 16.7 13.1997 16.4059 13.2 16.1V13.7H15.6L15.7404 13.6916C16.0441 13.6555 16.3226 13.5047 16.5189 13.2702C16.7152 13.0357 16.8145 12.735 16.7966 12.4297C16.7787 12.1243 16.6448 11.8374 16.4224 11.6274C16.2 11.4175 15.9059 11.3003 15.6 11.3H13.2V8.9L13.1916 8.7596C13.1572 8.4677 13.0169 8.19857 12.7972 8.00326C12.5776 7.80795 12.2939 7.70004 12 7.7Z" fill=\"black\"/></g><defs><clipPath id=\"clip0_296_31321\"><rect width=\"24\" height=\"24\" fill=\"white\" transform=\"translate(0 0.5)\"/></clipPath></defs></svg>`}} />
                  </button>
                </Tooltip>
              </div>
            }
            change={<span className="kpi-trade-period">{noTradePeriod}</span>}
            changeColor="neutral"
            variant="tertiary"
        />
      </div>
        <div className="chart-top-bar">
          <div className="chart-top-bar-left">
            <img src={meta.logo} alt={meta.name} className="chart-stock-logo" />
            <div className="chart-stock-info-block">
              <div className="chart-stock-header-row" style={{position:'relative'}} ref={dropdownRef}>
                <span className="chart-stock-name" style={{cursor:'pointer'}} onClick={() => setDropdownOpen(v => !v)}>{meta.name}</span>
                <button className="chart-stock-dropdown" aria-label="종목 선택" onClick={() => setDropdownOpen(v => !v)}>
                  {dropdownOpen ? (
                    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 10l4-4 4 4" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                  )}
                </button>
                {dropdownOpen && (
                  <div style={{position:'absolute',top:'110%',left:0,zIndex:20000}}>
                    <DropdownMenu stocks={stocks} onSelect={handleStockSelect} onAddStock={handleAddStock} />
                  </div>
                )}
              </div>
              <span className="chart-stock-price">${mainLastPrice ? mainLastPrice.toFixed(2) : '--'}</span>
              <div className="chart-stock-change-row">
                <span className="chart-stock-change-label">
                  {timeRange === '직접입력'
                    ? (!customStartDate || !customEndDate
                        ? '기간을 입력하세요.'
                        : '입력 기간보다')
                    : periodLabel + '보다'}
                </span>
                <span className="chart-stock-change-value">
                  {(() => {
                    if (timeRange === '직접입력') {
                      if (!customStartDate || !customEndDate) return '';
                      if (!chartFirst || !chartLast) return '--';
                      const change = chartLast.y - chartFirst.y;
                      const percent = chartFirst.y !== 0 ? (change / chartFirst.y) * 100 : 0;
                      const sign = change > 0 ? '+' : change < 0 ? '-' : '';
                      const color = change > 0 ? '#F44336' : change < 0 ? '#0090FF' : '#222';
                      return <span style={{color}}>{`${sign}$${Math.abs(change).toFixed(2)} (${Math.abs(percent).toFixed(1)}%)`}</span>;
                    } else {
                      if (!chartFirst || !chartLast) return '--';
                      const change = chartLast.y - chartFirst.y;
                      const percent = chartFirst.y !== 0 ? (change / chartFirst.y) * 100 : 0;
                      const sign = change > 0 ? '+' : change < 0 ? '-' : '';
                      const color = change > 0 ? '#F44336' : change < 0 ? '#0090FF' : '#222';
                      return <span style={{color}}>{`${sign}$${Math.abs(change).toFixed(2)} (${Math.abs(percent).toFixed(1)}%)`}</span>;
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
          <div className="chart-top-bar-right">
          <div className="time-selector" style={{ position: 'relative' }}>
            <div
              className="time-slider-bg"
              style={{
                position: 'absolute',
                left: sliderStyle.left,
                width: sliderStyle.width,
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'left 0.35s cubic-bezier(.4,0,.2,1), width 0.35s cubic-bezier(.4,0,.2,1)',
                zIndex: 0
              }}
            />
            {timeOptions.map((opt, i) => (
              <button
                key={opt}
                ref={el => optionRefs.current[i] = el}
                className={`time-option ${timeRange === opt ? 'active' : ''}`}
                onClick={() => setTimeRange(opt)}
                style={opt === '직접입력' ? { minWidth: 80, fontWeight: 700 } : {}}
              >
                {opt}
              </button>
            ))}
          </div>
            {timeRange === '직접입력' && (
              <div style={{ display: 'flex', gap: 8 }}>
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
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style={{display:'none'}}
        onChange={handleFileChange}
        tabIndex={-1}
      />
      {/* 거래내역 업데이트 모달 */}
      <Modal
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title="거래내역을 업데이트할게요"
        desc={"업데이트 과정에서 기존 데이터가 모두 사라집니다.<br>새 파일에 기존 거래내역이 포함되었는지 확인해주세요."}
        actions={[
          { label: '취소', onClick: () => setUpdateModalOpen(false) },
          { label: '진행하기', onClick: handleConfirmUpdate, variant: 'primary', autoFocus: true }
        ]}
      />
      <CustomAddStockModal
        open={addStockModalOpen}
        onClose={() => setAddStockModalOpen(false)}
        onDownloadTemplate={handleDownloadTemplate}
        onUpload={() => {
          // 파일 업로드 input 트리거
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.xlsx,.xls';
          input.onchange = e => {
            const file = e.target.files[0];
            if (file) handleAddStockUpload(file);
          };
          input.click();
        }}
      />
      <CustomPricingModal
        open={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        onInquiry={() => { window.open('mailto:support@hindsight.com'); setPricingModalOpen(false); }}
        onSubscribe={() => { setPricingModalOpen(false); }}
        onCancel={() => { setPricingModalOpen(false); }}
      />
      <Modal
        open={exceedModalOpen}
        onClose={() => setExceedModalOpen(false)}
        title="종목 수를 다시 확인해주세요."
        desc="무료 플랜에서는 2개 종목까지만 가능해요. 어떤 종목을 먼저 관리해볼까요?"
        actions={[
          { label: '확인', onClick: () => { setExceedModalOpen(false); setAddStockModalOpen(true); }, variant: 'primary', autoFocus: true }
        ]}
      />
    </>
  );
}

export default Dashboard;