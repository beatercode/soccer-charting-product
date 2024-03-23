const apiDataPath = "http://localhost:3000/api/data";

const basePath = "data/output/";
const defaultMatchId = "71pif9hi2vwzp6q0xzilyxst0";
const defaultMatchExt = ".json";
const soccerBallIconPng = "./soccerballicon.png";

export class CustomDatafeed {
  data = [];

  constructor() {
    this.data = [];
  }

  async fetchData(matchId = null) {
    try {
      const response = await fetch(apiDataPath.concat("/", matchId || defaultMatchId));
      const jsonData = (await response.json())[0];

      // Process the fetched JSON data
      const kLineData = [];
      for (const timeframe in jsonData.timeframe) {
        kLineData.push({
          matchId: jsonData.matchId,
          description: jsonData.description,
          period: { full: timeframe },
          data: jsonData.timeframe[timeframe].map((item) => ({
            timestamp: item[0], // Assuming timestamp is at index 0
            time: item[0], // Assuming timestamp is at index 0
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
            volume: item[5],
            turnover: "",
          })),
        });
      }

      return Promise.resolve(kLineData);
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  }

  async searchSymbols(search) {
    // Implement search logic if needed, assuming a simple example

    const response = await fetch(apiDataPath);
    const jsonData = await response.json();

    const jsonRead = [];

    for (const match of jsonData) {
      const { matchId, description, homeTeamName, awayTeamName } = match;
      const shortName = homeTeamName.substring(0, 3).toUpperCase().concat(" ", awayTeamName.substring(0, 3).toUpperCase(), " ");

      jsonRead.push({
        matchId: matchId,
        exchange: "L",
        market: "soccer",
        name: description,
        shortName: shortName,
        ticker: shortName,
        priceCurrency: "point",
        type: "ADRC",
        logo: soccerBallIconPng,
      });
    }

    return Promise.resolve(jsonRead);
  }

  async getHistoryKLineData(symbol, period, from, to, mode, other) {
    this.data = await this.fetchData(symbol.matchId);
    let findMatchData = this.data.find((item) => item.matchId === symbol.matchId && item.period.full === period.full);

    if (findMatchData && from && to) {
      const logDebug = () => {
        // -----------------
        // epoch ts
        console.log("from ", from);
        console.log("to ", to);
        console.log("first in data ", findMatchData.data[0].timestamp);
        console.log("last in data ", findMatchData.data[findMatchData.data.length - 1].timestamp);
        // -----------------
        // human readable ts
        console.log("from ", new Date(from));
        console.log("to ", new Date(to));
        console.log("first in data ", new Date(findMatchData.data[0].timestamp));
        console.log("last in data ", new Date(findMatchData.data[findMatchData.data.length - 1].timestamp));
        // -----------------
        // filter
        console.log(findMatchData.data);
      };
      if (false) logDebug();
      findMatchData.data = findMatchData.data.filter((item) => item.timestamp >= from && item.timestamp <= to);
    }

    switch (mode) {
      case "go_start":
        findMatchData.data = findMatchData.data.slice(0, 1);
        break;
      case "back":
      case "forward":
        findMatchData.data = findMatchData.data.slice(0, other.currPosition);
        break;
    }

    return Promise.resolve(findMatchData ? findMatchData.data : []);
  }

  subscribe(symbol, period, callback) {}

  unsubscribe(symbol, period) {
    // Call the cleanup function returned by subscribe
  }
}
