// import logo from "./logo.svg";
import "./App.css";
import SoccerChartJsx from "./component/SoccerChartJsx";
import TopInfoBar from "./component/TopInfoBar";

function App() {
  return (
    <div className="App">
      <TopInfoBar />
      <div className="mainChartContainer">
        <SoccerChartJsx />
      </div>
    </div>
  );
}

export default App;
