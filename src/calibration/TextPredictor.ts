/**
 * TextPredictor - Predicts text overflow using Canvas.measureText() simulation
 *
 * Uses calibrated font sizes and content area dimensions to estimate
 * whether text will overflow without rendering in browser.
 */

import type { StyleCalibration, TextMeasurement, ContentAnalysisThresholds } from '../types/index.js';
import { getLayoutContentArea } from './LayoutDefinitions.js';

/**
 * Default character thresholds for overflow prediction
 */
const DEFAULT_THRESHOLDS: Required<
  Pick<ContentAnalysisThresholds, 'h1MaxChars' | 'h2MaxChars' | 'h3MaxChars' | 'codeMaxLines'>
> = {
  h1MaxChars: 60,
  h2MaxChars: 80,
  h3MaxChars: 100,
  codeMaxLines: 30,
};

/**
 * Character width ratio (approximate average character width / font size)
 * This is an estimation for proportional fonts
 */
const CHAR_WIDTH_RATIO = 0.6;

/**
 * Default Slidev dimensions
 */
const DEFAULT_CANVAS_WIDTH = 980;
const DEFAULT_CANVAS_HEIGHT = 552;

/**
 * Default padding (px-14 py-10)
 */
const DEFAULT_PADDING = {
  left: 56,
  right: 56,
  top: 40,
  bottom: 40,
};

/**
 * Default font sizes from Slidev default theme
 */
const DEFAULT_FONT_SIZES = {
  h1: 48,
  h2: 36,
  h3: 28,
  h4: 24,
  paragraph: 17.6,
  code: 14,
  listItem: 17.6,
};

/**
 * Default line heights
 */
const DEFAULT_LINE_HEIGHTS = {
  h1: 1.2,
  h2: 1.3,
  h3: 1.4,
  h4: 1.4,
  paragraph: 1.6,
  code: 1.5,
  listItem: 1.6,
};

/**
 * Creates a default StyleCalibration based on Slidev defaults
 */
export function createDefaultCalibration(
  canvasWidth: number = DEFAULT_CANVAS_WIDTH,
  canvasHeight: number = DEFAULT_CANVAS_HEIGHT
): StyleCalibration {
  const contentWidth = canvasWidth - DEFAULT_PADDING.left - DEFAULT_PADDING.right;
  const contentHeight = canvasHeight - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom;

  return {
    slideDimensions: {
      canvasWidth,
      canvasHeight,
      aspectRatio: '16/9',
    },
    actualPadding: { ...DEFAULT_PADDING },
    actualFontSizes: { ...DEFAULT_FONT_SIZES },
    actualLineHeights: { ...DEFAULT_LINE_HEIGHTS },
    fontFamilies: {
      sans: 'Roboto, sans-serif',
      mono: 'Fira Code, monospace',
      serif: 'Georgia, serif',
    },
    contentArea: {
      width: contentWidth,
      height: contentHeight,
    },
    calibratedAt: new Date().toISOString(),
    themeUsed: 'default',
    slideUsedForCalibration: 1,
  };
}

/**
 * Element types that can be measured
 */
type ElementType = 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'code' | 'listItem';

/**
 * Layout types supported
 */
type LayoutType = 'default' | 'two-cols' | 'full' | 'image-left' | 'image-right' | string;

/**
 * TextPredictor class for predicting text overflow
 */
export class TextPredictor {
  private calibration: StyleCalibration;
  private thresholds: Required<
    Pick<ContentAnalysisThresholds, 'h1MaxChars' | 'h2MaxChars' | 'h3MaxChars' | 'codeMaxLines'>
  >;

  constructor(
    calibration: StyleCalibration,
    thresholds?: Partial<ContentAnalysisThresholds>
  ) {
    this.calibration = calibration;
    this.thresholds = {
      h1MaxChars: thresholds?.h1MaxChars ?? DEFAULT_THRESHOLDS.h1MaxChars,
      h2MaxChars: thresholds?.h2MaxChars ?? DEFAULT_THRESHOLDS.h2MaxChars,
      h3MaxChars: thresholds?.h3MaxChars ?? DEFAULT_THRESHOLDS.h3MaxChars,
      codeMaxLines: thresholds?.codeMaxLines ?? DEFAULT_THRESHOLDS.codeMaxLines,
    };
  }

  /**
   * Get the current calibration data
   */
  getCalibration(): StyleCalibration {
    return this.calibration;
  }

  /**
   * Get font size for element type
   */
  private getFontSize(elementType: ElementType): number {
    return this.calibration.actualFontSizes[elementType];
  }

  /**
   * Get font string for element type
   */
  private getFontString(elementType: ElementType): string {
    const size = this.getFontSize(elementType);
    const family =
      elementType === 'code'
        ? this.calibration.fontFamilies.mono
        : this.calibration.fontFamilies.sans;
    return `${size}px ${family}`;
  }

  /**
   * Estimate text width based on character count and font size
   * Uses approximate character width ratio
   */
  estimateTextWidth(text: string, fontSize: number): number {
    return text.length * fontSize * CHAR_WIDTH_RATIO;
  }

  /**
   * Measure text and return measurement result
   */
  measureText(text: string, elementType: ElementType): TextMeasurement {
    const fontSize = this.getFontSize(elementType);
    const font = this.getFontString(elementType);
    const measuredWidth = this.estimateTextWidth(text, fontSize);
    const lineHeight = this.calibration.actualLineHeights[elementType] ?? 1.5;
    const measuredHeight = fontSize * lineHeight;
    const availableWidth = this.calibration.contentArea.width;
    const availableHeight = this.calibration.contentArea.height;

    const willOverflow = measuredWidth > availableWidth;
    const overflowAmount = willOverflow ? measuredWidth - availableWidth : 0;

    return {
      text,
      font,
      measuredWidth,
      measuredHeight,
      availableWidth,
      availableHeight,
      willOverflow,
      overflowAmount,
      confidence: 'medium', // Without actual font loading, confidence is medium
    };
  }

  /**
   * Check if text will overflow
   */
  willTextOverflow(text: string, elementType: ElementType): boolean {
    return this.measureText(text, elementType).willOverflow;
  }

  /**
   * Get overflow amount in pixels
   */
  getOverflowAmount(text: string, elementType: ElementType): number {
    return this.measureText(text, elementType).overflowAmount;
  }

  /**
   * Measure text with layout-specific available width
   */
  measureTextForLayout(
    text: string,
    elementType: ElementType,
    layout: LayoutType
  ): TextMeasurement {
    const layoutArea = getLayoutContentArea(
      layout,
      this.calibration.slideDimensions.canvasWidth,
      this.calibration.slideDimensions.canvasHeight
    );

    const fontSize = this.getFontSize(elementType);
    const font = this.getFontString(elementType);
    const measuredWidth = this.estimateTextWidth(text, fontSize);
    const lineHeight = this.calibration.actualLineHeights[elementType] ?? 1.5;
    const measuredHeight = fontSize * lineHeight;

    // Use first slot's width as available width
    const availableWidth = layoutArea.slots[0]?.width ?? this.calibration.contentArea.width;
    const availableHeight = layoutArea.slots[0]?.height ?? this.calibration.contentArea.height;

    const willOverflow = measuredWidth > availableWidth;
    const overflowAmount = willOverflow ? measuredWidth - availableWidth : 0;

    return {
      text,
      font,
      measuredWidth,
      measuredHeight,
      availableWidth,
      availableHeight,
      willOverflow,
      overflowAmount,
      confidence: 'medium',
    };
  }

  /**
   * Predict heading overflow based on character threshold
   */
  predictHeadingOverflow(text: string, level: number): boolean {
    let threshold: number;
    switch (level) {
      case 1:
        threshold = this.thresholds.h1MaxChars;
        break;
      case 2:
        threshold = this.thresholds.h2MaxChars;
        break;
      case 3:
        threshold = this.thresholds.h3MaxChars;
        break;
      default:
        threshold = this.thresholds.h3MaxChars;
    }
    return text.length > threshold;
  }

  /**
   * Predict code block overflow based on line count
   */
  predictCodeBlockOverflow(code: string): boolean {
    const lines = code.split('\n').length;
    return lines > this.thresholds.codeMaxLines;
  }
}
