import "./App.css";
// import ChartBit from "./component/ChartBit";
import ChartBitHook from "./component/ChartBitHook";
// import IdiotsLiveList from "./IdiotsLiveList";

function App() {
  return (
    <div data-testid="App" className="App">
      {/* <ChartBit /> */}
      <ChartBitHook />
      {/* <IdiotsLiveList /> */}
    </div>
  );
}

export default App;
