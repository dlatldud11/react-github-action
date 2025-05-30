import React, { useEffect, useState } from "react";
import requests from "../api/requests";
import axios from "../api/axios";
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

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  TimeScale
);

export default function ChartBit() {
  const [chartData, setChartData] = useState(null);
  const [trades, setTrades] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [market, setMarket] = useState("");
  const minuteOptions = [
    { key: 0, value: 1 },
    { key: 1, value: 5 },
    { key: 2, value: 10 },
    { key: 3, value: 60 },
    { key: 4, value: 240 },
  ];
  const [minute, setMinute] = useState(minuteOptions[1].value);

  useEffect(() => {
    fetchMarketAll();
  }, []);

  useEffect(() => {
    console.log("market changed:", market);
    console.log("minute changed:", minute);

    const fetchOHLCV = async () => {
      // const response = await axios.get(requests.fetchKrwBTC);
      console.log("market", market);
      const response = await axios.get(
        requests.fetchCandles({ market: market, minutes: minute, count: 200 })
      );
      const data = response.data.reverse(); // 최신 → 과거 순서로 정렬

      const timestamps = data.map((d) => d.candle_date_time_kst.slice(0, 16));
      const close = data.map((d) => d.trade_price);

      const {
        macd,
        signal,
        buySignals,
        sellSignals,
        trades: tradeList,
      } = calculateMACDAndTrades(close, timestamps);

      setTrades(tradeList);

      setChartData({
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
    };

    if (market === "") {
      return;
    }
    fetchOHLCV();
  }, [market, minute]);

  const fetchMarketAll = async () => {
    const response = await axios.get(requests.fetchMarketAll);

    setMarkets(response.data);
    setMarket(response.data[0].market); // 첫 번째 마켓으로 초기화
  };

  return (
    <div className="chart-container">
      <div className="chart-box">
        <SearchBar
          markets={markets}
          market={market}
          setMarket={setMarket}
          minuteOptions={minuteOptions}
          minute={minute}
          setMinute={setMinute}
        />
        {chartData ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top",
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
                },
                y1: {
                  type: "linear",
                  position: "right",
                  grid: { drawOnChartArea: false },
                },
              },
            }}
          />
        ) : (
          <p>Loading...</p>
        )}
      </div>

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
                  <td>{t.entryPrice.toFixed(0)}</td>
                  <td>{t.exitPrice.toFixed(0)}</td>
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
  signalPeriod = 9
) {
  const ema = (data, period) => {
    const k = 2 / (period + 1);
    let emaArray = [data[0]];
    for (let i = 1; i < data.length; i++) {
      emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
    }
    return emaArray;
  };

  const shortEMA = ema(closePrices, shortPeriod);
  const longEMA = ema(closePrices, longPeriod);
  const macd = shortEMA.map((val, i) => val - longEMA[i]);
  const signal = ema(macd.slice(longPeriod - 1), signalPeriod);
  const fullSignal = Array(longPeriod - 1)
    .fill(null)
    .concat(signal);

  const buySignals = Array(closePrices.length).fill(null);
  const sellSignals = Array(closePrices.length).fill(null);
  const trades = [];

  let inPosition = false;
  let entryPrice = null;
  let entryIndex = null;

  for (let i = 1; i < macd.length; i++) {
    if (fullSignal[i] == null) continue;

    const prevDiff = macd[i - 1] - fullSignal[i - 1];
    const currDiff = macd[i] - fullSignal[i];

    // 매수
    if (!inPosition && prevDiff < 0 && currDiff > 0) {
      buySignals[i] = closePrices[i];
      inPosition = true;
      entryPrice = closePrices[i];
      entryIndex = i;
    }

    // 매도
    if (inPosition && prevDiff > 0 && currDiff < 0) {
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

  return { macd, signal: fullSignal, buySignals, sellSignals, trades };
}
