/**
 * EnhancedMarkdownParser - Extended markdown parsing with semantic content extraction
 *
 * Extends MarkdownParser to provide:
 * - Semantic content node extraction (headings, lists, code, etc.)
 * - Layout detection and content area calculation
 * - Slidev component recognition
 * - Metrics calculation for complexity analysis
 */

import { MarkdownParser, type ParsedSlide } from './MarkdownParser.js';
import type { ContentNode, SlidevConfig } from '../types/index.js';
import { getLayoutContentArea } from '../calibration/LayoutDefinitions.js';

/**
 * Default canvas dimensions from Slidev
 */
const DEFAULT_CANVAS_WIDTH = 980;
const DEFAULT_CANVAS_HEIGHT = 552;

/**
 * Metrics for a slide
 */
export interface SlideMetrics {
  totalCharacters: number;
  wordCount: number;
  elementCounts: {
    headings: number;
    lists: number;
    codeBlocks: number;
    images: number;
    tables: number;
  };
}

/**
 * Parsed slide with enhanced content information
 */
export interface SlideContent {
  index: number;
  rawContent: string;
  layout: string;
  contentNodes: ContentNode[];
  contentArea: {
    width: number;
    height: number;
  };
  metrics: SlideMetrics;
  frontmatter: Record<string, unknown>;
  lineStart: number;
  lineEnd: number;
}

/**
 * Complete parsed presentation
 */
export interface ParsedPresentation {
  globalConfig: SlidevConfig;
  slides: SlideContent[];
  warnings: string[];
  totalLines: number;
}

/**
 * Slide analysis summary
 */
export interface SlideAnalysisSummary {
  slideIndex: number;
  layout: string;
  nodeCount: number;
  characterCount: number;
}

/**
 * EnhancedMarkdownParser class
 */
export class EnhancedMarkdownParser extends MarkdownParser {
  private warnings: string[] = [];

  /**
   * Parse a complete Slidev presentation
   */
  parsePresentation(markdown: string): ParsedPresentation {
    this.warnings = [];
    const lines = markdown.split('\n');
    const totalLines = lines.length;

    // Extract global config from first frontmatter
    const globalConfig = this.extractGlobalConfig(markdown);

    // Parse into slides using base parser
    const parsedSlides = this.parseSlides(markdown);

    // Enhance each slide with content extraction
    const slides = parsedSlides.map((slide, index) =>
      this.parseSlideContent(slide, index, globalConfig)
    );

    return {
      globalConfig,
      slides,
      warnings: this.warnings,
      totalLines,
    };
  }

  /**
   * Extract global configuration from presentation frontmatter
   */
  private extractGlobalConfig(markdown: string): SlidevConfig {
    const frontmatter = this.extractFrontmatter(markdown);

    return {
      theme: (frontmatter.theme as string) ?? 'default',
      canvasWidth: (frontmatter.canvasWidth as number) ?? DEFAULT_CANVAS_WIDTH,
      aspectRatio: (frontmatter.aspectRatio as string) ?? '16/9',
      fonts: frontmatter.fonts as SlidevConfig['fonts'],
      overflowChecker: frontmatter.overflowChecker as SlidevConfig['overflowChecker'],
    };
  }

  /**
   * Extract frontmatter from markdown (first --- block)
   */
  private extractFrontmatter(markdown: string): Record<string, unknown> {
    const lines = markdown.split('\n');
    if (lines[0]?.trim() !== '---') {
      return {};
    }

    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      return {};
    }

    const frontmatterContent = lines.slice(1, endIndex).join('\n');
    return this.parseYamlLike(frontmatterContent);
  }

  /**
   * Simple YAML-like parser for frontmatter
   */
  private parseYamlLike(content: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const lines = content.split('\n');
    let currentIndentLevel = 0;
    let nestedObject: Record<string, unknown> | null = null;

    try {
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const indent = line.length - line.trimStart().length;
        const colonIndex = trimmed.indexOf(':');

        if (colonIndex === -1) continue;

        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();

        if (indent === 0) {
          // Top-level key
          if (value === '' || value === '|' || value === '>') {
            // Nested object or multi-line
            currentIndentLevel = indent;
            nestedObject = {};
            result[key] = nestedObject;
          } else {
            result[key] = this.parseValue(value);
            nestedObject = null;
          }
        } else if (nestedObject && indent > currentIndentLevel) {
          // Nested property
          nestedObject[key] = this.parseValue(value);
        }
      }
    } catch {
      this.warnings.push('Failed to parse frontmatter, using defaults');
    }

    return result;
  }

  /**
   * Parse a single value from YAML
   */
  private parseValue(value: string): unknown {
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // Numbers
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Booleans
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Null
    if (value === 'null' || value === '~') return null;

    return value;
  }

  /**
   * Parse slide content with enhanced extraction
   */
  private parseSlideContent(
    slide: ParsedSlide,
    index: number,
    globalConfig: SlidevConfig
  ): SlideContent {
    // Extract slide-level frontmatter
    const slideFrontmatter = this.extractSlideFrontmatter(slide.content);
    const layout = (slideFrontmatter.layout as string) ?? 'default';

    // Calculate content area based on layout
    const canvasWidth = globalConfig.canvasWidth ?? DEFAULT_CANVAS_WIDTH;
    const canvasHeight = this.calculateCanvasHeight(canvasWidth, globalConfig.aspectRatio ?? '16/9');
    const layoutArea = getLayoutContentArea(layout, canvasWidth, canvasHeight);

    // Extract content nodes
    const contentNodes = this.extractContentNodes(slide.content, index, slide.startLine);

    // Calculate metrics
    const metrics = this.calculateMetrics(slide.content, contentNodes);

    return {
      index,
      rawContent: slide.content,
      layout,
      contentNodes,
      contentArea: {
        width: layoutArea.slots[0]?.width ?? 868,
        height: layoutArea.slots[0]?.height ?? 472,
      },
      metrics,
      frontmatter: slideFrontmatter,
      lineStart: slide.startLine,
      lineEnd: slide.endLine,
    };
  }

  /**
   * Calculate canvas height from width and aspect ratio
   * Slidev uses 552 as default height for 980 width with 16/9 aspect ratio
   */
  private calculateCanvasHeight(width: number, aspectRatio: string): number {
    // If using default width and default aspect ratio, return default height
    if (width === DEFAULT_CANVAS_WIDTH && (aspectRatio === '16/9' || !aspectRatio)) {
      return DEFAULT_CANVAS_HEIGHT;
    }

    const parts = aspectRatio.split('/');
    if (parts.length === 2) {
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (w > 0 && h > 0) {
        return Math.ceil(width * (h / w));
      }
    }
    return DEFAULT_CANVAS_HEIGHT;
  }

  /**
   * Extract frontmatter from slide content
   */
  private extractSlideFrontmatter(content: string): Record<string, unknown> {
    const lines = content.split('\n');
    if (lines[0]?.trim() !== '---') {
      return {};
    }

    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      return {};
    }

    const frontmatterContent = lines.slice(1, endIndex).join('\n');
    return this.parseYamlLike(frontmatterContent);
  }

  /**
   * Extract content nodes from slide content
   */
  private extractContentNodes(
    content: string,
    slideIndex: number,
    slideStartLine: number
  ): ContentNode[] {
    const nodes: ContentNode[] = [];
    const lines = content.split('\n');

    // Skip slide frontmatter
    let startIdx = 0;
    if (lines[0]?.trim() === '---') {
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          startIdx = i + 1;
          break;
        }
      }
    }

    let i = startIdx;
    while (i < lines.length) {
      const line = lines[i];
      const lineNumber = slideStartLine + i;

      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        nodes.push({
          type: 'heading',
          level,
          lineStart: lineNumber,
          lineEnd: lineNumber,
          slideIndex,
          content: line,
          text,
          charCount: text.length,
          metadata: { level },
        });
        i++;
        continue;
      }

      // Code blocks
      if (line.trim().startsWith('```')) {
        const result = this.parseCodeBlock(lines, i, slideIndex, slideStartLine);
        if (result.node) {
          nodes.push(result.node);
        }
        i = result.endIndex + 1;
        continue;
      }

      // Lists (unordered)
      if (line.match(/^\s*[-*+]\s+.+/)) {
        const result = this.parseList(lines, i, slideIndex, slideStartLine, false);
        nodes.push(result.node);
        i = result.endIndex + 1;
        continue;
      }

      // Lists (ordered)
      if (line.match(/^\s*\d+\.\s+.+/)) {
        const result = this.parseList(lines, i, slideIndex, slideStartLine, true);
        nodes.push(result.node);
        i = result.endIndex + 1;
        continue;
      }

      // Images
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        nodes.push({
          type: 'image',
          lineStart: lineNumber,
          lineEnd: lineNumber,
          slideIndex,
          content: line,
          metadata: {
            alt: imageMatch[1],
            src: imageMatch[2],
          },
        });
        i++;
        continue;
      }

      // Tables
      if (line.includes('|') && line.trim().startsWith('|')) {
        const result = this.parseTable(lines, i, slideIndex, slideStartLine);
        if (result.node) {
          nodes.push(result.node);
        }
        i = result.endIndex + 1;
        continue;
      }

      // Blockquotes
      if (line.trim().startsWith('>')) {
        const result = this.parseBlockquote(lines, i, slideIndex, slideStartLine);
        nodes.push(result.node);
        i = result.endIndex + 1;
        continue;
      }

      // Slidev components
      const vClickMatch = line.match(/<(v-click|v-clicks)(\s[^>]*)?>/) ||
        line.match(/<\/(v-click|v-clicks)>/);
      if (vClickMatch) {
        nodes.push({
          type: 'slidev-component',
          lineStart: lineNumber,
          lineEnd: lineNumber,
          slideIndex,
          content: line,
          metadata: {
            component: vClickMatch[1],
          },
        });
        i++;
        continue;
      }

      // Slot separators (::name::)
      const slotMatch = line.match(/^::(\w+)::$/);
      if (slotMatch) {
        nodes.push({
          type: 'slot-separator',
          lineStart: lineNumber,
          lineEnd: lineNumber,
          slideIndex,
          content: line,
          metadata: {
            slotName: slotMatch[1],
          },
        });
        i++;
        continue;
      }

      // Paragraph (non-empty lines that aren't other elements)
      if (line.trim() && !line.trim().startsWith('<!--')) {
        const result = this.parseParagraph(lines, i, slideIndex, slideStartLine);
        if (result.node) {
          nodes.push(result.node);
        }
        i = result.endIndex + 1;
        continue;
      }

      i++;
    }

    return nodes;
  }

  /**
   * Parse a code block
   */
  private parseCodeBlock(
    lines: string[],
    startIdx: number,
    slideIndex: number,
    slideStartLine: number
  ): { node: ContentNode | null; endIndex: number } {
    const startLine = lines[startIdx];
    const langMatch = startLine.match(/^```(\w*)$/);
    const language = langMatch ? langMatch[1] : '';

    const codeLines: string[] = [];
    let endIdx = startIdx + 1;
    let closed = false;

    while (endIdx < lines.length) {
      if (lines[endIdx].trim() === '```') {
        closed = true;
        break;
      }
      codeLines.push(lines[endIdx]);
      endIdx++;
    }

    if (!closed) {
      this.warnings.push(`Unclosed code block at line ${slideStartLine + startIdx}`);
    }

    const content = codeLines.join('\n');

    return {
      node: {
        type: 'code-block',
        lineStart: slideStartLine + startIdx,
        lineEnd: slideStartLine + endIdx,
        slideIndex,
        content: lines.slice(startIdx, endIdx + 1).join('\n'),
        charCount: content.length,
        metadata: {
          language,
          lineCount: codeLines.length,
        },
      },
      endIndex: endIdx,
    };
  }

  /**
   * Parse a list
   */
  private parseList(
    lines: string[],
    startIdx: number,
    slideIndex: number,
    slideStartLine: number,
    ordered: boolean
  ): { node: ContentNode; endIndex: number } {
    const listLines: string[] = [];
    let endIdx = startIdx;
    let maxDepth = 0;
    let itemCount = 0;

    const listPattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*+]\s+/;

    while (endIdx < lines.length) {
      const line = lines[endIdx];
      if (line.match(listPattern) || (line.match(/^\s+/) && listLines.length > 0 && line.trim())) {
        listLines.push(line);

        // Count depth
        const indent = line.length - line.trimStart().length;
        const depth = Math.floor(indent / 2);
        if (depth > maxDepth) maxDepth = depth;

        // Count items
        if (line.match(listPattern)) {
          itemCount++;
        }

        endIdx++;
      } else if (line.trim() === '' && endIdx + 1 < lines.length && lines[endIdx + 1].match(listPattern)) {
        // Allow single empty line in list
        listLines.push(line);
        endIdx++;
      } else {
        break;
      }
    }

    return {
      node: {
        type: 'list',
        lineStart: slideStartLine + startIdx,
        lineEnd: slideStartLine + endIdx - 1,
        slideIndex,
        content: listLines.join('\n'),
        metadata: {
          ordered,
          itemCount,
          maxDepth,
        },
      },
      endIndex: endIdx - 1,
    };
  }

  /**
   * Parse a table
   */
  private parseTable(
    lines: string[],
    startIdx: number,
    slideIndex: number,
    slideStartLine: number
  ): { node: ContentNode | null; endIndex: number } {
    const tableLines: string[] = [];
    let endIdx = startIdx;
    let columns = 0;
    let rows = 0;

    while (endIdx < lines.length) {
      const line = lines[endIdx];
      if (line.includes('|')) {
        tableLines.push(line);
        const cellCount = line.split('|').filter((c) => c.trim()).length;
        if (cellCount > columns) columns = cellCount;

        // Count rows (excluding header separator)
        if (!line.match(/^\s*\|[\s-:]+\|/)) {
          rows++;
        }

        endIdx++;
      } else {
        break;
      }
    }

    // Subtract 1 for header row
    rows = Math.max(0, rows - 1);

    return {
      node: {
        type: 'table',
        lineStart: slideStartLine + startIdx,
        lineEnd: slideStartLine + endIdx - 1,
        slideIndex,
        content: tableLines.join('\n'),
        metadata: {
          columns,
          rows,
        },
      },
      endIndex: endIdx - 1,
    };
  }

  /**
   * Parse a blockquote
   */
  private parseBlockquote(
    lines: string[],
    startIdx: number,
    slideIndex: number,
    slideStartLine: number
  ): { node: ContentNode; endIndex: number } {
    const quoteLines: string[] = [];
    let endIdx = startIdx;
    let maxDepth = 0;

    while (endIdx < lines.length) {
      const line = lines[endIdx];
      if (line.trim().startsWith('>')) {
        quoteLines.push(line);
        const depth = (line.match(/^>+/) || [''])[0].length;
        if (depth > maxDepth) maxDepth = depth;
        endIdx++;
      } else if (line.trim() === '' && endIdx + 1 < lines.length && lines[endIdx + 1].trim().startsWith('>')) {
        quoteLines.push(line);
        endIdx++;
      } else {
        break;
      }
    }

    return {
      node: {
        type: 'blockquote',
        lineStart: slideStartLine + startIdx,
        lineEnd: slideStartLine + endIdx - 1,
        slideIndex,
        content: quoteLines.join('\n'),
        metadata: {
          depth: maxDepth,
        },
      },
      endIndex: endIdx - 1,
    };
  }

  /**
   * Parse a paragraph
   */
  private parseParagraph(
    lines: string[],
    startIdx: number,
    slideIndex: number,
    slideStartLine: number
  ): { node: ContentNode | null; endIndex: number } {
    const paragraphLines: string[] = [];
    let endIdx = startIdx;

    while (endIdx < lines.length) {
      const line = lines[endIdx];
      if (
        line.trim() &&
        !line.startsWith('#') &&
        !line.match(/^\s*[-*+]\s+/) &&
        !line.match(/^\s*\d+\.\s+/) &&
        !line.startsWith('```') &&
        !line.startsWith('>') &&
        !line.startsWith('|') &&
        !line.startsWith('<') &&
        !line.match(/^::/)
      ) {
        paragraphLines.push(line);
        endIdx++;
      } else {
        break;
      }
    }

    if (paragraphLines.length === 0) {
      return { node: null, endIndex: startIdx };
    }

    const text = paragraphLines.join(' ').trim();

    return {
      node: {
        type: 'paragraph',
        lineStart: slideStartLine + startIdx,
        lineEnd: slideStartLine + endIdx - 1,
        slideIndex,
        content: paragraphLines.join('\n'),
        text,
        charCount: text.length,
        metadata: {},
      },
      endIndex: endIdx - 1,
    };
  }

  /**
   * Calculate metrics for a slide
   */
  private calculateMetrics(content: string, nodes: ContentNode[]): SlideMetrics {
    const totalCharacters = content.length;
    const wordCount = content.split(/\s+/).filter((w) => w).length;

    const elementCounts = {
      headings: nodes.filter((n) => n.type === 'heading').length,
      lists: nodes.filter((n) => n.type === 'list').length,
      codeBlocks: nodes.filter((n) => n.type === 'code-block').length,
      images: nodes.filter((n) => n.type === 'image').length,
      tables: nodes.filter((n) => n.type === 'table').length,
    };

    return {
      totalCharacters,
      wordCount,
      elementCounts,
    };
  }

  /**
   * Get analysis summary for all slides
   */
  getSlideAnalysisSummary(presentation: ParsedPresentation): SlideAnalysisSummary[] {
    return presentation.slides.map((slide) => ({
      slideIndex: slide.index,
      layout: slide.layout,
      nodeCount: slide.contentNodes.length,
      characterCount: slide.metrics.totalCharacters,
    }));
  }
}
