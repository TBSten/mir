import type { MessageKey, MessageCatalog } from "./types.js";
import { ja } from "./locales/ja.js";
import { en } from "./locales/en.js";

export type Locale = "ja" | "en";

const catalogs: Record<Locale, MessageCatalog> = { ja, en };

let currentLocale: Locale = "ja";

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  let message = catalogs[currentLocale][key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      message = message.replaceAll(`{${k}}`, String(v));
    }
  }
  return message;
}

export type { MessageKey, MessageCatalog };
