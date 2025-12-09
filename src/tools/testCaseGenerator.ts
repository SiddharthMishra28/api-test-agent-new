import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { TestCase } from '../utils/types';
import { OpenApiParser } from './openApiParser';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function callLLM(instruction: string, openApiPath?: any): Promise<any> {
  logger.info('Calling OpenAI GPT to generate test case', { instruction, openApiPath });

  const prompt = `
    You are nl2test — convert a natural language test instruction into a JSON TestCase (schema provided).
    DO NOT output ANY extra text. If you cannot determine values, set placeholders with "<REQUIRED>".
    Validate the output conforms to the schema.

    Input variables:
    - instruction (string): user's natural language instruction.
    - openApiPath (optional): the matching OpenAPI path and method metadata if available.

    Output example:
    {
      "id": "tc-001",
      "title": "Create pet happy path",
      "description": "POST /pets returns 201 with id",
      "steps": [
        {
          "id": "step-1",
          "name": "Create pet",
          "request": {
            "method": "POST",
            "url": "https://api.example.com/pets",
            "headers": { "Content-Type": "application/json" },
            "body": { "name": "fluffy", "tag": "dog" }
          },
          "assertions": [
            { "id": "a1", "type": "status", "params": { "expected": 201 } },
            { "id": "a2", "type": "jsonPath", "params": { "path": "$.id", "operator": "exists" } }
          ]
        }
      ]
    }

    Instruction: "${instruction}"
    ${openApiPath ? `OpenAPI Path: ${JSON.stringify(openApiPath)}` : ''}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content in LLM response');
    }
    return JSON.parse(content);
  } catch (error: any) {
    logger.error('Error calling OpenAI GPT', { error: error.message });
    throw new Error('Failed to generate test case from LLM');
  }
}

export class TestCaseGenerator {
  private openApiParser?: OpenApiParser;

  constructor(openApiParser?: OpenApiParser) {
    this.openApiParser = openApiParser;
  }

  public async generateTestCase(instruction: string): Promise<TestCase> {
    try {
      const testCaseSkeleton = await callLLM(instruction);
      const enrichedTestCase = this.enrichTestCase(testCaseSkeleton);

      logger.info('Test case generated successfully', { testCase: enrichedTestCase });
      return enrichedTestCase;
    } catch (error: any) {
      logger.error('Failed to generate test case', { error: error.message });
      throw new Error('Could not generate test case from instruction');
    }
  }

  private enrichTestCase(testCase: any): TestCase {
    // Add unique IDs to steps and assertions
    if(testCase.steps){
        for(const step of testCase.steps){
            step.id = `s-${uuidv4()}`;
            if(step.assertions){
                for(const assertion of step.assertions){
                    assertion.id = `a-${uuidv4()}`;
                }
            }
        }
    }
    return testCase as TestCase;
  }
}
