import { readFile } from 'fs/promises';
import { join } from 'path';
import { Issue, SourceInfo } from '../types';
import { MarkdownParser, ParsedSlide } from './MarkdownParser';

/**
 * Map slide numbers to Markdown source locations
 */
export class SlideMapper {
  private parser: MarkdownParser;
  private slides: ParsedSlide[] = [];
  private sourceFile: string = '';

  constructor() {
    this.parser = new MarkdownParser();
  }

  /**
   * Load Markdown file from project directory
   */
  async loadProject(projectPath: string): Promise<void> {
    // Look for slides.md or index.md
    const possibleFiles = ['slides.md', 'index.md', 'README.md'];

    for (const file of possibleFiles) {
      try {
        const filePath = join(projectPath, file);
        const content = await readFile(filePath, 'utf-8');
        this.slides = this.parser.parseSlides(content);
        this.sourceFile = file;
        return;
      } catch (error) {
        // If file not found, try next one
        continue;
      }
    }

    throw new Error(
      `No Slidev markdown file found in ${projectPath}. Looked for: ${possibleFiles.join(', ')}`
    );
  }

  /**
   * Add source information to an issue
   */
  addSourceInfo(slideNumber: number, issue: Issue): Issue {
    // Slide numbers start from 1
    const slideIndex = slideNumber - 1;

    if (slideIndex < 0 || slideIndex >= this.slides.length) {
      return issue;
    }

    const slide = this.slides[slideIndex];

    // Search for corresponding location in Markdown based on element type
    const element = this.findElementInSlide(slide, issue);

    if (element) {
      const source: SourceInfo = {
        file: this.sourceFile,
        line: element.line,
        lineEnd: element.lineEnd,
        content: element.content,
      };

      return {
        ...issue,
        source,
      };
    }

    return issue;
  }

  /**
   * Search for element in slide
   */
  private findElementInSlide(slide: ParsedSlide, issue: Issue): { line: number; lineEnd: number; content: string } | null {
    const tag = issue.element.tag;
    const text = issue.element.text;

    // For list items, use specialized list item finder
    if (tag === 'li' && text) {
      const found = this.parser.findListItem(slide.content, text, slide.startLine);
      if (found) {
        return found;
      }
    }

    // For paragraphs, use specialized paragraph finder
    if (tag === 'p' && text) {
      const found = this.parser.findParagraph(slide.content, text, slide.startLine);
      if (found) {
        return found;
      }
    }

    // For inline elements (strong, em, code, a), search by text content first
    const inlineElements = ['strong', 'em', 'span', 'a', 'code'];
    if (inlineElements.includes(tag) && text) {
      const found = this.parser.findElementByText(slide.content, text, slide.startLine);
      if (found) {
        return found;
      }
    }

    // Search based on tag name for block elements
    const tagMap: { [key: string]: string } = {
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h3',  // Fallback to h3 search
      img: 'img',
      pre: 'code',
    };

    const searchType = tagMap[tag];
    if (searchType) {
      const found = this.parser.findElementInSlide(slide.content, searchType, slide.startLine);
      if (found) {
        return found;
      }
    }

    // For images, also check src attribute
    if (tag === 'img' && issue.element.src) {
      const imgSrc = issue.element.src.split('/').pop() || '';
      const found = this.parser.findElementByText(slide.content, imgSrc, slide.startLine);
      if (found) {
        return found;
      }
    }

    // If not found by tag name, search by text content
    if (text) {
      const found = this.parser.findElementByText(slide.content, text, slide.startLine);
      if (found) {
        return found;
      }
    }

    // If not found, return entire slide
    return {
      line: slide.startLine,
      lineEnd: slide.endLine,
      content: slide.content.split('\n').slice(0, 3).join('\n') + '...',
    };
  }
}
