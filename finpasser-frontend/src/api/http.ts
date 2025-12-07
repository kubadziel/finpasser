import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "http://localhost:8081",
});

export const setAuthToken = (token?: string) => {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
};

export default http;
