/**
 * Tests for TextPredictor
 * TDD: Text measurement using Canvas.measureText() simulation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TextPredictor, createDefaultCalibration } from '../../src/calibration/TextPredictor.js';
import type { StyleCalibration } from '../../src/types/index.js';

describe('TextPredictor', () => {
  let predictor: TextPredictor;
  let calibration: StyleCalibration;

  beforeEach(() => {
    calibration = createDefaultCalibration();
    predictor = new TextPredictor(calibration);
  });

  describe('createDefaultCalibration', () => {
    it('should create calibration with default values', () => {
      const cal = createDefaultCalibration();
      expect(cal.slideDimensions.canvasWidth).toBe(980);
      expect(cal.slideDimensions.canvasHeight).toBe(552);
      expect(cal.actualPadding.left).toBe(56);
      expect(cal.contentArea.width).toBe(868);
      expect(cal.actualFontSizes.h1).toBe(48);
    });

    it('should accept custom canvas dimensions', () => {
      const cal = createDefaultCalibration(1200, 675);
      expect(cal.slideDimensions.canvasWidth).toBe(1200);
      expect(cal.slideDimensions.canvasHeight).toBe(675);
      expect(cal.contentArea.width).toBe(1088); // 1200 - 56 - 56
    });
  });

  describe('constructor', () => {
    it('should store calibration data', () => {
      expect(predictor.getCalibration()).toEqual(calibration);
    });
  });

  describe('measureText', () => {
    it('should return TextMeasurement object', () => {
      const result = predictor.measureText('Hello', 'h1');
      expect(result).toHaveProperty('text', 'Hello');
      expect(result).toHaveProperty('font');
      expect(result).toHaveProperty('measuredWidth');
      expect(result).toHaveProperty('measuredHeight');
      expect(result).toHaveProperty('availableWidth');
      expect(result).toHaveProperty('willOverflow');
      expect(result).toHaveProperty('overflowAmount');
      expect(result).toHaveProperty('confidence');
    });

    it('should indicate no overflow for short text', () => {
      const result = predictor.measureText('Hi', 'h1');
      expect(result.willOverflow).toBe(false);
      expect(result.overflowAmount).toBe(0);
    });

    it('should use calibrated font size for h1', () => {
      const result = predictor.measureText('Test', 'h1');
      expect(result.font).toContain('48');
    });

    it('should use calibrated font size for h2', () => {
      const result = predictor.measureText('Test', 'h2');
      expect(result.font).toContain('36');
    });

    it('should use calibrated font size for paragraph', () => {
      const result = predictor.measureText('Test', 'paragraph');
      expect(result.font).toContain('17.6');
    });

    it('should use calibrated font size for code', () => {
      const result = predictor.measureText('Test', 'code');
      expect(result.font).toContain('14');
    });

    it('should return available width from content area', () => {
      const result = predictor.measureText('Test', 'h1');
      expect(result.availableWidth).toBe(868);
    });
  });

  describe('estimateTextWidth', () => {
    it('should estimate width based on character count and font size', () => {
      // Using approximate character width of 0.6 * fontSize
      const width = predictor.estimateTextWidth('Hello', 48);
      // 5 chars * 48 * 0.6 = 144 (approximately)
      expect(width).toBeGreaterThan(100);
      expect(width).toBeLessThan(200);
    });

    it('should scale with text length', () => {
      const shortWidth = predictor.estimateTextWidth('Hi', 48);
      const longWidth = predictor.estimateTextWidth('Hello World', 48);
      expect(longWidth).toBeGreaterThan(shortWidth);
    });

    it('should scale with font size', () => {
      const smallFont = predictor.estimateTextWidth('Test', 14);
      const largeFont = predictor.estimateTextWidth('Test', 48);
      expect(largeFont).toBeGreaterThan(smallFont);
    });
  });

  describe('willTextOverflow', () => {
    it('should return false for short text', () => {
      expect(predictor.willTextOverflow('Short', 'h1')).toBe(false);
    });

    it('should return true for very long text', () => {
      const longText = 'A'.repeat(100);
      expect(predictor.willTextOverflow(longText, 'h1')).toBe(true);
    });
  });

  describe('getOverflowAmount', () => {
    it('should return 0 for short text', () => {
      expect(predictor.getOverflowAmount('Short', 'h1')).toBe(0);
    });

    it('should return positive value for overflowing text', () => {
      const longText = 'A'.repeat(100);
      expect(predictor.getOverflowAmount(longText, 'h1')).toBeGreaterThan(0);
    });
  });

  describe('measureTextForLayout', () => {
    it('should adjust available width based on layout', () => {
      const defaultResult = predictor.measureTextForLayout('Test', 'h1', 'default');
      const twocolsResult = predictor.measureTextForLayout('Test', 'h1', 'two-cols');

      // two-cols has narrower content area
      expect(twocolsResult.availableWidth).toBeLessThan(defaultResult.availableWidth);
    });

    it('should use full width for full layout', () => {
      const result = predictor.measureTextForLayout('Test', 'h1', 'full');
      expect(result.availableWidth).toBe(980);
    });
  });

  describe('confidence levels', () => {
    it('should return medium confidence for estimations', () => {
      const result = predictor.measureText('Test', 'h1');
      // Without actual font loading, confidence should be medium
      expect(result.confidence).toBe('medium');
    });
  });

  describe('predictHeadingOverflow', () => {
    it('should predict overflow based on character threshold', () => {
      // Default h1MaxChars is 60
      const shortHeading = 'Short heading';
      const longHeading = 'This is a very long heading that will definitely exceed the character limit for h1';

      expect(predictor.predictHeadingOverflow(shortHeading, 1)).toBe(false);
      expect(predictor.predictHeadingOverflow(longHeading, 1)).toBe(true);
    });

    it('should use appropriate threshold for heading level', () => {
      // h2 has higher threshold (80 chars)
      const text60 = 'A'.repeat(60);
      const text70 = 'A'.repeat(70);

      expect(predictor.predictHeadingOverflow(text60, 1)).toBe(false); // Under h1 threshold
      expect(predictor.predictHeadingOverflow(text70, 2)).toBe(false); // Under h2 threshold
    });
  });

  describe('predictCodeBlockOverflow', () => {
    it('should predict overflow based on line count', () => {
      // Default codeMaxLines is 30
      const shortCode = 'line\n'.repeat(20);
      const longCode = 'line\n'.repeat(50);

      expect(predictor.predictCodeBlockOverflow(shortCode)).toBe(false);
      expect(predictor.predictCodeBlockOverflow(longCode)).toBe(true);
    });
  });

  describe('with custom thresholds', () => {
    it('should respect custom character thresholds', () => {
      const customCalibration = createDefaultCalibration();
      const customPredictor = new TextPredictor(customCalibration, {
        h1MaxChars: 30, // Lower threshold
      });

      const text = 'A'.repeat(35);
      expect(customPredictor.predictHeadingOverflow(text, 1)).toBe(true);
    });
  });
});
