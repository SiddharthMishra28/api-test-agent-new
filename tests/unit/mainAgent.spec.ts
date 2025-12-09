import 'mocha';
import { expect } from 'chai';
import nock from 'nock';
import fs from 'fs';
import path from 'path';
import { mainAgent } from '../../src/agents/mainAgent';

describe('mainAgent', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should run a test from a natural language instruction and generate a report', async () => {
    const instruction = 'Generate tests for POST /pets: happy path 201, missing name -> 400';
    const specContent = fs.readFileSync(path.join(__dirname, 'petstore.yaml'), 'utf-8');

    const mockLLMResponse = {
      "id": "tc-123",
      "title": "POST /pets tests",
      "steps": [
        {
          "name": "happy-path create pet",
          "request": { "method": "POST", "url": "https://api.example.com/pets", "body": { "name": "fluffy", "tag": "dog" } },
          "assertions": [{ "type": "status", "params": { "expected": 201 } }]
        },
        {
          "name": "missing-name 400",
          "request": { "method": "POST", "url": "https://api.example.com/pets", "body": { "tag": "dog" } },
          "assertions": [{ "type": "status", "params": { "expected": 400 } }]
        }
      ]
    };

    nock('https://api.openai.com')
      .post('/v1/chat/completions')
      .reply(200, {
        choices: [{ message: { content: JSON.stringify(mockLLMResponse) } }]
      });

    nock('https://api.example.com')
      .post('/pets')
      .reply(201, { id: 123, name: 'Fluffy', tag: 'dog' });

    nock('https://api.example.com')
      .post('/pets')
      .reply(400, { error: 'name is required' });

    const { report, reportPath } = await mainAgent(instruction, specContent);

    expect(report).to.not.be.null;
    expect(report.summary.totalSteps).to.be.greaterThan(0);
    expect(report.summary.passedAssertions).to.be.greaterThan(0);
    expect(reportPath).to.be.a('string').and.include('.html');

    // Clean up the generated report
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
    }
  }).timeout(20000);

  it('should run a test without a spec file', async () => {
    const instruction = 'Generate a test case for a GET request to http://test.com/api/data';

    const mockLLMResponse = {
      "id": "tc-123",
      "title": "GET /api/data test",
      "steps": [
        {
          "name": "GET data",
          "request": { "method": "GET", "url": "http://test.com/api/data" },
          "assertions": [{ "type": "status", "params": { "expected": 200 } }]
        }
      ]
    };

    nock('https://api.openai.com')
      .post('/v1/chat/completions')
      .reply(200, {
        choices: [{ message: { content: JSON.stringify(mockLLMResponse) } }]
      });

    nock('http://test.com')
      .get('/api/data')
      .reply(200, { id: 1, name: 'Test Data' });

    const { report, reportPath } = await mainAgent(instruction);

    expect(report).to.not.be.null;
    expect(report.summary.totalSteps).to.be.greaterThan(0);
    expect(report.summary.passedAssertions).to.be.greaterThan(0);
    expect(reportPath).to.be.a('string').and.include('.html');

    // Clean up the generated report
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
    }
  }).timeout(20000);
});
