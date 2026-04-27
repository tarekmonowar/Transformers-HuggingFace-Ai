import { pipeline, } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.8.0";
const originalImage = document.getElementById("originalImage");
const detectedImage = document.getElementById("detectedImage");
const detectedFrame = document.getElementById("detectedFrame");
const fileInput = document.getElementById("imageUpload");
const detectBtn = document.getElementById("detectBtn");
const statusEl = document.getElementById("transformerStatus");
const MODEL_ID = "Xenova/yolos-tiny";
let detector = null;
const setStatus = (msg) => {
    if (statusEl)
        statusEl.textContent = msg;
};
const setBusy = (busy) => {
    if (detectBtn) {
        detectBtn.disabled = busy;
        detectBtn.classList.toggle("is-loading", busy);
        detectBtn.setAttribute("aria-busy", busy ? "true" : "false");
    }
    if (fileInput)
        fileInput.disabled = busy;
};
const clearBoxes = () => {
    detectedFrame?.querySelectorAll(".box").forEach((b) => b.remove());
};
const ensureDetector = async () => {
    if (detector)
        return detector;
    setStatus("Loading object-detection model...");
    detector = await pipeline("object-detection", MODEL_ID);
    setStatus("Warming up model (one-time)...");
    return detector;
};
const drawBox = ({ label, score, box }) => {
    if (!detectedFrame)
        return;
    const { xmax, xmin, ymax, ymin } = box;
    const color = "#" +
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
const detect = async () => {
    if (!originalImage || !detectedImage)
        return;
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
        setStatus(results.length
            ? `Found ${results.length} object${results.length === 1 ? "" : "s"}.`
            : "No objects detected.");
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "detection failed";
        console.error("[transformer] detection failed:", err);
        setStatus(`Error: ${message}`);
    }
    finally {
        setBusy(false);
    }
};
detectBtn?.addEventListener("click", () => detect());
fileInput?.addEventListener("change", (e) => {
    const target = e.target;
    const file = target.files?.[0];
    if (!file || !originalImage || !detectedImage)
        return;
    const url = URL.createObjectURL(file);
    clearBoxes();
    originalImage.src = url;
    detectedImage.src = url;
    detectedImage.onload = () => {
        detectedImage.onload = null;
        detect();
    };
});
