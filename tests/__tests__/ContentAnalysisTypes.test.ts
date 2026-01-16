/**
 * Tests for Content Analysis Type Definitions
 * TDD: Write tests first, then implement types
 */
import { describe, it, expect } from 'vitest';
import type {
  ContentAnalysisConfig,
  ContentAnalysisThresholds,
  StyleCalibration,
  TextMeasurement,
  LayoutContentArea,
  SlotInfo,
  ContentNode,
  SlideAnalysis,
  PredictedIssue,
  PredictionAccuracy,
  PresentationMetrics,
  AnalysisModeInfo,
  SlidevConfig,
} from '../../src/types/index.js';

describe('Content Analysis Types', () => {
  describe('ContentAnalysisThresholds', () => {
    it('should define all threshold properties', () => {
      const thresholds: ContentAnalysisThresholds = {
        h1MaxChars: 60,
        h2MaxChars: 80,
        h3MaxChars: 100,
        paragraphMaxChars: 500,
        codeMaxLines: 30,
        tableMaxCols: 5,
        tableMaxRows: 15,
        nestingDepthLimit: 3,
        imageMaxWidth: 1920,
        imageMaxHeight: 1080,
        complexityWeights: {
          textDensity: 0.3,
          codeDensity: 0.4,
          visualElements: 0.2,
          nestingDepth: 0.1,
        },
      };

      expect(thresholds.h1MaxChars).toBe(60);
      expect(thresholds.complexityWeights?.textDensity).toBe(0.3);
    });
  });

  describe('ContentAnalysisConfig', () => {
    it('should define config with optional properties', () => {
      const config: ContentAnalysisConfig = {
        preCheckWarnings: true,
        complexityThreshold: 0.7,
        cacheEnabled: true,
        disableAutoAnalysis: false,
        skipAnalysisForSlides: [1, 2],
        thresholds: {
          h1MaxChars: 60,
        },
      };

      expect(config.preCheckWarnings).toBe(true);
      expect(config.skipAnalysisForSlides).toEqual([1, 2]);
    });
  });

  describe('StyleCalibration', () => {
    it('should define calibration data structure', () => {
      const calibration: StyleCalibration = {
        slideDimensions: {
          canvasWidth: 980,
          canvasHeight: 552,
          aspectRatio: '16/9',
        },
        actualPadding: {
          left: 56,
          right: 56,
          top: 40,
          bottom: 40,
        },
        actualFontSizes: {
          h1: 48,
          h2: 36,
          h3: 28,
          h4: 24,
          paragraph: 17.6,
          code: 14,
          listItem: 17.6,
        },
        actualLineHeights: {
          h1: 1.2,
          h2: 1.3,
          h3: 1.4,
          paragraph: 1.6,
          code: 1.5,
        },
        fontFamilies: {
          sans: 'Roboto, sans-serif',
          mono: 'Fira Code, monospace',
          serif: 'Georgia, serif',
        },
        contentArea: {
          width: 868,
          height: 472,
        },
        calibratedAt: '2026-01-15T10:00:00Z',
        themeUsed: 'default',
        slideUsedForCalibration: 1,
      };

      expect(calibration.slideDimensions.canvasWidth).toBe(980);
      expect(calibration.contentArea.width).toBe(868);
      expect(calibration.actualFontSizes.h1).toBe(48);
    });
  });

  describe('TextMeasurement', () => {
    it('should define text measurement result', () => {
      const measurement: TextMeasurement = {
        text: 'Hello World',
        font: '48px Roboto',
        measuredWidth: 320,
        measuredHeight: 56,
        availableWidth: 868,
        availableHeight: 472,
        willOverflow: false,
        overflowAmount: 0,
        confidence: 'high',
      };

      expect(measurement.willOverflow).toBe(false);
      expect(measurement.confidence).toBe('high');
    });

    it('should indicate overflow when text exceeds available width', () => {
      const measurement: TextMeasurement = {
        text: 'Very long heading that will overflow',
        font: '48px Roboto',
        measuredWidth: 1200,
        measuredHeight: 56,
        availableWidth: 868,
        availableHeight: 472,
        willOverflow: true,
        overflowAmount: 332,
        confidence: 'high',
      };

      expect(measurement.willOverflow).toBe(true);
      expect(measurement.overflowAmount).toBe(332);
    });
  });

  describe('LayoutContentArea', () => {
    it('should define layout with slots', () => {
      const layout: LayoutContentArea = {
        layout: 'two-cols',
        slots: [
          {
            name: 'left',
            width: 426,
            height: 472,
            position: 'left',
          },
          {
            name: 'right',
            width: 426,
            height: 472,
            position: 'right',
          },
        ],
        totalAvailableArea: 426 * 472 * 2,
      };

      expect(layout.slots).toHaveLength(2);
      expect(layout.slots[0].position).toBe('left');
    });
  });

  describe('SlotInfo', () => {
    it('should define slot dimensions', () => {
      const slot: SlotInfo = {
        name: 'default',
        width: 868,
        height: 472,
        position: 'full',
      };

      expect(slot.position).toBe('full');
    });
  });

  describe('ContentNode', () => {
    it('should define hierarchical content structure', () => {
      const node: ContentNode = {
        type: 'heading',
        level: 1,
        lineStart: 5,
        lineEnd: 5,
        slideIndex: 0,
        content: '# Welcome',
        text: 'Welcome',
        charCount: 7,
        metadata: {
          level: 1,
        },
        children: [],
      };

      expect(node.type).toBe('heading');
      expect(node.charCount).toBe(7);
    });

    it('should support nested children', () => {
      const list: ContentNode = {
        type: 'list',
        lineStart: 10,
        lineEnd: 15,
        slideIndex: 1,
        content: '- Item 1\n  - Subitem',
        metadata: {
          ordered: false,
          depth: 0,
        },
        children: [
          {
            type: 'list-item',
            lineStart: 10,
            lineEnd: 10,
            slideIndex: 1,
            content: '- Item 1',
            text: 'Item 1',
            metadata: {},
            children: [
              {
                type: 'list-item',
                lineStart: 11,
                lineEnd: 11,
                slideIndex: 1,
                content: '  - Subitem',
                text: 'Subitem',
                metadata: { depth: 1 },
              },
            ],
          },
        ],
      };

      expect(list.children).toHaveLength(1);
      expect(list.children![0].children).toHaveLength(1);
    });
  });

  describe('PredictedIssue', () => {
    it('should define predicted overflow issue', () => {
      const prediction: PredictedIssue = {
        type: 'text-overflow',
        element: 'H1 heading',
        slideIndex: 5,
        riskLevel: 'high',
        lineRange: { start: 46, end: 46 },
        recommendation: 'Shorten heading to <60 characters',
        confirmed: false,
        confidence: 'high',
        measuredValue: 1200,
        thresholdValue: 868,
      };

      expect(prediction.riskLevel).toBe('high');
      expect(prediction.confirmed).toBe(false);
    });
  });

  describe('PredictionAccuracy', () => {
    it('should track prediction accuracy metrics', () => {
      const accuracy: PredictionAccuracy = {
        predicted: 5,
        confirmed: 4,
        falsePositives: 1,
        falseNegatives: 1,
        precision: 0.8,
        recall: 0.8,
      };

      expect(accuracy.precision).toBe(0.8);
      expect(accuracy.recall).toBe(0.8);
    });
  });

  describe('SlideAnalysis', () => {
    it('should define per-slide analysis result', () => {
      const analysis: SlideAnalysis = {
        slideIndex: 5,
        layout: 'default',
        complexity: 0.78,
        riskLevel: 'high',
        contentArea: {
          width: 868,
          height: 472,
        },
        metrics: {
          characterCount: 1850,
          wordCount: 310,
          elementCounts: {
            headings: 1,
            lists: 0,
            codeBlocks: 1,
            images: 0,
            tables: 0,
          },
        },
        predictedIssues: [],
        recommendations: ['Shorten H1 heading'],
        skipped: false,
      };

      expect(analysis.complexity).toBe(0.78);
      expect(analysis.riskLevel).toBe('high');
    });
  });

  describe('PresentationMetrics', () => {
    it('should define presentation-wide metrics', () => {
      const metrics: PresentationMetrics = {
        totalSlides: 20,
        averageComplexity: 0.52,
        highRiskSlideCount: 3,
        mediumRiskSlideCount: 10,
        lowRiskSlideCount: 7,
        mostComplexSlide: 5,
        contentDistribution: {
          textHeavy: 8,
          codeHeavy: 6,
          balanced: 6,
        },
      };

      expect(metrics.totalSlides).toBe(20);
      expect(metrics.averageComplexity).toBe(0.52);
    });
  });

  describe('AnalysisModeInfo', () => {
    it('should define slides-file mode capabilities', () => {
      const mode: AnalysisModeInfo = {
        type: 'slides-file',
        capabilities: {
          markdownParsing: true,
          assetSizeDetection: false,
          configFileAccess: false,
          themeAnalysis: false,
          accuracyLevel: 'basic',
        },
      };

      expect(mode.type).toBe('slides-file');
      expect(mode.capabilities.assetSizeDetection).toBe(false);
    });

    it('should define project-directory mode capabilities', () => {
      const mode: AnalysisModeInfo = {
        type: 'project-directory',
        capabilities: {
          markdownParsing: true,
          assetSizeDetection: true,
          configFileAccess: true,
          themeAnalysis: true,
          accuracyLevel: 'detailed',
        },
      };

      expect(mode.type).toBe('project-directory');
      expect(mode.capabilities.assetSizeDetection).toBe(true);
    });
  });

  describe('SlidevConfig', () => {
    it('should define Slidev configuration structure', () => {
      const config: SlidevConfig = {
        theme: 'default',
        canvasWidth: 980,
        aspectRatio: '16/9',
        fonts: {
          sans: 'Roboto',
          serif: 'Georgia',
          mono: 'Fira Code',
        },
        overflowChecker: {
          thresholds: {
            h1MaxChars: 50,
          },
        },
      };

      expect(config.canvasWidth).toBe(980);
      expect(config.fonts?.sans).toBe('Roboto');
    });
  });
});
