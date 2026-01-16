/**
 * Type definitions for Slidev Overflow Checker
 */

// Source information (only when --project option is specified)
export interface SourceInfo {
  file: string; // Source file name (e.g., "slides.md")
  line: number; // Start line number
  lineEnd: number; // End line number
  content: string; // Corresponding Markdown content
}

// Element information
export interface ElementInfo {
  tag: string; // e.g., 'h1', 'div', 'img'
  class?: string; // CSS class name
  id?: string; // Element ID
  selector: string; // Unique CSS selector
  text?: string; // Text content (first 50 characters)
  src?: string; // Image source (for img elements)
  xpath?: string; // XPath selector (optional)
}

// Base Issue type
export interface BaseIssue {
  type: 'text-overflow' | 'element-overflow' | 'scrollbar';
  element: ElementInfo;
  source?: SourceInfo; // Included when project path is specified
}

// Text overflow
export interface TextOverflowIssue extends BaseIssue {
  type: 'text-overflow';
  details: {
    containerWidth: number;
    containerHeight: number;
    contentWidth: number;
    contentHeight: number;
    overflowX: number; // Horizontal overflow amount (px)
    overflowY: number; // Vertical overflow amount (px)
  };
}

// Element overflow
export interface ElementOverflowIssue extends BaseIssue {
  type: 'element-overflow';
  details: {
    slideBounds: Bounds;
    elementBounds: Bounds;
    overflow: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    };
  };
}

// Scrollbar detection
export interface ScrollbarIssue extends BaseIssue {
  type: 'scrollbar';
  details: {
    scrollbarType: 'vertical' | 'horizontal' | 'both';
    containerWidth?: number;
    containerHeight?: number;
    contentWidth?: number;
    contentHeight?: number;
    overflow: number; // Overflow amount (px)
  };
}

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type Issue = TextOverflowIssue | ElementOverflowIssue | ScrollbarIssue;

// Slide result
export interface SlideResult {
  page: number; // Slide number
  issueCount: number; // Number of issues
  issues: Issue[]; // List of detected issues
  screenshot?: string; // Screenshot path
}

// Check result
export interface CheckResult {
  timestamp: string; // ISO 8601 format
  totalSlides: number; // Total number of slides
  slidesWithIssues: number[]; // List of slide numbers with issues
  issuesFound: number; // Total number of detected issues
  summary: {
    textOverflow: {
      count: number;
      slides: number[];
    };
    elementOverflow: {
      count: number;
      slides: number[];
    };
    scrollbar: {
      count: number;
      slides: number[];
    };
  };
  slides: SlideResult[]; // Details of slides with issues
}

// Screenshot options
export interface ScreenshotOptions {
  enabled: boolean; // Whether to take screenshots
  fullPage?: boolean; // Capture entire page (default: false)
  highlightIssues?: boolean; // Highlight issue areas (default: true)
  outputDir?: string; // Output directory (default: ./screenshots)
}

// Checker options
export interface CheckerOptions {
  url?: string;
  project?: string;
  pages?: string;
  format?: string[];
  output?: string;
  threshold?: number;
  wait?: number;
  viewport?: { width: number; height: number };
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  verbose?: boolean;
  exclude?: string[];
  screenshot?: ScreenshotOptions;
  failOnIssues?: boolean; // Exit with code 1 if issues are found (for CI)
  concurrency?: number; // Parallel execution count (default: 1)
}

// Detection configuration
export interface DetectionConfig {
  textOverflow: boolean;
  elementOverflow: boolean;
  scrollbar: boolean;
  exclude: string[];
  threshold: number;
}

// ============================================
// Content Analysis Types
// ============================================

// Complexity calculation weights
export interface ComplexityWeights {
  textDensity?: number;
  codeDensity?: number;
  visualElements?: number;
  nestingDepth?: number;
}

// Content analysis threshold settings
export interface ContentAnalysisThresholds {
  // Text thresholds
  h1MaxChars?: number;
  h2MaxChars?: number;
  h3MaxChars?: number;
  paragraphMaxChars?: number;

  // Code/table thresholds
  codeMaxLines?: number;
  tableMaxCols?: number;
  tableMaxRows?: number;
  nestingDepthLimit?: number;

  // Image thresholds (--project mode only)
  imageMaxWidth?: number;
  imageMaxHeight?: number;

  // Complexity score weights
  complexityWeights?: ComplexityWeights;
}

// Content analysis configuration
export interface ContentAnalysisConfig {
  preCheckWarnings?: boolean;
  complexityThreshold?: number;
  cacheEnabled?: boolean;
  disableAutoAnalysis?: boolean;
  skipAnalysisForSlides?: number[];
  thresholds?: ContentAnalysisThresholds;
}

// Style calibration (extracted from first slide)
export interface StyleCalibration {
  slideDimensions: {
    canvasWidth: number;
    canvasHeight: number;
    aspectRatio: string;
  };
  actualPadding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  actualFontSizes: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    paragraph: number;
    code: number;
    listItem: number;
  };
  actualLineHeights: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    paragraph: number;
    code: number;
    listItem: number;
  };
  fontFamilies: {
    sans: string;
    mono: string;
    serif: string;
  };
  contentArea: {
    width: number;
    height: number;
  };
  calibratedAt: string;
  themeUsed: string;
  slideUsedForCalibration: number;
}

// Text measurement result
export interface TextMeasurement {
  text: string;
  font: string;
  measuredWidth: number;
  measuredHeight: number;
  availableWidth: number;
  availableHeight: number;
  willOverflow: boolean;
  overflowAmount: number;
  confidence: 'high' | 'medium' | 'low';
}

// Slot information (each content area within a layout)
export interface SlotInfo {
  name: string;
  width: number;
  height: number;
  position: 'full' | 'left' | 'right' | 'top' | 'bottom';
}

// Layout-specific content area
export interface LayoutContentArea {
  layout: string;
  slots: SlotInfo[];
  totalAvailableArea: number;
}

// Content node (Markdown parsing result)
export interface ContentNode {
  type: string;
  level?: number;
  lineStart: number;
  lineEnd: number;
  slideIndex: number;
  content: string;
  text?: string;
  charCount?: number;
  metadata: Record<string, unknown>;
  children?: ContentNode[];
}

// Predicted issue
export interface PredictedIssue {
  type: 'text-overflow' | 'element-overflow' | 'scrollbar';
  element: string;
  slideIndex: number;
  riskLevel: 'low' | 'medium' | 'high';
  lineRange: { start: number; end: number };
  recommendation: string;
  confirmed: boolean;
  confidence: 'high' | 'medium' | 'low';
  measuredValue?: number;
  thresholdValue?: number;
}

// Prediction accuracy
export interface PredictionAccuracy {
  predicted: number;
  confirmed: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
}

// Slide analysis result
export interface SlideAnalysis {
  slideIndex: number;
  layout: string;
  complexity: number;
  riskLevel: 'low' | 'medium' | 'high';
  contentArea: {
    width: number;
    height: number;
  };
  metrics: {
    characterCount: number;
    wordCount: number;
    elementCounts: {
      headings: number;
      lists: number;
      codeBlocks: number;
      images: number;
      tables: number;
    };
  };
  predictedIssues: PredictedIssue[];
  recommendations: string[];
  skipped: boolean;
  skipReason?: string;
}

// Presentation-wide metrics
export interface PresentationMetrics {
  totalSlides: number;
  averageComplexity: number;
  highRiskSlideCount: number;
  mediumRiskSlideCount: number;
  lowRiskSlideCount: number;
  mostComplexSlide: number;
  contentDistribution: {
    textHeavy: number;
    codeHeavy: number;
    balanced: number;
  };
}

// Analysis mode information
export interface AnalysisModeInfo {
  type: 'slides-file' | 'project-directory';
  capabilities: {
    markdownParsing: boolean;
    assetSizeDetection: boolean;
    configFileAccess: boolean;
    themeAnalysis: boolean;
    accuracyLevel: 'basic' | 'detailed';
  };
}

// Slidev configuration
export interface SlidevConfig {
  theme?: string;
  canvasWidth?: number;
  aspectRatio?: string;
  fonts?: {
    sans?: string;
    serif?: string;
    mono?: string;
  };
  overflowChecker?: {
    thresholds?: ContentAnalysisThresholds;
  };
}

// Content analysis result (added to CheckResult)
export interface ContentAnalysisResult {
  enabled: boolean;
  analysisTime: number;
  mode: AnalysisModeInfo;
  calibration?: StyleCalibration;
  presentationMetrics: PresentationMetrics;
  predictions: {
    totalPredicted: number;
    totalActual: number;
    accuracy: PredictionAccuracy;
    predictions: PredictedIssue[];
  };
  slideAnalysis: SlideAnalysis[];
}
