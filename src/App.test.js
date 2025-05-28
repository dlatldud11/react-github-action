import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

test("the app has ChartBit", () => {
  render(<App />);
  const counterElement = screen.getByTestId("App");
  expect(counterElement).tobeInTheDocument();
});

/* test("the counter starts at 0", () => {
render(<App />);
const counterElement = screen.getByTestId("counter");
  expect(counterElement).toHaveTextContent(0);
});
 */
