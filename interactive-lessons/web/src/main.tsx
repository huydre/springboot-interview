import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// A lesson URL (?bai=...) opens the lesson page; anything else opens the roadmap. Each page is its own chunk,
// so the roadmap does not download every widget.
const page = new URLSearchParams(location.search).has("bai") ? import("./App") : import("./roadmap-page");

page.then(({ default: Page }) => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Page />
    </StrictMode>,
  );
});
