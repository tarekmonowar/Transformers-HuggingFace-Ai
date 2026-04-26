import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";

env.allowLocalModels = false;

const originalImage = document.getElementById("originalImage");
const detectedImage = document.getElementById("detectedImage");
const detectedFrame = document.getElementById("detectedFrame");
const fileInput = document.getElementById("imageUpload");
const detectBtn = document.getElementById("detectBtn");
const statusEl = document.getElementById("transformerStatus");

const MODEL_ID = "Xenova/yolos-tiny";
let detector = null;

const setStatus = (msg) => {
  statusEl.textContent = msg;
};

const setBusy = (busy) => {
  detectBtn.disabled = busy;
  fileInput.disabled = busy;
  detectBtn.classList.toggle("is-loading", busy);
  detectBtn.setAttribute("aria-busy", busy ? "true" : "false");
};

const clearBoxes = () => {
  detectedFrame.querySelectorAll(".box").forEach((b) => b.remove());
};

const ensureDetector = async () => {
  if (detector) return detector;

  setStatus("Loading object-detection model...");
  detector = await pipeline("object-detection", MODEL_ID);

  // Warmup pass: forces WebGPU shader compilation now (during a state the user
  // already perceives as "loading"), so the first real detection is fast.
  setStatus("Warming up GPU (one-time)...");
  try {
    await detector(originalImage.src, {
      threshold: 0.95,
      percentage: true,
    });
  } catch {
    // best-effort
  }

  return detector;
};

const drawBox = ({ label, score, box }) => {
  const { xmax, xmin, ymax, ymin } = box;

  const color =
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0");

  const boxEl = document.createElement("div");
  boxEl.className = "box";
  Object.assign(boxEl.style, {
    borderColor: color,
    left: 100 * xmin + "%",
    top: 100 * ymin + "%",
    width: 100 * (xmax - xmin) + "%",
    height: 100 * (ymax - ymin) + "%",
  });

  const labelEl = document.createElement("span");
  labelEl.className = "box-label";
  labelEl.textContent = `${label}: ${Math.floor(score * 100)}%`;
  labelEl.style.backgroundColor = color;
  boxEl.appendChild(labelEl);

  detectedFrame.appendChild(boxEl);
};

const detect = async () => {
  const inputUrl = originalImage.currentSrc || originalImage.src;
  if (!inputUrl) return;
  try {
    setBusy(true);
    clearBoxes();

    // Keep "Detected" panel aligned with "Original" (right may be a static demo image at first).
    detectedImage.src = inputUrl;

    const model = await ensureDetector();
    setStatus("Detecting objects...");

    const results = await model(inputUrl, {
      threshold: 0.5,
      percentage: true,
    });

    setStatus("Drawing...");
    // Yield one paint frame so the "Drawing..." status actually renders
    // before the boxes appear (drawing 15+ boxes is sub-millisecond, so without
    // this yield the browser would skip painting "Drawing..." entirely).
    await new Promise((r) => requestAnimationFrame(r));

    results.forEach(drawBox);

    setStatus(
      results.length
        ? `Found ${results.length} object${results.length === 1 ? "" : "s"}.`
        : "No objects detected.",
    );
  } catch (err) {
    console.error("[transformer] detection failed:", err);
    setStatus(`Error: ${err.message || "detection failed"}`);
  } finally {
    setBusy(false);
  }
};

detectBtn.addEventListener("click", () => detect());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  clearBoxes();
  originalImage.src = url;
  detectedImage.src = url;

  detectedImage.onload = () => detect();
});
