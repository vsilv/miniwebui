import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./api/config"; // Import API config with interceptors

createRoot(document.getElementById("root")).render(<App />);
