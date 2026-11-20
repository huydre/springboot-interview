import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/duo-theme.css";
import { Overlays } from "./components/overlays";
import { initSegIndicators } from "./lib/seg-indicator";

// After a deploy, a tab opened on the previous build may ask for a chunk that no longer exists: reload once to pick up the new build.
addEventListener("vite:preloadError", (e) => {
  const key = "interviewlab.reloaded-for-chunk";
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  e.preventDefault();
  location.reload();
});
addEventListener("load", () => setTimeout(() => sessionStorage.removeItem("interviewlab.reloaded-for-chunk"), 10000));

// ?bai=<lesson> opens a lesson, ?khoa=<program> opens that program's roadmap, anything else opens the course picker.
// Each page is its own chunk, so the picker and roadmap do not download every widget.
const params = new URLSearchParams(location.search);
const page = params.has("bai") ? import("./App") : params.has("khoa") ? import("./roadmap-page") : import("./catalog-page");

// Toasts and the sign-in dialog live in their own root so every page shares them.
const overlays = document.createElement("div");
document.body.appendChild(overlays);
createRoot(overlays).render(<Overlays />);
initSegIndicators();

page.then(({ default: Page }) => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Page />
    </StrictMode>,
  );
});
