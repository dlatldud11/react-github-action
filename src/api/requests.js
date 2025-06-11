const BASE_URL = "https://api.bithumb.com/v1"; //useFetch 쓰면서 BASE_URL 을 여기서 합치는것으로 변경함

const requests = {
  fetchKrwBTC: BASE_URL + "/candles/minutes/1?market=KRW-BTC&count=100",
  fetchMarketAll: BASE_URL + "/market/all?isDetails=false",
  // 동적으로 쿼리를 구성하는 함수로 변경
  // fetchCandles: ({ market, minutes, count }) =>
  //   `/candles/minutes/${minutes}?market=${market}&count=${count}`,
  fetchCandles: ({ market, minutes, count, datetime }) => {
    // console.log("datetime", datetime);

    if (datetime) {
      return `${BASE_URL}/candles/minutes/${minutes}?market=${market}&to=${datetime}T23:59:59&count=${count}`;
    } else {
      return `${BASE_URL}/candles/minutes/${minutes}?market=${market}&count=${count}`;
    }
  },
};

export default requests;
