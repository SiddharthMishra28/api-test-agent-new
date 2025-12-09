import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StepResult, TestCase, TestReport } from '../utils/types';
import { logger } from '../utils/logger';

export class Reporter {
  private stepResults: StepResult[] = [];
  private startTime: string;

  constructor() {
    this.startTime = new Date().toISOString();
  }

  public addStepResult(stepResult: StepResult) {
    this.stepResults.push(stepResult);
  }

  public finalize(testCase: TestCase): TestReport {
    const passedAssertions = this.stepResults.reduce(
      (acc, result) => acc + result.assertionResults.filter((ar) => ar.ok).length,
      0
    );
    const totalAssertions = this.stepResults.reduce(
      (acc, result) => acc + result.assertionResults.length,
      0
    );
    const failedAssertions = totalAssertions - passedAssertions;

    let status: 'PASSED' | 'FAILED' | 'PARTIAL' = 'PASSED';
    if (failedAssertions > 0) {
      status = passedAssertions > 0 ? 'PARTIAL' : 'FAILED';
    }

    const report: TestReport = {
      testCase,
      startTime: this.startTime,
      endTime: new Date().toISOString(),
      stepResults: this.stepResults,
      summary: {
        totalSteps: this.stepResults.length,
        passedAssertions,
        failedAssertions,
        status,
      },
    };

    return report;
  }

  public async renderHtml(report: TestReport): Promise<string> {
    try {
      const templatePath = path.join(__dirname, '../../templates/report.ejs');
      const template = fs.readFileSync(templatePath, 'utf-8');
      return ejs.render(template, { report });
    } catch (error: any) {
      logger.error('Error rendering HTML report', { error: error.message });
      throw new Error('Could not render HTML report');
    }
  }

  public saveReport(html: string): string {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    const reportId = uuidv4();
    const reportPath = path.join(reportsDir, `${reportId}-report.html`);
    fs.writeFileSync(reportPath, html);
    logger.info(`Report saved to ${reportPath}`);
    return reportPath;
  }
}
