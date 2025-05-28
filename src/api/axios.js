import axios from "axios";

const instance = axios.create({
  baseURL: "https://api.bithumb.com/v1",
  // header 'accept: application/json'
  // params: {
  //   api_key: "440b6ddfa180068e2804916d6c6a534c",
  //   language: "ko-KR",
  // },
});

export default instance;
