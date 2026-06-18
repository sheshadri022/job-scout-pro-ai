import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

// Wake the Render API server early (free tier spins down after inactivity).
// Fire-and-forget — we don't block rendering on this.
fetch(`${apiUrl || ""}/api/healthz`).catch(() => {});

createRoot(document.getElementById("root")!).render(<App />);
