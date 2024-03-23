import { useEffect, useState } from "react";
import { init, dispose } from "soccerchart-lib";

export default () => {
  const [data, setData] = useState([]);
  const [jsonData, setJsonData] = useState([]);

  useEffect(() => {
    fetch("data/data.json")
      .then((response) => response.json())
      .then((jsonData) => setJsonData(jsonData))
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (jsonData?.chart?.data)
      setData(
        jsonData.chart.data.map((item) => ({
          timestamp: item[0],
          open: item[1],
          high: item[2],
          low: item[3],
          close: item[4],
          volume: item[5],
        }))
      );
  }, [jsonData]);

  useEffect(() => {
    const chart = init("chart");
    chart.applyNewData(data);

    return () => {
      dispose("chart");
    };
  }, [data]);

  return <div id="chart" style={{ width: 600, height: 600 }} />;
};
