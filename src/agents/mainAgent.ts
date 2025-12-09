import { executeRequest } from '../tools/httpExecutor';
import { runAssertions } from '../tools/assertionEngine';
import { Reporter } from '../tools/reporter';
import { TestCaseGenerator } from '../tools/testCaseGenerator';
import { OpenApiParser } from '../tools/openApiParser';
import { TestCase, TestStep } from '../utils/types';
import { logger } from '../utils/logger';

// This is a simplified, high-level agent that orchestrates the entire process.
// In a more complex scenario, this could be broken down into sub-agents.

async function mainAgent(instruction: string, specContent?: string) {
  logger.info('Main agent started', { instruction });

  let openApiParser: OpenApiParser | undefined;
  if (specContent) {
    openApiParser = new OpenApiParser();
    await openApiParser.parse(specContent);
  }

  const testCaseGenerator = new TestCaseGenerator(openApiParser);
  const testCase = await testCaseGenerator.generateTestCase(instruction);

  const reporter = new Reporter();

  for (const step of testCase.steps) {
    logger.info(`Executing step: ${step.name}`);

    const { response, durationMs, error } = await executeRequest(step.request);

    if (error) {
      reporter.addStepResult({
        stepId: step.id,
        timestamp: new Date().toISOString(),
        request: step.request,
        error: typeof error === 'string' ? error : JSON.stringify(error),
        assertionResults: [],
      });
      if (!testCase.meta?.allowContinueOnFailure) {
        logger.warn('Aborting test run due to a failed step.');
        break;
      }
      continue;
    }

    const stepResponse = response ? {
      ...response,
      headers: response.headers as Record<string, string>,
      durationMs,
    } : undefined;


    const assertionResults = await runAssertions(stepResponse!, step.assertions);

    reporter.addStepResult({
      stepId: step.id,
      timestamp: new Date().toISOString(),
      request: step.request,
      response: stepResponse,
      assertionResults,
    });
  }

  const report = reporter.finalize(testCase);
  const reportHtml = await reporter.renderHtml(report);
  const reportPath = reporter.saveReport(reportHtml);

  logger.info('Main agent finished', { reportPath });
  return { report, reportPath };
}

export { mainAgent };
