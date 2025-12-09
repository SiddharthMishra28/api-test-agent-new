import Ajv from 'ajv';
import { JSONPath } from 'jsonpath-plus';
import { Assertion, AssertionResult, StepResult } from '../utils/types';
import { logger } from '../utils/logger';

const ajv = new Ajv();

export async function runAssertions(
  response: NonNullable<StepResult['response']>,
  assertions: Assertion[]
): Promise<AssertionResult[]> {
  const results: AssertionResult[] = [];

  for (const assertion of assertions) {
    let result: AssertionResult = {
      assertionId: assertion.id,
      ok: false,
      message: `Assertion type '${assertion.type}' not implemented.`,
    };

    try {
      switch (assertion.type) {
        case 'status':
          const ok = response.status === assertion.params.expected;
          result = {
            assertionId: assertion.id,
            ok,
            message: ok
              ? `Status code is ${response.status}`
              : `Expected status code ${assertion.params.expected}, but got ${response.status}`,
            details: { expected: assertion.params.expected, actual: response.status },
          };
          break;

        case 'jsonSchema':
          const validate = ajv.compile(assertion.params.schema);
          const schemaOk = validate(response.body);
          result = {
            assertionId: assertion.id,
            ok: schemaOk,
            message: schemaOk ? 'JSON schema validation passed' : 'JSON schema validation failed',
            details: schemaOk ? null : validate.errors,
          };
          break;

        case 'jsonPath':
          const values = JSONPath({ path: assertion.params.path, json: response.body });
          const value = values.length > 0 ? values[0] : undefined;
          let jsonPathOk = false;
          let message = '';

          switch (assertion.params.operator) {
            case 'exists':
              jsonPathOk = values.length > 0;
              message = jsonPathOk ? `Path '${assertion.params.path}' exists` : `Path '${assertion.params.path}' does not exist`;
              break;
            case 'equals':
              jsonPathOk = value === assertion.params.expected;
              message = jsonPathOk
                ? `Path '${assertion.params.path}' equals '${assertion.params.expected}'`
                : `Expected path '${assertion.params.path}' to equal '${assertion.params.expected}', but got '${value}'`;
              break;
            case 'contains':
                if (Array.isArray(value)) {
                    jsonPathOk = value.includes(assertion.params.expected);
                } else if (typeof value === 'string') {
                    jsonPathOk = value.includes(assertion.params.expected);
                }
                message = jsonPathOk
                ? `Path '${assertion.params.path}' contains '${assertion.params.expected}'`
                : `Expected path '${assertion.params.path}' to contain '${assertion.params.expected}', but it did not`;
                break;
            case 'length':
                jsonPathOk = Array.isArray(value) && value.length === assertion.params.expected;
                message = jsonPathOk
                ? `Path '${assertion.params.path}' has length '${assertion.params.expected}'`
                : `Expected path '${assertion.params.path}' to have length '${assertion.params.expected}', but got '${(value || []).length}'`;
                break;
            default:
              message = `Unsupported jsonPath operator: ${assertion.params.operator}`;
              break;
          }
          result = { assertionId: assertion.id, ok: jsonPathOk, message, details: { path: assertion.params.path, operator: assertion.params.operator, expected: assertion.params.expected, actual: value } };
          break;

        case 'header':
          const headerName = assertion.params.name.toLowerCase();
          const actualHeader = response.headers ? response.headers[headerName] : undefined;
          const headerOk = actualHeader === assertion.params.expected;
          result = {
            assertionId: assertion.id,
            ok: headerOk,
            message: headerOk
              ? `Header '${assertion.params.name}' is correct`
              : `Expected header '${assertion.params.name}' to be '${assertion.params.expected}', but got '${actualHeader}'`,
            details: { expected: assertion.params.expected, actual: actualHeader },
          };
          break;

        case 'regex':
          const target = assertion.params.target === 'body' ? JSON.stringify(response.body) : (response.headers ? response.headers[assertion.params.headerName] : '');
          const regex = new RegExp(assertion.params.pattern);
          const regexOk = regex.test(target);
          result = {
            assertionId: assertion.id,
            ok: regexOk,
            message: regexOk
              ? `Regex pattern '${assertion.params.pattern}' matched`
              : `Regex pattern '${assertion.params.pattern}' did not match`,
            details: { target: assertion.params.target, pattern: assertion.params.pattern },
          };
          break;

        case 'responseTime':
          const rtOk = response.durationMs! <= assertion.params.maxMs;
          result = {
            assertionId: assertion.id,
            ok: rtOk,
            message: rtOk
              ? `Response time is within ${assertion.params.maxMs}ms`
              : `Response time of ${response.durationMs}ms exceeded the limit of ${assertion.params.maxMs}ms`,
            details: { maxMs: assertion.params.maxMs, actualMs: response.durationMs },
          };
          break;

        // Custom assertion is a placeholder for now
        case 'custom':
          result.message = 'Custom assertions are not yet supported in this version.';
          break;
      }
    } catch (error: any) {
      logger.error('Error running assertion', { assertion, error: error.message });
      result = {
        assertionId: assertion.id,
        ok: false,
        message: `An error occurred while running the assertion: ${error.message}`,
      };
    }
    results.push(result);
  }

  return results;
}
