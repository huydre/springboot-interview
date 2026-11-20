import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// ?bai=<lesson> opens a lesson, ?khoa=<program> opens that program's roadmap, anything else opens the course picker.
// Each page is its own chunk, so the picker and roadmap do not download every widget.
const params = new URLSearchParams(location.search);
const page = params.has("bai") ? import("./App") : params.has("khoa") ? import("./roadmap-page") : import("./catalog-page");

page.then(({ default: Page }) => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Page />
    </StrictMode>,
  );
});
