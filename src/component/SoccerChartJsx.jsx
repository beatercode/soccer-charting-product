import React, { useEffect, useRef, useState } from "react";
import { SoccerChart } from "soccerchart";
import "soccerchart/dist/soccerchart.css";
import { CustomDatafeed } from "../data/CustomDatafeed";
const svgString = require("../soccertchart_svgstring.txt");

const SoccerChartJsx = () => {
  const containerRef = useRef(null);
  const [chart, setChart] = useState(null);
  const customDatafeed = new CustomDatafeed();

  // const [currData, setCurrData] = useState([]);
  // const [currPosition, setCurrPosition] = useState(0);

  useEffect(() => {
    const container = containerRef.current;

    const options = {
      container,
      locale: "en-US",
      watermark: "",
      symbol: {
        matchId: "9uzxz9w2owmody3ri5fuhx990",
        exchange: "L",
        market: "soccer",
        name: "Inter vs Salernitana",
        shortName: "INT vs SAL",
        ticker: "INT vs SAL",
        priceCurrency: "point",
        type: "Serie A",
        logo: "./soccerballicon.png",
      },
      drawingBarVisible: true,
      timezone: "Europe/London",
      period: { multiplier: 1, timespan: "minute", text: "1m", full: "minute" },
      // period: { multiplier: 15, timespan: "second", text: "15s", full: "fifteensecond" },
      mode: "go_end",
      other: {},
      periods: [
        { multiplier: 1, timespan: "second", text: "1s", full: "second" },
        { multiplier: 5, timespan: "second", text: "5s", full: "fivesecond" },
        { multiplier: 15, timespan: "second", text: "15s", full: "fifteensecond" },
        { multiplier: 1, timespan: "minute", text: "1m", full: "minute" },
        // { multiplier: 15, timespan: "minute", text: "15m", full: "15M" },
      ],
      // subIndicators: ["VOL", "MACD"],
      mainIndicators: [],
      subIndicators: ["VOL", "MACD"],
      datafeed: customDatafeed,
      // datafeed: new DefaultDatafeed(process.env.REACT_APP_VITE_POLYGON_IO_API_KEY),
    };
    const chart = setChart(new SoccerChart(options));

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <main>
      <div id="container" ref={containerRef} />
    </main>
  );
};

export default SoccerChartJsx;
