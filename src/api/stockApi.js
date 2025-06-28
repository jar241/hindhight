const API_KEY1 = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
const API_KEY2 = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY2;
const BASE_URL = 'https://www.alphavantage.co/query';

export const fetchStockData = async (symbol, outputsize = 'compact') => {
  let lastError;
  for (const key of [API_KEY1, API_KEY2]) {
    try {
      const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${key}`;
      console.log('API 요청 URL:', url);
      const response = await fetch(url);
      console.log('API 응답 상태:', response.status, response.statusText);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('API 응답 데이터:', JSON.stringify(data, null, 2));
      // API 에러 응답 체크
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      if (data['Note']) {
        throw new Error(data['Note']);
      }
      if (data['Information']) {
        throw new Error(data['Information']);
      }
      if (!data['Time Series (Daily)']) {
        throw new Error('데이터 형식이 잘못되었습니다: Time Series (Daily) 없음');
      }
      return data;
    } catch (error) {
      lastError = error;
      // 다음 키로 시도
    }
  }
  throw lastError;
};

// 실시간 주식 가격 조회 (프리미엄 API)
export const fetchRealtimePrice = async (symbol) => {
  let lastError;
  for (const key of [API_KEY1, API_KEY2]) {
    try {
      const response = await fetch(
        `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      return data['Global Quote'];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

// 회사 개요 정보 조회
export const fetchCompanyOverview = async (symbol) => {
  let lastError;
  for (const key of [API_KEY1, API_KEY2]) {
    try {
      const response = await fetch(
        `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${key}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      return data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}; 