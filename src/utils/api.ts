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

