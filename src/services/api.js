import axios from "axios";

const api = axios.create({
  baseURL: "https://web-production-c3a150.up.railway.app/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default api;
