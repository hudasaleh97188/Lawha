import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface TestRecord {
  spec: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  screenshotPath?: string;
  tracePath?: string;
  error?: string;
  failingStep?: string;
  stdout: string[];
  stderr: string[];
}

class MarkdownReporter implements Reporter {
  private records: TestRecord[] = [];
  private outputDir = 'test-results';
  private startTime = Date.now();
  private config!: FullConfig;

  onBegin(config: FullConfig, _suite: Suite) {
    this.config = config;
    this.outputDir = config.projects[0]?.outputDir || 'test-results';
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const spec = path.relative(
      path.join(process.cwd(), 'tests', 'specs'),
      test.location.file
    );

    let screenshotPath: string | undefined;
    let tracePath: string | undefined;

    for (const attachment of result.attachments) {
      if (attachment.name === 'screenshot' && attachment.path) {
        screenshotPath = path.relative(process.cwd(), attachment.path);
      }
      if (attachment.name === 'trace' && attachment.path) {
        tracePath = path.relative(process.cwd(), attachment.path);
      }
    }

    const failingStep = result.steps
      .filter(s => s.error)
      .map(s => s.title)
      .pop();

    const stdout = result.stdout.map(b => (typeof b === 'string' ? b : b.toString()));
    const stderr = result.stderr.map(b => (typeof b === 'string' ? b : b.toString()));

    this.records.push({
      spec,
      title: test.title,
      status: result.status as TestRecord['status'],
      duration: result.duration,
      screenshotPath,
      tracePath,
      error: result.error?.message,
      failingStep,
      stdout,
      stderr,
    });
  }

  onEnd(_result: FullResult) {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const passed = this.records.filter(r => r.status === 'passed').length;
    const failed = this.records.filter(r => r.status === 'failed' || r.status === 'timedOut').length;
    const skipped = this.records.filter(r => r.status === 'skipped').length;
    const total = this.records.length;
    const totalMs = Date.now() - this.startTime;

    let gitSha = 'n/a';
    try {
      const { execSync } = require('child_process');
      gitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      // git not available
    }

    // Read perf data if exists
    let perfSection = '';
    const perfFile = path.join(this.outputDir, 'perf.json');
    if (fs.existsSync(perfFile)) {
      try {
        const perfEntries: Array<{ label: string; duration: number }> = JSON.parse(
          fs.readFileSync(perfFile, 'utf8')
        );
        const sorted = [...perfEntries].sort((a, b) => b.duration - a.duration).slice(0, 10);
        const slowNavs = perfEntries.filter(e => e.label.startsWith('goto:') && e.duration > 3000);
        const slowActions = perfEntries.filter(e => !e.label.startsWith('goto:') && e.duration > 1000);

        perfSection = `\n## Performance\n\n`;
        if (slowNavs.length > 0) {
          perfSection += `### Slow Navigations (> 3s)\n`;
          slowNavs.forEach((e, i) => { perfSection += `${i + 1}. ${e.label} — ${e.duration}ms\n`; });
          perfSection += '\n';
        }
        if (slowActions.length > 0) {
          perfSection += `### Slow Actions (> 1s)\n`;
          slowActions.forEach((e, i) => { perfSection += `${i + 1}. ${e.label} — ${e.duration}ms\n`; });
          perfSection += '\n';
        }
        perfSection += `### Slowest 10 Operations\n`;
        sorted.forEach((e, i) => { perfSection += `${i + 1}. ${e.label} — ${e.duration}ms\n`; });

        const warnings = [
          ...slowNavs.map(e => `Navigation "${e.label}": ${e.duration}ms exceeds 3s threshold`),
          ...slowActions.map(e => `Action "${e.label}": ${e.duration}ms exceeds 1s threshold`),
        ];
        if (warnings.length > 0) {
          perfSection += `\n### Warnings\n`;
          warnings.forEach(w => { perfSection += `- ${w}\n`; });
        }
      } catch {
        perfSection = '\n## Performance\n\nPerf data unavailable.\n';
      }
    }

    // Build tests table
    const tableRows = this.records.map(r => {
      const statusEmoji = r.status === 'passed' ? '✅' : r.status === 'skipped' ? '⏭' : '❌';
      const dur = `${(r.duration / 1000).toFixed(1)}s`;
      const ss = r.screenshotPath ? `![](${r.screenshotPath})` : '—';
      const tr = r.tracePath ? `[trace](${r.tracePath})` : '—';
      return `| ${r.spec} | ${r.title} | ${statusEmoji} | ${dur} | ${ss} | ${tr} |`;
    }).join('\n');

    // Failures section
    let failuresSection = '';
    const failures = this.records.filter(r => r.status === 'failed' || r.status === 'timedOut');
    if (failures.length > 0) {
      failuresSection = '\n## Failures\n';
      for (const f of failures) {
        failuresSection += `\n### ${f.spec} › ${f.title}\n`;
        if (f.error) {
          failuresSection += `- **Error:** ${f.error.split('\n')[0]}\n`;
        }
        if (f.failingStep) {
          failuresSection += `- **Failing step:** ${f.failingStep}\n`;
        }
        if (f.stderr.length > 0) {
          const excerpt = f.stderr.slice(-10).join('').trim();
          if (excerpt) failuresSection += `- **Console excerpt:**\n\`\`\`\n${excerpt.slice(0, 800)}\n\`\`\`\n`;
        }
        failuresSection += `- **Hypothesis:** Review screenshot and trace for root cause.\n`;
        if (f.tracePath) {
          failuresSection += `- **Trace:** \`${f.tracePath}\`\n`;
        }
      }
    }

    const isoDate = new Date().toISOString().split('T')[0];
    const headedMode = process.env.HEADED === '1' ? 'yes' : 'no';

    const md = `# UI Test Report — ${isoDate}

## Run Metadata
- **Browser(s):** Chromium
- **Headed:** ${headedMode}
- **Base URL:** http://localhost:5173
- **Git SHA:** ${gitSha}
- **Total:** ${total} | **Passed:** ${passed} | **Failed:** ${failed} | **Skipped:** ${skipped}
- **Total duration:** ${(totalMs / 1000).toFixed(1)}s

## Tests
| Spec | Test | Status | Duration | Screenshot | Trace |
| ---- | ---- | ------ | -------- | ---------- | ----- |
${tableRows}
${failuresSection}${perfSection}`;

    const reportPath = path.join(this.outputDir, 'REPORT.md');
    fs.writeFileSync(reportPath, md, 'utf8');
    console.log(`\nMarkdown report: ${reportPath}`);
  }
}

export default MarkdownReporter;
