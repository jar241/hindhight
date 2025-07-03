import React from 'react';
import './DropdownMenu.css';

// Example usage:
// <DropdownMenu stocks={[{logo, ticker, name}]} onAddStock={...} onSelect={...} />

const DropdownMenu = ({ stocks = [], onAddStock, onSelect }) => {
  return (
    <div className="dropdown-menu-root">
      <div className="dropdown-menu-list">
        {stocks.map((stock, idx) => {
          // 풀네임에서 괄호와 티커 제거
          const fullName = stock.name.replace(/\s*\([^)]*\)/, '').trim();
          return (
            <div
              className="dropdown-menu-item"
              key={stock.ticker}
              onClick={() => onSelect && onSelect(stock)}
            >
              <div className="dropdown-menu-logo">
                <img src={stock.logo} alt={stock.ticker} style={{ width: 40, height: 40, borderRadius: '50%' }} />
              </div>
              <div className="dropdown-menu-info">
                <div className="dropdown-menu-ticker">{stock.ticker}</div>
                <div className="dropdown-menu-name">{fullName}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="dropdown-menu-footer" onClick={onAddStock}>
        <span className="dropdown-menu-add">종목 추가</span>
        <span className="dropdown-menu-plus">+</span>
      </div>
    </div>
  );
};

export default DropdownMenu; 