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
      <div className="row">
        <h3>{market} MACD 차트</h3>
      </div>
      <div className="row">
        <select onChange={(e) => setMarket(e.target.value)} value={market}>
          {markets.length > 0 &&
            markets.map((i) => (
              <option key={i.market} value={i.market}>
                {i.korean_name}
              </option>
            ))}
        </select>
        <input
          type="date"
          value={date || ""}
          onChange={(e) => setDate(e.target.value)}
        />
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
