import "./SearchBar.css";

export default function SearchBar({
  markets,
  market,
  setMarket,
  minuteOptions,
  minute,
  setMinute,
  date,
  setDate,
}) {
  return (
    <>
      <div className="chart-header">
        <h3>{market} MACD 차트</h3>
      </div>
      <div className="chart-controls">
        <div className="control-group">
          <label htmlFor="market">코인</label>
          <select onChange={(e) => setMarket(e.target.value)} value={market}>
            {markets.length > 0 &&
              markets.map((i) => (
                <option key={i.market} value={i.market}>
                  {i.market} {i.korean_name}
                </option>
              ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="date">날짜</label>
          <input
            type="date"
            value={date || ""}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="control-group">
          <label htmlFor="minute">분봉</label>
          <select onChange={(e) => setMinute(e.target.value)} value={minute}>
            {minuteOptions.map((i) => (
              <option key={i.key} value={i.value}>
                {i.value} 분봉
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
