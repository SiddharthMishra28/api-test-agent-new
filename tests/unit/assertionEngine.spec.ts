import 'mocha';
import { expect } from 'chai';
import { runAssertions } from '../../src/tools/assertionEngine';
import { Assertion, StepResult } from '../../src/utils/types';

describe('assertionEngine', () => {
  const mockResponse: NonNullable<StepResult['response']> = {
    status: 200,
    headers: { 'content-type': 'application/json', 'x-request-id': '123' },
    body: {
      id: 1,
      name: 'Test Item',
      tags: ['a', 'b'],
    },
    durationMs: 150,
  };

  it('should validate status code correctly', async () => {
    const assertions: Assertion[] = [
      { id: 'a1', type: 'status', params: { expected: 200 } },
      { id: 'a2', type: 'status', params: { expected: 404 } },
    ];
    const results = await runAssertions(mockResponse, assertions);
    expect(results).to.have.lengthOf(2);
    expect(results[0].ok).to.be.true;
    expect(results[1].ok).to.be.false;
  });

  it('should validate JSON schema correctly', async () => {
    const assertions: Assertion[] = [
      {
        id: 'a1',
        type: 'jsonSchema',
        params: {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
            },
            required: ['id', 'name'],
          },
        },
      },
      {
        id: 'a2',
        type: 'jsonSchema',
        params: {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      },
    ];
    const results = await runAssertions(mockResponse, assertions);
    expect(results).to.have.lengthOf(2);
    expect(results[0].ok).to.be.true;
    expect(results[1].ok).to.be.false;
  });

  it('should validate jsonPath expressions correctly', async () => {
    const assertions: Assertion[] = [
      { id: 'a1', type: 'jsonPath', params: { path: '$.id', operator: 'exists' } },
      { id: 'a2', type: 'jsonPath', params: { path: '$.id', operator: 'equals', expected: 1 } },
      { id: 'a3', type: 'jsonPath', params: { path: '$.name', operator: 'contains', expected: 'Item' } },
      { id: 'a4', type: 'jsonPath', params: { path: '$.tags', operator: 'length', expected: 2 } },
      { id: 'a5', type: 'jsonPath', params: { path: '$.nonexistent', operator: 'exists' } },

    ];
    const results = await runAssertions(mockResponse, assertions);
    expect(results).to.have.lengthOf(5);
    expect(results[0].ok).to.be.true;
    expect(results[1].ok).to.be.true;
    expect(results[2].ok).to.be.true;
    expect(results[3].ok).to.be.true;
    expect(results[4].ok).to.be.false;
  });

  it('should validate headers correctly', async () => {
    const assertions: Assertion[] = [
      { id: 'a1', type: 'header', params: { name: 'content-type', expected: 'application/json' } },
      { id: 'a2', type: 'header', params: { name: 'x-request-id', expected: '456' } },
    ];
    const results = await runAssertions(mockResponse, assertions);
    expect(results).to.have.lengthOf(2);
    expect(results[0].ok).to.be.true;
    expect(results[1].ok).to.be.false;
  });

  it('should validate regex on body correctly', async () => {
    const assertions: Assertion[] = [
      { id: 'a1', type: 'regex', params: { target: 'body', pattern: 'Test Item' } },
      { id: 'a2', type: 'regex', params: { target: 'body', pattern: 'Nonexistent' } },
    ];
    const results = await runAssertions(mockResponse, assertions);
    expect(results).to.have.lengthOf(2);
    expect(results[0].ok).to.be.true;
    expect(results[1].ok).to.be.false;
  });

  it('should validate response time correctly', async () => {
    const assertions: Assertion[] = [
      { id: 'a1', type: 'responseTime', params: { maxMs: 200 } },
      { id: 'a2', type: 'responseTime', params: { maxMs: 100 } },
    ];
    const results = await runAssertions(mockResponse, assertions);
    expect(results).to.have.lengthOf(2);
    expect(results[0].ok).to.be.true;
    expect(results[1].ok).to.be.false;
  });

  it('should handle errors in assertions gracefully', async () => {
    const assertions: Assertion[] = [
        { id: 'a1', type: 'jsonPath', params: { path: '$.id', operator: 'invalidOperator' } }
    ];
    const results = await runAssertions(mockResponse, assertions);
    expect(results).to.have.lengthOf(1);
    expect(results[0].ok).to.be.false;
    expect(results[0].message).to.include('Unsupported jsonPath operator');
  });
});
