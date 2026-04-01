import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./i18n/index";

createRoot(document.getElementById("root")!).render(<App />);
