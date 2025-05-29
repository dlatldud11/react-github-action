const requests = {
  fetchKrwBTC: "/candles/minutes/1?market=KRW-BTC&count=100",
  fetchMarketAll: "/market/all?isDetails=false",
  // 동적으로 쿼리를 구성하는 함수로 변경
  fetchCandles: ({ market, minutes, count }) =>
    `/candles/minutes/${minutes}?market=${market}&count=${count}`,
};

export default requests;
