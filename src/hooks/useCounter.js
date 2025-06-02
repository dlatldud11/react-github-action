import { useReducer } from "react";

function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return {
        ...state,
        count: state.count + state.step,
      };
    case "decrement":
      return {
        ...state,
        count: state.count - state.step,
      };
    case "reset":
      return {
        ...state,
        count: state.initialCount,
      };
    default:
      throw new Error(`알 수 없는 타입입니다. ${action.type}`);
  }
}

export default function useCounter(initialCount = 0, step = 1) {
  const [state, dispatch] = useReducer(reducer, {
    initialCount,
    count: initialCount,
    step,
  });
  return [state, dispatch];
}
