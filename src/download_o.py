import yfinance as yf

# 데이터 다운로드 (auto_adjust=False로 실제 종가 유지)
data = yf.download('O', start='1994-10-18', end='2025-07-01', auto_adjust=False)

# 필요한 컬럼만 추출 (Close, High, Low, Open, Volume)
data = data[['Close', 'High', 'Low', 'Open', 'Volume']]

print("데이터 shape:", data.shape)
print(data.head())

# CSV로 저장
data.to_csv('o_stock_data.csv')
print("CSV 저장 완료!")
