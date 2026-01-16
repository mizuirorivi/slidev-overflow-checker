import { writeFile, mkdir, readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { CheckResult } from '../types';
import { fileURLToPath } from 'url';
import { dirname as pathDirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);

export class HtmlReporter {
  /**
   * Output report in HTML format
   */
  async report(result: CheckResult, outputPath: string): Promise<void> {
    try {
      // Create output directory
      await mkdir(dirname(outputPath), { recursive: true });

      // Load template
      const templatePath = join(__dirname, '..', '..', 'templates', 'report.html');
      let template = await readFile(templatePath, 'utf-8');

      // Prepare data
      const data = this.prepareData(result);

      // Replace template
      template = this.renderTemplate(template, data);

      // Write to HTML file
      await writeFile(outputPath, template, 'utf-8');

      console.log(`HTML report saved to: ${outputPath}`);
    } catch (error) {
      console.error('Error writing HTML report:', error);
      throw error;
    }
  }

  /**
   * Prepare data
   */
  private prepareData(result: CheckResult): any {
    const issuesClass =
      result.issuesFound === 0 ? 'success' : result.issuesFound > 5 ? 'error' : 'warning';

    const slides = result.slides.map(slide => ({
      ...slide,
      multiple: slide.issueCount > 1,
      issues: slide.issues.map(issue => ({
        ...issue,
        typeMessage: this.getTypeMessage(issue.type),
      })),
    }));

    return {
      timestamp: new Date(result.timestamp).toLocaleString(),
      totalSlides: result.totalSlides,
      slidesWithIssuesCount: result.slidesWithIssues.length,
      issuesFound: result.issuesFound,
      issuesClass,
      hasIssues: result.issuesFound > 0,
      slides,
    };
  }

  /**
   * Simple template rendering
   */
  private renderTemplate(template: string, data: any): string {
    let result = template;

    // Simple variable replacement {{variable}}
    result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });

    // Process if statement {{#if condition}}...{{else}}...{{/if}}
    result = result.replace(
      /\{\{#if (\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
      (_match, condition, trueBranch, falseBranch) => {
        return data[condition] ? trueBranch : falseBranch || '';
      }
    );

    // Process each statement {{#each array}}...{{/each}}
    result = result.replace(
      /\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (_match, arrayName, itemTemplate) => {
        const array = data[arrayName];
        if (!Array.isArray(array)) return '';

        return array
          .map(item => {
            return this.renderTemplate(itemTemplate, item);
          })
          .join('');
      }
    );

    return result;
  }

  /**
   * Get issue type message
   */
  private getTypeMessage(type: string): string {
    switch (type) {
      case 'text-overflow':
        return 'Text Overflow Detected';
      case 'element-overflow':
        return 'Element Overflow Detected';
      case 'scrollbar':
        return 'Scrollbar Detected';
      default:
        return 'Unknown Issue';
    }
  }
}
