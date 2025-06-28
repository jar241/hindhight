// App.js
import React from 'react';
import './App.css'; // 전역 스타일
import Header from './Header'; // 헤더 컴포넌트 추가
import Dashboard from './dashboard'; // 우리가 만든 대시보드를 불러옵니다.

function App() {
  // 이제 App.js는 헤더와 Dashboard를 보여줍니다.
  return (
    <div className="App">
      <Header />
      <Dashboard />
    </div>
  );
}

export default App;
