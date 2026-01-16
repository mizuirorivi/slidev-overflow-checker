import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { CheckResult } from '../types';

export class JsonReporter {
  /**
   * Output report in JSON format
   */
  async report(result: CheckResult, outputPath: string): Promise<void> {
    try {
      // Create output directory
      await mkdir(dirname(outputPath), { recursive: true });

      // Write to JSON file
      const json = JSON.stringify(result, null, 2);
      await writeFile(outputPath, json, 'utf-8');

      console.log(`JSON report saved to: ${outputPath}`);
    } catch (error) {
      console.error('Error writing JSON report:', error);
      throw error;
    }
  }
}
