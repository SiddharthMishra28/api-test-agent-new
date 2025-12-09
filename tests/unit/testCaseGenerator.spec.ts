import 'mocha';
import { expect } from 'chai';
import nock from 'nock';
import { TestCaseGenerator } from '../../src/tools/testCaseGenerator';
import { OpenApiParser } from '../../src/tools/openApiParser';

describe('TestCaseGenerator', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should generate a test case from a natural language instruction', async () => {
    const mockLLMResponse = {
      "id": "tc-123",
      "title": "POST /pets tests",
      "steps": [
        {
          "name": "happy-path create pet",
          "request": { "method": "POST", "url": "https://api.example.com/pets" },
          "assertions": [{ "type": "status", "params": { "expected": 201 } }]
        }
      ]
    };

    nock('https://api.openai.com')
      .post('/v1/chat/completions')
      .reply(200, {
        choices: [{ message: { content: JSON.stringify(mockLLMResponse) } }]
      });

    const parser = new OpenApiParser();
    const generator = new TestCaseGenerator(parser);
    const instruction = 'Generate tests for POST /pets: happy path 201, missing name -> 400';

    const testCase = await generator.generateTestCase(instruction);

    expect(testCase).to.have.property('id');
    expect(testCase).to.have.property('title');
    expect(testCase.steps).to.be.an('array');
    expect(testCase.steps[0].assertions).to.be.an('array');
  }).timeout(20000);
});
