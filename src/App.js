import "./App.css";
import { useState } from "react";
import Chart from "./component/ChartBit";
import ChartBit from "./component/ChartBit";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <ChartBit />
    </div>
  );
}

export default App;
