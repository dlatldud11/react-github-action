import { useEffect, useReducer, useState } from "react";

const INITIAL_STATE = {
  data: null,
  isLoading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    default:
      throw new Error();
  }
}

export default function UseFetch(initialUrl) {
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_INIT" });
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`Fail to fetch ${url}`);
        }
        const json = await res.json();

        // console.log("json", json);
        dispatch({ type: "FETCH_SUCCESS", payload: json });
      } catch (error) {
        dispatch({ type: "FETCH_FAILURE", payload: error });
      }
    };

    fetchData();
  }, [url]);

  return [state, setUrl];
}
