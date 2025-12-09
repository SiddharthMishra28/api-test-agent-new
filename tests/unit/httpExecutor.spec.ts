import 'mocha';
import { expect } from 'chai';
import nock from 'nock';
import { executeRequest } from '../../src/tools/httpExecutor';
import { TestStep } from '../../src/utils/types';

describe('httpExecutor', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should execute a successful GET request and return the response', async () => {
    const requestSpec: TestStep['request'] = {
      method: 'GET',
      url: 'http://test.com/api/data',
      headers: { 'Accept': 'application/json' },
    };

    const mockResponse = { id: 1, name: 'Test Data' };

    nock('http://test.com')
      .get('/api/data')
      .reply(200, mockResponse, { 'Content-Type': 'application/json' });

    const result = await executeRequest(requestSpec);

    expect(result.error).to.be.undefined;
    expect(result.response).to.not.be.undefined;
    expect(result.response?.status).to.equal(200);
    expect(result.response?.body).to.deep.equal(mockResponse);
    expect(result.durationMs).to.be.a('number');
  });

  it('should handle a 400 Bad Request response', async () => {
    const requestSpec: TestStep['request'] = {
      method: 'POST',
      url: 'http://test.com/api/data',
      body: { name: '' }, // Invalid data
    };

    const mockErrorResponse = { error: 'Name is required' };

    nock('http://test.com')
      .post('/api/data')
      .reply(400, mockErrorResponse);

    const result = await executeRequest(requestSpec);

    expect(result.error).to.be.undefined; // The request itself did not fail
    expect(result.response).to.not.be.undefined;
    expect(result.response?.status).to.equal(400);
    expect(result.response?.body).to.deep.equal(mockErrorResponse);
    expect(result.durationMs).to.be.a('number');
  });

  it('should handle a network error', async () => {
    const requestSpec: TestStep['request'] = {
      method: 'GET',
      url: 'http://test.com/api/data',
    };

    nock('http://test.com')
      .get('/api/data')
      .times(3)
      .replyWithError('Network error');

    const result = await executeRequest(requestSpec);

    expect(result.response).to.be.undefined;
    expect(result.error).to.not.be.undefined;
    expect(result.error).to.be.an('object');
    expect(result.error.message).to.equal('Network error');
    expect(result.durationMs).to.be.a('number');
  }).timeout(10000);

  it('should retry a failed request and eventually succeed', async () => {
    const requestSpec: TestStep['request'] = {
        method: 'GET',
        url: 'http://test.com/api/data',
    };

    // Fail the first two times, then succeed
    nock('http://test.com')
        .get('/api/data')
        .replyWithError('Network error');
    nock('http://test.com')
        .get('/api/data')
        .replyWithError('Network error');
    nock('http://test.com')
        .get('/api/data')
        .reply(200, { id: 1, name: 'Test Data' });

    const result = await executeRequest(requestSpec);

    expect(result.error).to.be.undefined;
    expect(result.response).to.not.be.undefined;
    expect(result.response?.status).to.equal(200);
    expect(result.response?.body).to.deep.equal({ id: 1, name: 'Test Data' });
  }).timeout(10000);
});
