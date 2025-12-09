import axios, { AxiosError } from 'axios';
import { TestStep } from '../utils/types';
import { logger } from '../utils/logger';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function executeRequest(reqSpec: TestStep['request']) {
  const start = Date.now();
  logger.info('Executing HTTP request', { request: reqSpec });

  const maxRetries = 3;
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await axios.request({
        url: reqSpec.url,
        method: reqSpec.method,
        headers: reqSpec.headers,
        params: reqSpec.query,
        data: reqSpec.body,
        timeout: reqSpec.timeoutMs ?? 15000,
        validateStatus: () => true,
      });
      const duration = Date.now() - start;

      const response = {
        status: resp.status,
        headers: resp.headers,
        body: resp.data,
      };

      logger.info('HTTP request completed', { attempt, response, durationMs: duration });

      return {
        response,
        durationMs: duration,
      };
    } catch (err: any) {
      const isAxiosError = axios.isAxiosError(err);
      const axiosError = isAxiosError ? err as AxiosError : null;

      // Retry on network errors or 5xx server errors
      const isRetryable = isAxiosError && axiosError && (!axiosError.response || (axiosError.response.status >= 500 && axiosError.response.status <= 599));

      if (isRetryable && attempt < maxRetries) {
        logger.warn(`Request failed, retrying in ${delay}ms...`, { attempt, error: err.message });
        await sleep(delay);
        delay *= 2;
        continue; // to the next iteration
      }

      // If not retryable or max retries reached, handle the error
      const duration = Date.now() - start;
      logger.error('HTTP request failed permanently', { error: err.message, durationMs: duration });

      if (axiosError) {
        return {
          error: {
            message: axiosError.message,
            code: axiosError.code,
            response: axiosError.response ? {
              status: axiosError.response.status,
              headers: axiosError.response.headers,
              body: axiosError.response.data,
            } : null,
          },
          durationMs: duration
        };
      }

      return { error: err.message, durationMs: duration };
    }
  }

  // This is a fallback, should be unreachable if the loop logic is correct
  return { error: 'Request failed after maximum retries.', durationMs: Date.now() - start };
}
