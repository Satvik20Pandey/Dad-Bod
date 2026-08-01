/* Dad Bod — capture inputs for meal logging: native/web voice dictation,
 * nutrition-label OCR (on-device Tesseract), and camera barcode scanning. */

import { select, setText } from "../utils.js";
import { showToast } from "../ui/components.js";
import {
  normalizeNutrition,
  estimateCaloriesFromNutrition,
} from "../core/nutrition.js";

let activeSpeechRecognition = null;

/* ---- Voice ---- */

function getSpeechErrorMessage(errorCode) {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission denied. Allow mic access in settings.";
    case "audio-capture":
      return "No microphone detected. Connect a microphone and retry.";
    case "network":
      return "Voice service network issue. Check internet and try again.";
    case "no-speech":
      return "No speech detected. Speak clearly and try again.";
    case "aborted":
      return "Voice capture stopped. Tap voice again to retry.";
    default:
      return "Could not capture voice. Try again in a quieter environment.";
  }
}

function readPermissionGranted(result) {
  if (!result) return false;
  if (typeof result.permission === "boolean") return result.permission;
  if (typeof result.permission === "string") return result.permission.toLowerCase() === "granted";
  if (typeof result.speechRecognition === "string") return result.speechRecognition.toLowerCase() === "granted";
  if (typeof result.granted === "boolean") return result.granted;
  return false;
}

async function startNativeVoiceInput(input, statusId, onTranscript) {
  const isNativeApp = Boolean(window.Capacitor?.isNativePlatform?.());
  const speechPlugin = window.Capacitor?.Plugins?.SpeechRecognition;
  if (!isNativeApp || !speechPlugin || !input) return false;

  try {
    const availability = await speechPlugin.available();
    if (!availability?.available) {
      const message = "Speech recognition is not available on this device.";
      showToast(message, "error");
      setText(statusId, message);
      return true;
    }

    let hasPermissionResult = null;
    if (typeof speechPlugin.hasPermission === "function") {
      hasPermissionResult = await speechPlugin.hasPermission();
    } else if (typeof speechPlugin.checkPermissions === "function") {
      hasPermissionResult = await speechPlugin.checkPermissions();
    }

    let granted = readPermissionGranted(hasPermissionResult);
    if (!granted) {
      let requested = null;
      if (typeof speechPlugin.requestPermission === "function") {
        requested = await speechPlugin.requestPermission();
      } else if (typeof speechPlugin.requestPermissions === "function") {
        requested = await speechPlugin.requestPermissions();
      }
      granted = readPermissionGranted(requested);
    }

    if (!granted) {
      const message = "Microphone permission denied. Enable it in app permissions.";
      showToast(message, "error");
      setText(statusId, message);
      return true;
    }

    setText(statusId, "Listening… speak your meal now.");

    const transcript = await new Promise((resolve, reject) => {
      let settled = false;
      let timer = null;
      let listener = null;
      let bestTranscript = "";

      const cleanup = async () => {
        if (timer) clearTimeout(timer);
        try {
          await speechPlugin.stop();
        } catch {}
        if (listener?.remove) {
          try {
            await listener.remove();
          } catch {}
        }
      };

      const resolveOnce = async (value) => {
        if (settled) return;
        settled = true;
        await cleanup();
        resolve(value);
      };

      const rejectOnce = async (error) => {
        if (settled) return;
        settled = true;
        await cleanup();
        reject(error);
      };

      (async () => {
        try {
          listener = await speechPlugin.addListener("partialResults", (event) => {
            const first = String(event?.matches?.[0] || "").trim();
            if (first && first.length > bestTranscript.length) bestTranscript = first;
          });

          timer = setTimeout(() => {
            if (bestTranscript) resolveOnce(bestTranscript);
            else rejectOnce(new Error("no-speech"));
          }, 18000);

          const started = await speechPlugin.start({
            language: "en-IN",
            maxResults: 1,
            partialResults: true,
            popup: true,
            prompt: "Describe your meal",
          });

          const direct = String(started?.matches?.[0] || "").trim();
          if (direct) resolveOnce(direct);
          else if (bestTranscript) resolveOnce(bestTranscript);
        } catch (error) {
          rejectOnce(error);
        }
      })();
    });

    const finalText = String(transcript || "").trim();
    if (!finalText) {
      const message = "No speech captured. Try again and speak clearly.";
      showToast(message, "error");
      setText(statusId, message);
      return true;
    }

    await onTranscript(finalText, "Native voice");
    return true;
  } catch (error) {
    console.warn("Native speech recognition failed", error);
    setText(statusId, "Native speech failed. Trying browser voice fallback.");
    return false;
  }
}

export async function startVoiceInput(targetInputId, statusId, onTranscript) {
  const input = select(targetInputId);
  if (!input) return;

  const nativeHandled = await startNativeVoiceInput(input, statusId, onTranscript);
  if (nativeHandled) return;

  const isNativeApp = Boolean(window.Capacitor?.isNativePlatform?.());
  if (!isNativeApp && !window.isSecureContext && location.hostname !== "localhost") {
    showToast("Voice input needs HTTPS.", "error");
    setText(statusId, "Voice input requires an HTTPS connection.");
    return;
  }

  if (navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      const denied = error?.name === "NotAllowedError" || error?.name === "SecurityError";
      const unavailable = error?.name === "NotFoundError";
      const message = denied
        ? "Microphone permission denied. Enable it and try again."
        : unavailable
          ? "No microphone device found."
          : "Unable to access microphone.";
      showToast(message, "error");
      setText(statusId, message);
      return;
    }
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    const message = isNativeApp
      ? "Speech recognition is unavailable on this Android WebView."
      : "Voice input is not supported on this browser.";
    showToast(message, "error");
    setText(statusId, message);
    return;
  }

  if (activeSpeechRecognition) {
    activeSpeechRecognition.stop();
    activeSpeechRecognition = null;
  }

  const recog = new SpeechRecognition();
  activeSpeechRecognition = recog;
  recog.lang = "en-IN";
  recog.continuous = false;
  recog.interimResults = true;
  recog.maxAlternatives = 1;

  let finalTranscript = "";
  let latestTranscript = "";
  let hadError = false;

  setText(statusId, "Listening… describe your meal now.");

  recog.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0]?.transcript || "";
      if (event.results[i].isFinal) {
        finalTranscript += `${transcript} `;
      } else {
        interim += transcript;
      }
      if (transcript.trim().length > latestTranscript.length) {
        latestTranscript = transcript.trim();
      }
    }
    const preview = (finalTranscript + interim).trim();
    if (preview) {
      input.value = preview;
      setText(statusId, `Listening… ${preview}`);
    }
  };

  recog.onerror = (event) => {
    hadError = true;
    const message = getSpeechErrorMessage(event.error);
    showToast(message, "error");
    setText(statusId, message);
  };

  recog.onend = async () => {
    if (activeSpeechRecognition === recog) activeSpeechRecognition = null;
    if (hadError) return;

    const transcript = finalTranscript.trim() || latestTranscript.trim();
    if (!transcript) {
      const message = "No speech captured. Try again a little louder.";
      showToast(message, "error");
      setText(statusId, message);
      return;
    }

    await onTranscript(transcript, "Voice");
  };

  try {
    recog.start();
  } catch {
    activeSpeechRecognition = null;
    const message = "Microphone is busy. Close other voice apps and retry.";
    showToast(message, "error");
    setText(statusId, message);
  }
}

/* ---- Nutrition label OCR (regex parse of Tesseract output — fully on-device) ---- */

function extractMeasuredValue(text, patterns) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (!match) continue;
    const value = Number(String(match[1]).replace(/,/g, "."));
    if (!Number.isFinite(value)) continue;
    const unit = String(match[2] || "").toLowerCase().replace(/μ|µ/g, "u");
    return { value, unit };
  }
  return null;
}

function toGrams(measure) {
  if (!measure) return null;
  if (measure.unit === "mg") return measure.value / 1000;
  if (measure.unit === "mcg" || measure.unit === "ug") return measure.value / 1000000;
  return measure.value;
}

function toMilligrams(measure) {
  if (!measure) return null;
  if (measure.unit === "g") return measure.value * 1000;
  if (measure.unit === "mcg" || measure.unit === "ug") return measure.value / 1000;
  return measure.value;
}

function toMicrograms(measure) {
  if (!measure) return null;
  if (measure.unit === "g") return measure.value * 1000000;
  if (measure.unit === "mg") return measure.value * 1000;
  if (measure.unit === "iu") return measure.value * 0.3;
  return measure.value;
}

export function parseNutritionLabel(text) {
  const normalized = String(text || "").replace(/,/g, ".").replace(/\s+/g, " ");

  const normalizedForTotalFat = normalized
    .replace(/saturated\s*fat/gi, "")
    .replace(/polyunsaturated\s*fat/gi, "")
    .replace(/monounsaturated\s*fat/gi, "")
    .replace(/trans\s*fat/gi, "");

  const caloriesMatch = extractMeasuredValue(normalized, [/(?:calories|energy)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i]);
  const proteinMatch = extractMeasuredValue(normalized, [/protein\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const carbsMatch = extractMeasuredValue(normalized, [/(?:carbohydrate|carbohydrates|carbs?)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const fiberMatch = extractMeasuredValue(normalized, [/fiber\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const sugarMatch = extractMeasuredValue(normalized, [/(?:total\s+)?sugars?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const fatMatch = extractMeasuredValue(normalizedForTotalFat, [/(?:total\s+fat|\bfat\b)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const satFatMatch = extractMeasuredValue(normalized, [/(?:saturated\s*fat|sat\.?\s*fat)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const polyFatMatch = extractMeasuredValue(normalized, [/(?:polyunsaturated\s*fat|poly\.?\s*fat)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const monoFatMatch = extractMeasuredValue(normalized, [/(?:monounsaturated\s*fat|mono\.?\s*fat)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const transFatMatch = extractMeasuredValue(normalized, [/trans\s*fat\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const cholesterolMatch = extractMeasuredValue(normalized, [/cholesterol\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);
  const sodiumMatch = extractMeasuredValue(normalized, [/sodium\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);
  const potassiumMatch = extractMeasuredValue(normalized, [/potassium\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);
  const vitaminAMatch = extractMeasuredValue(normalized, [/(?:vitamin\s*a|vit\.?\s*a)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mcg|ug|mg|iu)?/i]);
  const vitaminCMatch = extractMeasuredValue(normalized, [/(?:vitamin\s*c|vit\.?\s*c)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);
  const calciumMatch = extractMeasuredValue(normalized, [/calcium\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);
  const ironMatch = extractMeasuredValue(normalized, [/iron\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);

  return {
    kcal: caloriesMatch ? caloriesMatch.value : null,
    protein: toGrams(proteinMatch),
    carbs: toGrams(carbsMatch),
    fiber: toGrams(fiberMatch),
    sugar: toGrams(sugarMatch),
    fat: toGrams(fatMatch),
    satFat: toGrams(satFatMatch),
    polyFat: toGrams(polyFatMatch),
    monoFat: toGrams(monoFatMatch),
    transFat: toGrams(transFatMatch),
    cholesterol: toMilligrams(cholesterolMatch),
    sodium: toMilligrams(sodiumMatch),
    potassium: toMilligrams(potassiumMatch),
    vitaminA: toMicrograms(vitaminAMatch),
    vitaminC: toMilligrams(vitaminCMatch),
    calcium: toMilligrams(calciumMatch),
    iron: toMilligrams(ironMatch),
  };
}

let tesseractLoadPromise = null;

/* The OCR engine (~2 MB) loads on demand the first time a label is scanned. */
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(true);
  if (tesseractLoadPromise) return tesseractLoadPromise;

  tesseractLoadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    const timer = setTimeout(() => resolve(false), 20000);
    script.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    script.onerror = () => {
      clearTimeout(timer);
      tesseractLoadPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return tesseractLoadPromise;
}

export async function scanLabelFile(file, statusId) {
  if (!file) return null;

  setText(statusId, "Preparing label reader…");
  const ready = await loadTesseract();
  if (!ready || !window.Tesseract) {
    setText(statusId, "Label reader needs internet the first time. Check connection and retry.");
    return null;
  }

  setText(statusId, "Reading nutrition label…");

  try {
    const result = await window.Tesseract.recognize(file, "eng", { logger: () => {} });
    const ocrText = result?.data?.text || "";
    const parsed = parseNutritionLabel(ocrText);

    if (parsed.kcal == null && parsed.protein == null && parsed.carbs == null && parsed.fat == null) {
      setText(statusId, "Could not read the label clearly. Try a sharper, closer photo.");
      return null;
    }

    const labelEstimate = normalizeNutrition(
      Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, v ?? 0]))
    );
    if (!labelEstimate.kcal) {
      labelEstimate.kcal = estimateCaloriesFromNutrition(labelEstimate);
    }

    setText(statusId, "Label read. Verify the values and save.");
    return labelEstimate;
  } catch {
    setText(statusId, "Label read failed. Please enter values manually.");
    return null;
  }
}

/* ---- Barcode scanning ----
 * Decoder chain: native BarcodeDetector → ZXing (lazy-loaded UMD) → manual
 * entry. Works across Android WebViews that lack the Shape Detection API. */

let barcodeStream = null;
let barcodeLoopActive = false;
let zxingReader = null;
let zxingLoadPromise = null;

export function barcodeCameraSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

function loadZxing() {
  if (window.ZXing?.BrowserMultiFormatReader) return Promise.resolve(true);
  if (zxingLoadPromise) return zxingLoadPromise;

  zxingLoadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
    script.async = true;
    const timer = setTimeout(() => resolve(false), 15000);
    script.onload = () => {
      clearTimeout(timer);
      resolve(Boolean(window.ZXing?.BrowserMultiFormatReader));
    };
    script.onerror = () => {
      clearTimeout(timer);
      zxingLoadPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return zxingLoadPromise;
}

async function startNativeDetectorLoop(video, onCode) {
  if (!("BarcodeDetector" in window)) return false;

  let detector;
  try {
    const supported = await window.BarcodeDetector.getSupportedFormats?.();
    if (Array.isArray(supported) && !supported.length) return false;
    detector = new window.BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
    });
  } catch {
    return false;
  }

  const scanLoop = async () => {
    if (!barcodeLoopActive || !video.srcObject) return;
    try {
      const codes = await detector.detect(video);
      const value = codes?.[0]?.rawValue;
      if (value) {
        onCode(String(value));
        return;
      }
    } catch {}
    if (barcodeLoopActive) setTimeout(scanLoop, 240);
  };
  scanLoop();
  return true;
}

async function startZxingLoop(video, statusId, onCode) {
  const ready = await loadZxing();
  if (!ready) return false;

  try {
    zxingReader = new window.ZXing.BrowserMultiFormatReader();
    zxingReader.decodeFromVideoElementContinuously(video, (result) => {
      if (!barcodeLoopActive) return;
      const value = result?.getText?.();
      if (value) onCode(String(value));
    });
    return true;
  } catch {
    zxingReader = null;
    return false;
  }
}

export async function startBarcodeCamera(videoId, statusId, onCode) {
  const video = select(videoId);
  if (!video || !barcodeCameraSupported()) {
    setText(statusId, "Camera unavailable — type the barcode number instead.");
    return false;
  }

  try {
    barcodeStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  } catch {
    setText(statusId, "Camera permission denied — type the barcode number instead.");
    return false;
  }

  video.srcObject = barcodeStream;
  await video.play().catch(() => {});
  barcodeLoopActive = true;

  const guardedOnCode = (value) => {
    if (!barcodeLoopActive) return;
    barcodeLoopActive = false;
    onCode(value);
  };

  if (await startNativeDetectorLoop(video, guardedOnCode)) {
    setText(statusId, "Align the barcode inside the frame");
    return true;
  }

  setText(statusId, "Preparing decoder…");
  if (await startZxingLoop(video, statusId, guardedOnCode)) {
    setText(statusId, "Align the barcode inside the frame");
    return true;
  }

  setText(statusId, "Live detection unavailable — type the barcode number instead.");
  return true;
}

export function stopBarcodeCamera(videoId) {
  barcodeLoopActive = false;
  if (zxingReader) {
    try {
      zxingReader.stopContinuousDecode?.();
      zxingReader.reset?.();
    } catch {}
    zxingReader = null;
  }
  const video = select(videoId);
  if (video) {
    video.pause();
    video.srcObject = null;
  }
  if (barcodeStream) {
    barcodeStream.getTracks().forEach((track) => track.stop());
    barcodeStream = null;
  }
}
