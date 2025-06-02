import axios from "axios";

const instance = axios.create({
  baseURL: "https://api.bithumb.com/v1",
});

export default instance;
