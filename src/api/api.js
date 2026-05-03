import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_PYTHON_API_URL || "http://localhost:5000/api", // Update with your backend URL
});

export default API;
