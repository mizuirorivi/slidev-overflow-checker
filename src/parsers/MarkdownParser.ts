export interface ParsedSlide {
  content: string;
  startLine: number;
  endLine: number;
}

export interface FoundElement {
  line: number;
  lineEnd: number;
  content: string;
}

/**
 * Parse Markdown and split into slides
 */
export class MarkdownParser {
  /**
   * Split Markdown into slides
   *
   * Slidev format:
   * - Global frontmatter at the very start (optional): theme, etc.
   * - Each slide separated by ---
   * - Each slide can have its own frontmatter (layout, etc.)
   */
  parseSlides(markdown: string): ParsedSlide[] {
    // Handle empty or whitespace-only markdown
    if (!markdown || !markdown.trim()) {
      return [];
    }

    const lines = markdown.split('\n');
    const slides: ParsedSlide[] = [];
    let currentSlide: string[] = [];
    let slideStartLine = 1;

    // State
    let inGlobalFrontmatter = false;
    let inSlideFrontmatter = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Global frontmatter processing (first --- block at very start)
      if (lineNumber === 1 && line.trim() === '---') {
        // Peek ahead to see if this looks like global frontmatter
        const hasTheme = this.looksLikeGlobalFrontmatter(lines, i);
        if (hasTheme) {
          inGlobalFrontmatter = true;
          continue;
        } else {
          // This is the first slide's frontmatter
          currentSlide.push(line);
          slideStartLine = lineNumber;
          inSlideFrontmatter = true;
          continue;
        }
      }

      if (inGlobalFrontmatter && line.trim() === '---') {
        inGlobalFrontmatter = false;
        slideStartLine = lineNumber + 1;
        continue;
      }

      if (inGlobalFrontmatter) {
        continue;
      }

      // Check if we're closing slide frontmatter
      if (inSlideFrontmatter && line.trim() === '---') {
        currentSlide.push(line);
        inSlideFrontmatter = false;
        continue;
      }

      // Check if this is a slide separator (standalone ---)
      if (line.trim() === '---' && !inSlideFrontmatter) {
        // If we have content, this is a slide separator
        if (currentSlide.length > 0) {
          slides.push({
            content: currentSlide.join('\n'),
            startLine: slideStartLine,
            endLine: lineNumber - 1,
          });
          currentSlide = [];
        }
        slideStartLine = lineNumber;
        // Check if next lines contain frontmatter for this slide
        const hasFrontmatter = this.looksLikeSlideFrontmatter(lines, i);
        if (hasFrontmatter) {
          currentSlide.push(line);
          inSlideFrontmatter = true;
        } else {
          // Just a separator, start fresh content after it
          slideStartLine = lineNumber + 1;
        }
        continue;
      }

      currentSlide.push(line);
    }

    // Add the last slide
    if (currentSlide.length > 0) {
      slides.push({
        content: currentSlide.join('\n'),
        startLine: slideStartLine,
        endLine: lines.length,
      });
    }

    // Filter out empty slides
    return slides.filter(slide => slide.content.trim() !== '');
  }

  /**
   * Check if the first --- block looks like global frontmatter
   * Global frontmatter typically contains: theme, highlighter, colorSchema, etc.
   */
  private looksLikeGlobalFrontmatter(lines: string[], startIndex: number): boolean {
    const globalKeys = ['theme', 'highlighter', 'colorSchema', 'favicon', 'fonts', 'canvasWidth', 'aspectRatio'];

    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '---') {
        break;
      }
      for (const key of globalKeys) {
        if (line.startsWith(key + ':')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if the next lines after --- contain slide-specific frontmatter
   */
  private looksLikeSlideFrontmatter(lines: string[], startIndex: number): boolean {
    const slideKeys = ['layout', 'class', 'clicks', 'transition', 'background', 'backgroundSize', 'dragPos', 'preload', 'routeAlias', 'hide'];

    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '---') {
        return true; // Found closing ---, this is frontmatter
      }
      if (line === '' || line.startsWith('#')) {
        return false; // Empty line or heading = no frontmatter
      }
      for (const key of slideKeys) {
        if (line.startsWith(key + ':')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Search for a specific element in slide content
   */
  findElementInSlide(slideContent: string, elementType: string, slideStartLine: number): FoundElement | null {
    const lines = slideContent.split('\n');

    // Headings
    if (elementType === 'h1') {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ')) {
          return {
            line: slideStartLine + i,
            lineEnd: slideStartLine + i,
            content: lines[i],
          };
        }
      }
    }

    if (elementType === 'h2') {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('## ')) {
          return {
            line: slideStartLine + i,
            lineEnd: slideStartLine + i,
            content: lines[i],
          };
        }
      }
    }

    // Images
    if (elementType === 'img') {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/!\[.*?\]\(.*?\)/)) {
          return {
            line: slideStartLine + i,
            lineEnd: slideStartLine + i,
            content: lines[i],
          };
        }
      }
    }

    // Code blocks
    if (elementType === 'code' || elementType === 'pre') {
      let inCodeBlock = false;
      let codeBlockStart = -1;
      const codeLines: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('```')) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            codeBlockStart = i;
            codeLines.push(lines[i]);
          } else {
            codeLines.push(lines[i]);
            return {
              line: slideStartLine + codeBlockStart,
              lineEnd: slideStartLine + i,
              content: codeLines.join('\n'),
            };
          }
        } else if (inCodeBlock) {
          codeLines.push(lines[i]);
        }
      }
    }

    return null;
  }

  /**
   * Search for element by text content (partial match)
   */
  findElementByText(slideContent: string, text: string, slideStartLine: number): FoundElement | null {
    const lines = slideContent.split('\n');
    const searchText = text.trim().substring(0, 50); // Search with first 50 characters

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return {
          line: slideStartLine + i,
          lineEnd: slideStartLine + i,
          content: lines[i],
        };
      }
    }

    return null;
  }
}
