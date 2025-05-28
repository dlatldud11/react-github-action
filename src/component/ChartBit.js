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
} from "chart.js";
import "./ChartBit.css";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

export default function ChartBit() {
  const [chartData, setChartData] = useState(null);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    fetchOHLCV();
  }, []);

  const fetchOHLCV = async () => {
    const response = await axios.get(requests.fetchKrwBTC);
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
          borderColor: "blue",
          yAxisID: "y",
        },
        {
          label: "MACD",
          data: macd,
          borderColor: "green",
          yAxisID: "y1",
        },
        {
          label: "Signal",
          data: signal,
          borderColor: "red",
          borderDash: [5, 5],
          yAxisID: "y1",
        },
        {
          label: "Buy",
          data: buySignals,
          pointStyle: "triangle",
          pointRadius: 6,
          backgroundColor: "green",
          borderColor: "black",
          showLine: false,
          yAxisID: "y",
        },
        {
          label: "Sell",
          data: sellSignals,
          pointStyle: "rectRot",
          pointRadius: 6,
          backgroundColor: "red",
          borderColor: "black",
          showLine: false,
          yAxisID: "y",
        },
      ],
    });
  };

  return (
    <div className="chart-container">
      <div className="chart-box">
        <h3>KRW-BTC MACD 차트</h3>
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
