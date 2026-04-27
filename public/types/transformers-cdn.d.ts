// Minimal ambient typings for the Transformers.js CDN module.
// We import directly from a jsDelivr URL in the browser, so TypeScript needs
// to be told this URL is a valid module.

declare module "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.8.0" {
  export type ObjectDetectionResult = {
    label: string;
    score: number;
    box: { xmin: number; ymin: number; xmax: number; ymax: number };
  };

  export type Pipeline = (
    input: string | HTMLImageElement,
    options?: { threshold?: number; percentage?: boolean },
  ) => Promise<ObjectDetectionResult[]>;

  export function pipeline(
    task: string,
    model?: string,
    options?: Record<string, unknown>,
  ): Promise<Pipeline>;
}
