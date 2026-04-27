import api from "./api";

// Next Match API
export const nextMatch = (data) => {
  return api.post("/session/next-match", data);
};
