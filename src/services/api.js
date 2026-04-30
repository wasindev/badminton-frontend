import axios from "axios";

const api = axios.create({
  baseURL: "https://web-production-c3a150.up.railway.app/api",
  // baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default api;
