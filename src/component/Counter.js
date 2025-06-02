import useCounter from "../hooks/useCounter";

export default function Counter() {
  const [state, dispatch] = useCounter();
  const [state2, dispatch2] = useCounter(0, 2);
  return (
    <div>
      <div>{state.count}</div>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <div>{state2.count}</div>
      <button onClick={() => dispatch2({ type: "reset" })}>Reset</button>
      <button onClick={() => dispatch2({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch2({ type: "increment" })}>+</button>
    </div>
  );
}
