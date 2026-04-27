import {
  pipeline,
  type Pipeline,
  type ObjectDetectionResult,
} from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.8.0";

const originalImage = document.getElementById(
  "originalImage",
) as HTMLImageElement | null;
const detectedImage = document.getElementById(
  "detectedImage",
) as HTMLImageElement | null;
const detectedFrame = document.getElementById(
  "detectedFrame",
) as HTMLElement | null;
const fileInput = document.getElementById(
  "imageUpload",
) as HTMLInputElement | null;
const detectBtn = document.getElementById(
  "detectBtn",
) as HTMLButtonElement | null;
const statusEl = document.getElementById(
  "transformerStatus",
) as HTMLElement | null;

const MODEL_ID = "Xenova/yolos-tiny";
let detector: Pipeline | null = null;

const setStatus = (msg: string): void => {
  if (statusEl) statusEl.textContent = msg;
};

const setBusy = (busy: boolean): void => {
  if (detectBtn) {
    detectBtn.disabled = busy;
    detectBtn.classList.toggle("is-loading", busy);
    detectBtn.setAttribute("aria-busy", busy ? "true" : "false");
  }
  if (fileInput) fileInput.disabled = busy;
};

const clearBoxes = (): void => {
  detectedFrame?.querySelectorAll(".box").forEach((b) => b.remove());
};

const ensureDetector = async (): Promise<Pipeline> => {
  if (detector) return detector;

  setStatus("Loading object-detection model...");
  detector = await pipeline("object-detection", MODEL_ID);
  setStatus("Warming up model (one-time)...");
  return detector;
};

const drawBox = ({ label, score, box }: ObjectDetectionResult): void => {
  if (!detectedFrame) return;
  const { xmax, xmin, ymax, ymin } = box;

  const color =
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0");

  const boxElement = document.createElement("div");
  boxElement.className = "box";
  Object.assign(boxElement.style, {
    borderColor: color,
    left: 100 * xmin + "%",
    top: 100 * ymin + "%",
    width: 100 * (xmax - xmin) + "%",
    height: 100 * (ymax - ymin) + "%",
  });

  const labelElement = document.createElement("span");
  labelElement.className = "box-label";
  labelElement.textContent = `${label}: ${Math.floor(score * 100)}%`;
  labelElement.style.backgroundColor = color;
  boxElement.appendChild(labelElement);

  detectedFrame.appendChild(boxElement);
};

const detect = async (): Promise<void> => {
  if (!originalImage || !detectedImage) return;

  try {
    setBusy(true);
    clearBoxes();
    detectedImage.src = originalImage.src;

    const model = await ensureDetector();
    setStatus("Detecting objects...");

    const results = await model(originalImage.src, {
      threshold: 0.95,
      percentage: true,
    });

    results.forEach(drawBox);

    setStatus(
      results.length
        ? `Found ${results.length} object${results.length === 1 ? "" : "s"}.`
        : "No objects detected.",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "detection failed";
    console.error("[transformer] detection failed:", err);
    setStatus(`Error: ${message}`);
  } finally {
    setBusy(false);
  }
};

detectBtn?.addEventListener("click", () => detect());

fileInput?.addEventListener("change", (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !originalImage || !detectedImage) return;

  const url = URL.createObjectURL(file);
  clearBoxes();
  originalImage.src = url;
  detectedImage.src = url;

  detectedImage.onload = () => {
    detectedImage.onload = null;
    detect();
  };
});
