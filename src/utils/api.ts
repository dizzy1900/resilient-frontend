import { toast } from '@/hooks/use-toast';

const RETRYABLE_STATUSES = [502, 503, 504];

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUSES.includes(status);
}

/**
 * Fire a one-time toast when the live simulation server is waking up (cold start).
 * Call this once per logical request, right before the first retry.
 */
function showWakingUpToast(): void {
  toast({
    title: 'Waking up live simulation server (this may take 5-10 seconds)...',
    description: 'Please wait while we retry.',
  });
}

/**
 * Fetch with retry for cold starts (502, 503, 504) and network errors.
 * Shows a toast before the first retry only.
 *
 * @param url - Request URL
 * @param options - Standard RequestInit
 * @param retries - Max number of attempts (default 3)
 * @param delayMs - Delay between retries in ms (default 3000)
 * @returns Response (throws after all retries exhausted)
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3,
  delayMs = 3000
): Promise<Response> {
  let lastError: unknown;
  let toastShown = false;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      if (isRetryableStatus(response.status)) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        if (attempt < retries - 1) {
          if (!toastShown) {
            showWakingUpToast();
            toastShown = true;
          }
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
        break;
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      return response;
    } catch (err) {
      lastError = err;
      if (attempt < retries - 1) {
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
 * Shows a toast before the first retry only.
 *
 * @param invokeFn - Function that returns Promise<{ data, error }>
 * @param retries - Max number of attempts (default 3)
 * @param delayMs - Delay between retries in ms (default 3000)
 * @returns Last result; caller should check result.error and fall back only after all retries.
 */
export async function invokeWithRetry<T>(
  invokeFn: () => Promise<{ data: T | null; error: unknown }>,
  retries = 3,
  delayMs = 3000
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

      if (!toastShown) {
        showWakingUpToast();
        toastShown = true;
      }
      await new Promise((res) => setTimeout(res, delayMs));
    } catch (err) {
      lastResult = { data: null, error: err };
      if (attempt < retries - 1) {
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
