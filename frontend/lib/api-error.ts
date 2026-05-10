import { AxiosError } from "axios";

type ApiErrorPayload = {
  message?: string;
  error_code?: string;
  retry_after?: number;
};

const TECHNICAL_AUTH_MESSAGES = new Set([
  "Token has expired",
  "Token is invalid",
  "Token not provided",
  "Unauthorized",
]);

const TECHNICAL_THROTTLE_MESSAGES = new Set([
  "Too Many Attempts.",
  "Too Many Requests",
  "Too Many Attempts",
]);

const TECHNICAL_ERROR_PATTERNS = [
  /SQLSTATE/i,
  /Connection:\s*\w+/i,
  /Connection refused/i,
  /\bmysql\b/i,
  /\bPDO\b/i,
  /\bIlluminate\\/i,
  /\bSymfony\\/i,
  /\bvendor\\/i,
  /\bstack trace\b/i,
];

export function isTechnicalErrorMessage(message: string): boolean {
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function getSafeApiMessage(message: string | undefined, fallback: string): string {
  if (!message || isTechnicalErrorMessage(message)) {
    return fallback;
  }

  return message;
}

function readRetryAfterSeconds(error: AxiosError<ApiErrorPayload>): number | null {
  const payloadValue = error.response?.data?.retry_after;
  if (typeof payloadValue === "number" && Number.isFinite(payloadValue) && payloadValue > 0) {
    return Math.ceil(payloadValue);
  }

  const headerValue = error.response?.headers?.["retry-after"];
  if (typeof headerValue === "string") {
    const parsed = Number.parseInt(headerValue, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErrorPayload>;
  const message = axiosError.response?.data?.message;
  const status = axiosError.response?.status;

  if (status === 401) {
    if (!message || TECHNICAL_AUTH_MESSAGES.has(message)) {
      return "Oturum süreniz doldu. Lütfen tekrar giriş yapın.";
    }

    return message;
  }

  if (status === 429) {
    const seconds = readRetryAfterSeconds(axiosError);
    const suffix = seconds ? ` ${seconds} saniye sonra tekrar deneyin.` : " Lütfen biraz sonra tekrar deneyin.";

    if (!message || TECHNICAL_THROTTLE_MESSAGES.has(message)) {
      return `Çok fazla deneme yaptınız.${suffix}`;
    }

    return message;
  }

  if (status && status >= 500) {
    return "Servis şu anda kullanılamıyor. Lütfen kısa bir süre sonra tekrar deneyin.";
  }

  return getSafeApiMessage(message, fallback);
}
