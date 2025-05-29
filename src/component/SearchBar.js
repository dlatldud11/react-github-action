import React from "react";
import "./SearchBar.css";

export default function SearchBar({
  markets,
  market,
  setMarket,
  minuteOptions,
  minute,
  setMinute,
}) {
  return (
    <>
      <div className="row">
        <select onChange={(e) => setMarket(e.target.value)}>
          {markets.map((i) => (
            <option key={i.market} value={i.market}>
              {i.korean_name}
            </option>
          ))}
        </select>
        <h3>{market} MACD 차트</h3>
        <select onChange={(e) => setMinute(e.target.value)} value={minute}>
          {minuteOptions.map((i) => (
            <option key={i.key} value={i.value}>
              {i.value} 분봉
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
