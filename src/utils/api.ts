import { toast } from '@/hooks/use-toast';

const RETRYABLE_STATUSES = [502, 503, 504];

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUSES.includes(status);
}

/** Delays in ms between retries (exponential backoff). Total wait ~28s across 4 delays. */
const RETRY_DELAYS_MS = [3000, 5000, 8000, 12000];

/**
 * Fire a one-time toast when the live simulation server is waking up (cold start).
 * Call this once per logical request, right before the first retry.
 */
function showWakingUpToast(): void {
  toast({
    title: 'Waking up live simulation server. Booting ML models (this can take up to 30 seconds)...',
    description: 'Please wait while we retry.',
  });
}

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetch with retry for cold starts (502, 503, 504) and network errors.
 * Uses 5 attempts, exponential backoff between retries, and a 15s timeout per attempt.
 * Shows a toast before the first retry only.
 *
 * @param url - Request URL
 * @param options - Standard RequestInit (signal will be combined with per-attempt timeout)
 * @param retries - Max number of attempts (default 5)
 * @returns Response (throws after all retries exhausted)
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 5
): Promise<Response> {
  let lastError: unknown;
  let toastShown = false;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const callerSignal = options?.signal;
    if (callerSignal) {
      callerSignal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort();
      });
    }
    const signal = controller.signal;

    try {
      const response = await fetch(url, { ...options, signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      if (isRetryableStatus(response.status)) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        if (attempt < retries - 1) {
          console.warn(
            `[fetchWithRetry] attempt ${attempt + 1}/${retries} failed (${response.status}), retrying in ${RETRY_DELAYS_MS[attempt] ?? 0}ms...`,
            { url, status: response.status }
          );
          if (!toastShown) {
            showWakingUpToast();
            toastShown = true;
          }
          clearTimeout(timeoutId);
          await new Promise((res) => setTimeout(res, RETRY_DELAYS_MS[attempt] ?? 12000));
          continue;
        }
        break;
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      if (attempt < retries - 1) {
        console.warn(
          `[fetchWithRetry] attempt ${attempt + 1}/${retries} failed (network/timeout), retrying in ${RETRY_DELAYS_MS[attempt] ?? 0}ms...`,
          { url, error: err }
        );
        if (!toastShown) {
          showWakingUpToast();
          toastShown = true;
        }
        await new Promise((res) => setTimeout(res, RETRY_DELAYS_MS[attempt] ?? 12000));
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}

/**
 * Check if an error from Supabase Functions is retryable (e.g. 502/503/504 or cold start).
 * Supabase may expose status on error.context?.status; otherwise we treat as retryable (cold start).
 */
function isRetryableInvokeError(error: unknown): boolean {
  if (error == null) return false;
  const err = error as { status?: number; context?: { status?: number }; message?: string };
  const status = err.status ?? err.context?.status;
  if (typeof status === 'number') {
    if (isRetryableStatus(status)) return true;
    return false;
  }
  if (typeof err.message === 'string') {
    const m = err.message;
    if (/\b50[234]\b/.test(m) || /gateway|unavailable|timeout/i.test(m)) return true;
  }
  return true;
}

/**
 * Invoke an async function (e.g. supabase.functions.invoke) with retry for cold starts.
 * Retries on throw or when the result has a retryable error (502/503/504 or gateway errors).
 * Uses same backoff as fetchWithRetry. Shows a toast before the first retry only.
 *
 * @param invokeFn - Function that returns Promise<{ data, error }>
 * @param retries - Max number of attempts (default 5)
 * @returns Last result; caller should check result.error and fall back only after all retries.
 */
export async function invokeWithRetry<T>(
  invokeFn: () => Promise<{ data: T | null; error: unknown }>,
  retries = 5
): Promise<{ data: T | null; error: unknown }> {
  let lastResult: { data: T | null; error: unknown } = { data: null, error: null };
  let toastShown = false;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await invokeFn();
      lastResult = result;

      if (result.error == null) {
        return result;
      }

      const shouldRetry =
        attempt < retries - 1 && isRetryableInvokeError(result.error);

      if (!shouldRetry) {
        return result;
      }

      const delayMs = RETRY_DELAYS_MS[attempt] ?? 12000;
      console.warn(
        `[invokeWithRetry] attempt ${attempt + 1}/${retries} failed (retryable error), retrying in ${delayMs}ms...`,
        { error: result.error }
      );
      if (!toastShown) {
        showWakingUpToast();
        toastShown = true;
      }
      await new Promise((res) => setTimeout(res, delayMs));
    } catch (err) {
      lastResult = { data: null, error: err };
      if (attempt < retries - 1) {
        const delayMs = RETRY_DELAYS_MS[attempt] ?? 12000;
        console.warn(
          `[invokeWithRetry] attempt ${attempt + 1}/${retries} failed (throw), retrying in ${delayMs}ms...`,
          { error: err }
        );
        if (!toastShown) {
          showWakingUpToast();
          toastShown = true;
        }
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        throw err;
      }
    }
  }

  return lastResult;
}
