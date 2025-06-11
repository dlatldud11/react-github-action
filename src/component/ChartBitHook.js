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
  // console.log("timeframe", timeframe);
  switch (timeframe) {
    case 1:
      return { shortPeriod: 5, longPeriod: 13, signalPeriod: 4, rsiPeriod: 7 };
    case 5:
      return { shortPeriod: 8, longPeriod: 21, signalPeriod: 6, rsiPeriod: 10 };
    case 10:
      return {
        shortPeriod: 10,
        longPeriod: 24,
        signalPeriod: 8,
        rsiPeriod: 12,
      };
    case 30:
      return {
        shortPeriod: 20,
        longPeriod: 50,
        signalPeriod: 12,
        rsiPeriod: 20,
      };
    case 60:
      return {
        shortPeriod: 24,
        longPeriod: 55,
        signalPeriod: 14,
        rsiPeriod: 20,
      };
    case 240:
      return {
        shortPeriod: 36,
        longPeriod: 78,
        signalPeriod: 18,
        rsiPeriod: 28,
      };
    default:
      return { shortPeriod: 12, longPeriod: 26, signalPeriod: 9, rsiPeriod: 7 };
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
  const [rsiData, setRsiData] = useState(null);
  const [trades, setTrades] = useState([]);
  const [{ isLoading, data: markets }] = UseFetch(requests.fetchMarketAll);
  const [{ isLoading: isCandleLoading, data: candles }, setCandelUrl] =
    UseFetch();
  const [market, setMarket] = useState("");
  const minuteOptions = [
    { key: 0, value: 1 },
    { key: 1, value: 5 },
    { key: 2, value: 10 },
    { key: 3, value: 30 },
    { key: 4, value: 60 },
    { key: 5, value: 240 },
  ];
  const [minute, setMinute] = useState(minuteOptions[1].value);
  const [date, setDate] = useState("");

  useEffect(() => {
    if (markets && markets.length > 0) {
      setMarket(markets[0].market); // 마켓 목록 불러왔을 때 첫 번째 마켓으로 초기화
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

      const { shortPeriod, longPeriod, signalPeriod, rsiPeriod } =
        getMACDParams(minute); // '1', '5', '60' 등

      const {
        macd,
        signal,
        rsi,
        buySignals,
        sellSignals,
        trades: tradeList,
      } = calculateMACDAndTrades(
        close,
        timestamps,
        shortPeriod,
        longPeriod,
        signalPeriod,
        rsiPeriod
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
            pointRadius: 1,
          },
          {
            label: "MACD",
            data: macd,
            borderColor: "#17B978", // 초록색
            yAxisID: "y1",
            borderWidth: 1,
            pointRadius: 0,
          },
          {
            label: "Signal",
            data: signal,
            borderColor: "#ED2B2A", // 빨간색
            borderDash: [5, 5],
            yAxisID: "y1",
            borderWidth: 1,
            pointRadius: 0,
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

      setRsiData({
        labels: timestamps,
        datasets: [
          {
            label: "RSI",
            data: rsi,
            borderColor: "purple", // 보라색
            backgroundColor: "purple",
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

  const rsiChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      annotation: {
        annotations: {
          avarage: {
            type: "box",
            yMin: 30,
            yMax: 70,
            backgroundColor: "rgba(193, 99, 255, 0.2)",
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          tooltipFormat: "MMM dd HH:mm",
          displayFormats: {
            minute: "HH:mm",
            hour: "MMM dd HH:mm",
          },
        },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10,
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
          {rsiData && (
            <div className="rsi-chart-box">
              <h4>RSI지표</h4>
              <Line data={rsiData} options={rsiChartOptions} />
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
  shortPeriod = 12,
  longPeriod = 26,
  signalPeriod = 9,
  rsiPeriod = 14
) {
  // console.log("Calculating MACD and trades with params:", {
  //   shortPeriod,
  //   longPeriod,
  //   signalPeriod,
  //   rsiPeriod,
  // });

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

  const shortEMA = ema(closePrices, shortPeriod);
  const longEMA = ema(closePrices, longPeriod);
  const macd = shortEMA.map((val, i) => val - longEMA[i]);
  const signal = ema(macd.slice(longPeriod - 1), signalPeriod);
  const fullSignal = Array(longPeriod - 1)
    .fill(null)
    .concat(signal);

  const rsi = calculateRSI(closePrices, rsiPeriod);

  const buySignals = Array(closePrices.length).fill(null);
  const sellSignals = Array(closePrices.length).fill(null);
  const trades = [];

  let inPosition = false;
  let entryPrice = null;
  let entryIndex = null;

  for (let i = 1; i < macd.length; i++) {
    if (fullSignal[i] == null || rsi[i] == null) continue;

    const prevDiff = macd[i - 1] - fullSignal[i - 1];
    const currDiff = macd[i] - fullSignal[i];

    // console.log(`${inPosition} ${prevDiff} ${currDiff} ${rsi[i]}`);

    // MACD 골든크로스 + RSI 과매도 원래는 30
    if (!inPosition && prevDiff < 0 && currDiff > 0 && rsi[i] < 40) {
      // if (!inPosition && prevDiff < 0 && currDiff > 0) {
      buySignals[i] = closePrices[i];
      inPosition = true;
      entryPrice = closePrices[i];
      entryIndex = i;
    }

    // MACD 데드크로스 + RSI 과매수 원래는 70
    if (inPosition && prevDiff > 0 && currDiff < 0 && rsi[i] > 60) {
      // if (inPosition && prevDiff > 0 && currDiff < 0) {
      sellSignals[i] = closePrices[i];
      const exitPrice = closePrices[i];
      const gain = ((exitPrice - entryPrice) / entryPrice) * 100;
      trades.push({
        entryTime: timestamps[entryIndex],
        exitTime: timestamps[i],
        entryPrice,
        exitPrice,
        gain: gain.toFixed(2),
      });
      inPosition = false;
    }
  }

  /* const rsiValid = rsi.filter((v) => v != null);
  const minRSI = Math.min(...rsiValid);
  const maxRSI = Math.max(...rsiValid);
  console.log("RSI range:", minRSI.toFixed(2), "-", maxRSI.toFixed(2)); */

  return { macd, signal: fullSignal, rsi, buySignals, sellSignals, trades };
}
