/**
 * Sliding highlight for every segmented control (.seg / .au-tabs) on the page, without touching the widgets:
 * a single absolutely positioned <i class="seg-ind"> per group follows the button marked "on".
 */
const GROUPS = ".seg, .au-tabs";

function place(group: HTMLElement) {
  let ind = group.querySelector<HTMLElement>(":scope > .seg-ind");
  if (!ind) {
    ind = document.createElement("i");
    ind.className = "seg-ind";
    ind.setAttribute("aria-hidden", "true");
    group.appendChild(ind);
    group.classList.add("has-ind");
  }
  const on = group.querySelector<HTMLElement>(":scope > button.on");
  if (!on || on.offsetWidth === 0) { ind.style.opacity = "0"; return; }
  const next = `${on.offsetLeft}px,${on.offsetTop}px,${on.offsetWidth}px,${on.offsetHeight}px`;
  if (ind.dataset.pos === next) return;
  const first = !ind.dataset.pos || ind.style.opacity === "0";
  ind.dataset.pos = next;
  ind.classList.toggle("instant", first);
  ind.style.opacity = "1";
  ind.style.width = `${on.offsetWidth}px`;
  ind.style.height = `${on.offsetHeight}px`;
  ind.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`;
}

export function initSegIndicators() {
  let queued = false;
  const scan = () => { queued = false; document.querySelectorAll<HTMLElement>(GROUPS).forEach(place); };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(scan); } };
  new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "open"] });
  addEventListener("resize", schedule);
  document.fonts?.ready.then(schedule);
  schedule();
}
