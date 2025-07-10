import React, { useEffect, useState } from "react";
import requests from "../api/requests";
// import axios from "../api/axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "./ChartBit.css";
import SearchBar from "./SearchBar";
import "chartjs-adapter-date-fns";
import annotationPlugin from "chartjs-plugin-annotation";
import UseFetch from "../hooks/UseFetch";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  TimeScale,
  annotationPlugin
);

function getMACDParams(timeframe) {
  // console.log("timeframe", timeframe, typeof timeframe);
  switch (timeframe) {
    case "1":
      return {
        shortPeriod: 5,
        longPeriod: 13,
        signalPeriod: 4,
        rsiPeriod: 14,
        rsiOverBougth: 55, // RSI 과매수
        rsiOverSold: 45, // RSI 과매도
      };
    case "5":
      return {
        shortPeriod: 2,
        longPeriod: 4,
        signalPeriod: 2,
        rsiPeriod: 14,
        rsiOverBougth: 50, // RSI 과매수
        rsiOverSold: 50, // RSI 과매도
      };
    // return {
    //   shortPeriod: 6,
    //   longPeriod: 15,
    //   signalPeriod: 5,
    //   rsiPeriod: 10,
    //   rsiOverBougth: 57, // RSI 과매수
    //   rsiOverSold: 43, // RSI 과매도
    // };
    case "10":
      return {
        shortPeriod: 8,
        longPeriod: 21,
        signalPeriod: 5,
        rsiPeriod: 14,
        rsiOverBougth: 60, // RSI 과매수
        rsiOverSold: 40, // RSI 과매도
      };
    case "30":
      return {
        shortPeriod: 10,
        longPeriod: 24,
        signalPeriod: 6,
        rsiPeriod: 14,
        rsiOverBougth: 62, // RSI 과매수
        rsiOverSold: 38, // RSI 과매도
      };
    case "60":
      return {
        shortPeriod: 12,
        longPeriod: 26,
        signalPeriod: 9,
        rsiPeriod: 14,
        rsiOverBougth: 65, // RSI 과매수
        rsiOverSold: 35, // RSI 과매도
      };
    case "240":
      return {
        shortPeriod: 16,
        longPeriod: 34,
        signalPeriod: 9,
        rsiPeriod: 14,
        rsiOverBougth: 70, // RSI 과매수
        rsiOverSold: 30, // RSI 과매도
      };
    default:
      return {
        shortPeriod: 12,
        longPeriod: 26,
        signalPeriod: 9,
        rsiPeriod: 14,
        rsiOverBougth: 70, // RSI 과매수
        rsiOverSold: 30, // RSI 과매도
      };
  }
}

//불필요한 소숫점 제거 함수 (소숫점이 없다면 정수로 반환)
function formatSmartNumber(value, digits = 8) {
  const num = Number(value);
  return num % 1 === 0
    ? num.toString()
    : num.toFixed(digits).replace(/\.?0+$/, "");
}

export default function ChartBitHook() {
  const [macdData, setMacdData] = useState(null);
  const [rsiAndStochasticData, setRsiAndStochasticData] = useState(null);
  const [trades, setTrades] = useState([]);
  const [{ isLoading, data: markets }] = UseFetch(requests.fetchMarketAll);
  const [{ isLoading: isCandleLoading, data: candles }, setCandelUrl] =
    UseFetch();
  const [market, setMarket] = useState("");
  const minuteOptions = [
    { key: 0, value: "1" },
    { key: 1, value: "5" },
    { key: 2, value: "10" },
    { key: 3, value: "30" },
    { key: 4, value: "60" },
    { key: 5, value: "240" },
  ];
  const [minute, setMinute] = useState(minuteOptions[1].value);
  const [date, setDate] = useState("");

  useEffect(() => {
    if (markets && markets.length > 0) {
      setMarket(markets[1].market); // 마켓 목록 불러왔을 때 첫 번째 마켓으로 초기화
    }
  }, [markets]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // console.log("market changed:", market);
    // console.log("minute changed:", minute);
    // console.log("date changed:", date);

    if (market === "") {
      return;
    }
    const url = requests.fetchCandles({
      market,
      minutes: minute,
      count: 200,
      datetime: date,
    });
    setCandelUrl(url); // 비동기 아님, 단순 setState
  }, [market, minute, date, setCandelUrl]);

  useEffect(() => {
    if (!isCandleLoading && candles) {
      // console.log("candles", candles.length);
      // console.log("isCandleLoading", isCandleLoading);
      // console.log("minute changed:", minute);

      const data = candles.reverse(); // 최신 → 과거 순서로 정렬

      const timestamps = data.map((d) => d.candle_date_time_kst.slice(0, 16));
      const close = data.map((d) => d.trade_price);
      const high = data.map((d) => d.high_price); //고가
      const low = data.map((d) => d.low_price); //저가

      const {
        shortPeriod,
        longPeriod,
        signalPeriod,
        rsiPeriod,
        rsiOverBougth,
        rsiOverSold,
      } = getMACDParams(minute); // '1', '5', '60' 등

      // console.log("rsiOverBougth rsiOverSold", rsiOverBougth, rsiOverSold);

      const {
        macd,
        signal,
        rsi,
        stochK,
        stochD,
        buySignals,
        sellSignals,
        trades: tradeList,
      } = calculateMACDAndTrades(
        close,
        timestamps,
        high,
        low,
        shortPeriod,
        longPeriod,
        signalPeriod,
        rsiPeriod,
        rsiOverBougth,
        rsiOverSold
      );

      setTrades(tradeList);

      setMacdData({
        labels: timestamps,
        datasets: [
          {
            label: "Close",
            data: close,
            borderColor: "#1EAFED", // 파란색
            yAxisID: "y",
            borderWidth: 1,
            pointRadius: 0.5,
          },
          {
            label: "MACD",
            data: macd,
            borderColor: "#17B978", // 초록색
            yAxisID: "y1",
            borderWidth: 1,
            pointRadius: 0.5,
          },
          {
            label: "Signal",
            data: signal,
            borderColor: "#ED2B2A", // 빨간색
            borderDash: [5, 5],
            yAxisID: "y1",
            borderWidth: 1,
            pointRadius: 1,
          },
          {
            label: "Buy",
            data: buySignals,
            pointStyle: "triangle",
            pointRadius: 5,
            backgroundColor: "#17B978",
            borderColor: "black", // 원래는 black
            showLine: false,
            yAxisID: "y",
          },
          {
            label: "Sell",
            data: sellSignals,
            pointStyle: "rectRot",
            pointRadius: 5,
            backgroundColor: "#ED2B2A",
            borderColor: "black", // 원래는 black
            showLine: false,
            yAxisID: "y",
          },
        ],
      });

      // 차트 데이터 구성
      setRsiAndStochasticData({
        labels: timestamps.slice(-stochK.length), // 가장 최근 값 기준
        datasets: [
          {
            label: "RSI",
            data: rsi.slice(-stochK.length), // 길이 맞춰 자르기
            borderColor: "purple",
            backgroundColor: "purple",
            borderWidth: 1,
            pointRadius: 1,
          },
          {
            label: "%K",
            data: stochK,
            borderColor: "green",
            backgroundColor: "green",
            borderWidth: 1,
            pointRadius: 1,
          },
          {
            label: "%D",
            data: stochD,
            borderColor: "orange",
            backgroundColor: "orange",
            borderWidth: 1,
            pointRadius: 1,
          },
        ],
      });
    } else {
      return;
    }
  }, [candles, isCandleLoading, minute]);

  const macdOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            label += formatSmartNumber(context.raw, 8); // 8자리 표시
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          tooltipFormat: "MMM dd HH:mm", // 툴팁 포맷
          displayFormats: {
            minute: "HH:mm",
            hour: "MMM dd HH:mm",
          },
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 20,
        },
      },
      y: {
        type: "linear",
        position: "left",
        ticks: {
          callback: function (value) {
            return formatSmartNumber(value, 8); // 최대 8자리까지 표시
          },
        },
      },
      y1: {
        type: "linear",
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: {
          callback: function (value) {
            return formatSmartNumber(value, 8); // 최대 8자리까지 표시
          },
        },
      },
    },
  };

  const rsiAndStochasticChartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: "지표값 (0~100)",
        },
        ticks: {
          stepSize: 20,
          callback: function (value) {
            return formatSmartNumber(value, 8); // 최대 8자리까지 표시
          },
        },
        grid: {
          color: "#eee",
        },
      },
      x: {
        type: "time",
        time: {
          tooltipFormat: "MMM dd HH:mm", // 툴팁 포맷
          displayFormats: {
            minute: "HH:mm",
            hour: "MMM dd HH:mm",
          },
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 20,
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
      annotation: {
        annotations: {
          overboughtZone: {
            type: "box",
            yMin: 70,
            yMax: 100,
            backgroundColor: "rgba(255, 99, 132, 0.1)", // 연한 붉은색
            borderWidth: 0,
          },
          midOverboughtZone: {
            type: "box",
            yMin: 80,
            yMax: 100,
            backgroundColor: "rgba(255, 99, 132, 0.15)", // 더 진한 붉은색
            borderWidth: 0,
          },
          oversoldZone: {
            type: "box",
            yMin: 0,
            yMax: 30,
            backgroundColor: "rgba(54, 162, 235, 0.1)", // 연한 파란색
            borderWidth: 0,
          },
        },
      },
    },
  };

  return (
    <div className="chart-container">
      {isLoading && <p>Loading...</p>}
      {!isLoading && markets && markets.length > 0 && (
        <div className="chart-box">
          <SearchBar
            markets={markets}
            market={market}
            setMarket={setMarket}
            minuteOptions={minuteOptions}
            minute={minute}
            setMinute={setMinute}
            date={date}
            setDate={setDate}
          />
          {macdData ? (
            <Line data={macdData} options={macdOptions} />
          ) : (
            <p>Loading...</p>
          )}
          {rsiAndStochasticData && (
            <div className="rsi-stochastic-chart-box">
              <h4>RSI + 스토캐스틱 Slow</h4>
              <Line
                data={rsiAndStochasticData}
                options={rsiAndStochasticChartOptions}
              />
            </div>
          )}
        </div>
      )}
      {trades.length > 0 && (
        <div className="trade-table">
          <h4>매매 내역</h4>
          <table>
            <thead>
              <tr>
                <th>매수 시간</th>
                <th>매도 시간</th>
                <th>매수가</th>
                <th>매도가</th>
                <th>수익률 (%)</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr key={i}>
                  <td>{t.entryTime}</td>
                  <td>{t.exitTime}</td>
                  <td>{formatSmartNumber(t.entryPrice, 8)}</td>
                  <td>{formatSmartNumber(t.exitPrice, 8)}</td>
                  <td>{t.gain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function calculateMACDAndTrades(
  closePrices,
  timestamps,
  highPrices, // 고가
  lowPrices, // 저가
  shortPeriod = 12,
  longPeriod = 26,
  signalPeriod = 9,
  rsiPeriod = 14,
  rsiOverBougth = 30,
  rsiOverSold = 70,
  stochPeriod = 14,
  stochSignal = 3
) {
  const ema = (data, period) => {
    const k = 2 / (period + 1);
    let emaArray = [data[0]];
    for (let i = 1; i < data.length; i++) {
      emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
    }
    return emaArray;
  };

  const calculateRSI = (data, period) => {
    const rsi = Array(data.length).fill(null);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = data[i] - data[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    rsi[period] = 100 - 100 / (1 + avgGain / avgLoss);

    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }

    return rsi;
  };

  const calculateStochastic = (closes, highs, lows, period, signalPeriod) => {
    const kValues = Array(closes.length).fill(null);
    const dValues = Array(closes.length).fill(null);

    for (let i = period - 1; i < closes.length; i++) {
      const highSlice = highs.slice(i - period + 1, i + 1);
      const lowSlice = lows.slice(i - period + 1, i + 1);

      const highestHigh = Math.max(...highSlice);
      const lowestLow = Math.min(...lowSlice);
      const currentClose = closes[i];

      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues[i] = k;
    }

    for (let i = period + signalPeriod - 2; i < closes.length; i++) {
      const slice = kValues
        .slice(i - signalPeriod + 1, i + 1)
        .filter((v) => v !== null);
      if (slice.length === signalPeriod) {
        const d = slice.reduce((a, b) => a + b, 0) / signalPeriod;
        dValues[i] = d;
      }
    }

    return { kValues, dValues };
  };

  const shortEMA = ema(closePrices, shortPeriod);
  const longEMA = ema(closePrices, longPeriod);
  const macd = shortEMA.map((val, i) => val - longEMA[i]);
  const signal = ema(macd.slice(longPeriod - 1), signalPeriod);
  const fullSignal = Array(longPeriod - 1)
    .fill(null)
    .concat(signal);

  const rsi = calculateRSI(closePrices, rsiPeriod);
  const { kValues: stochK, dValues: stochD } = calculateStochastic(
    closePrices,
    highPrices,
    lowPrices,
    stochPeriod,
    stochSignal
  );

  const buySignals = Array(closePrices.length).fill(null);
  const sellSignals = Array(closePrices.length).fill(null);
  const trades = [];

  let inPosition = false;
  let entryPrice = null;
  let entryIndex = null;

  let skip = false; //SKIP 플래그
  let skipCnt = 0; //SKIP 카운팅

  for (let i = 1; i < macd.length; i++) {
    if (fullSignal[i] == null || rsi[i] == null || stochK[i] == null) continue;

    const prevDiff = macd[i - 1] - fullSignal[i - 1];
    const currDiff = macd[i] - fullSignal[i];

    const k = stochK[i];

    // 🟢 매수 조건: 골든크로스 + RSI 과매도 + Stochastic < 20
    if (
      !inPosition &&
      prevDiff < 0 &&
      currDiff > 0 &&
      rsi[i] < rsiOverSold &&
      k < 20 &&
      !skip
    ) {
      buySignals[i] = closePrices[i];
      inPosition = true;
      entryPrice = closePrices[i];
      entryIndex = i;

      skip = false;
      skipCnt = 0;

      continue;
    }

    // 🔴 매도 조건: 데드크로스 + RSI 과매수 + Stochastic > 80
    else if (
      inPosition &&
      prevDiff > 0 &&
      currDiff < 0 &&
      rsi[i] > rsiOverBougth &&
      k > 70 &&
      !skip
    ) {

      const exitPrice = closePrices[i];
      
      if(exitPrice < entryPrice){
        console.log(`매도시그널 캔들가가 더 비싸므로 skip flag 키고 매도 skip entryPrice: ${entryPrice} exitPrice: ${exitPrice}`);
        skip = true;
        skipCnt++;
        continue;
      }
      else{
        sellSignals[i] = closePrices[i];

        const gain = ((exitPrice - entryPrice) / entryPrice) * 100;
        trades.push({
          entryTime: timestamps[entryIndex],
          exitTime: timestamps[i],
          entryPrice,
          exitPrice,
          gain: gain.toFixed(2),
        });
        inPosition = false;
        skip = false;
        skipCnt = 0;
      }

    }
    else if(inPosition &&
      skip
    ){

      const exitPrice = closePrices[i];
      
      if(exitPrice < entryPrice){
        if(skipCnt > 4){
          const profit = ((exitPrice - entryPrice) / entryPrice) * 100;
          
          if(profit <= -2.5){
            console.log(`손절기준 -2.5퍼센트보다 더 손실이므로 청산 ${profit}`);
            sellSignals[i] = closePrices[i];

            const gain = ((exitPrice - entryPrice) / entryPrice) * 100;
            trades.push({
              entryTime: timestamps[entryIndex],
              exitTime: timestamps[i],
              entryPrice,
              exitPrice,
              gain: gain.toFixed(2),
            });
            inPosition = false;
            skip = false;
            skipCnt = 0;
            
          }else{
            skipCnt++;
            console.log(`매도시그널 캔들가가 더 비싸므로 skipCnt++ 매도 skip skipCnt: ${skipCnt}`);
            
            continue;
          }
        }
        else{
          skipCnt++;
          console.log(`매도시그널 캔들가가 더 비싸므로 skipCnt++ 매도 skip skipCnt: ${skipCnt} `);
          
        }
      }else{
        sellSignals[i] = closePrices[i];
        
        const gain = ((exitPrice - entryPrice) / entryPrice) * 100;
        trades.push({
          entryTime: timestamps[entryIndex],
          exitTime: timestamps[i],
          entryPrice,
          exitPrice,
          gain: gain.toFixed(2),
        });
        inPosition = false;
        skip = false;
        skipCnt = 0;
    }
  }
}

  return {
    macd,
    signal: fullSignal,
    rsi,
    stochK,
    stochD,
    buySignals,
    sellSignals,
    trades,
  };
}
