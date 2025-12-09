export type HttpMethod = 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'HEAD'|'OPTIONS';

export interface TestStep {
  id: string;
  name: string;
  description?: string;
  request: {
    method: HttpMethod;
    url: string;
    headers?: Record<string,string>;
    query?: Record<string,string>;
    body?: any;
    timeoutMs?: number;
  };
  assertions: Assertion[];
  meta?: any;
}

export interface Assertion {
  id: string;
  type: 'status'|'jsonSchema'|'jsonPath'|'header'|'regex'|'responseTime'|'custom';
  params: any; // e.g., { expected: 200 } or { path: "$.data.id", operator: "exists" }
}

export interface TestCase {
  id: string;
  title: string;
  description?: string;
  steps: TestStep[];
  tags?: string[];
  createdBy?: string;
  meta?: any;
}

export interface StepResult {
  stepId: string;
  timestamp: string;
  request: {
    url: string;
    method: HttpMethod;
    headers?: Record<string,string>;
    body?: any;
  };
  response?: {
    status: number;
    headers?: Record<string,string>;
    body?: any;
    durationMs?: number;
  };
  assertionResults: AssertionResult[];
  error?: string;
}

export interface AssertionResult {
  assertionId: string;
  ok: boolean;
  message?: string;
  details?: any;
}

export interface TestReport {
  testCase: TestCase;
  startTime: string;
  endTime?: string;
  stepResults: StepResult[];
  summary: {
    totalSteps: number;
    passedAssertions: number;
    failedAssertions: number;
    status: 'PASSED'|'FAILED'|'PARTIAL';
  };
}
