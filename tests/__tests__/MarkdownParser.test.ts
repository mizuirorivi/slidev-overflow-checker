import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../../src/parsers/MarkdownParser';

describe('MarkdownParser', () => {
  describe('parseSlides', () => {
    it('should parse slides separated by ---', () => {
      const markdown = `# Slide 1
This is the first slide

---

# Slide 2
This is the second slide

---

# Slide 3
This is the third slide`;

      const parser = new MarkdownParser();
      const slides = parser.parseSlides(markdown);

      expect(slides.length).toBe(3);
      expect(slides[0].content).toContain('# Slide 1');
      expect(slides[1].content).toContain('# Slide 2');
      expect(slides[2].content).toContain('# Slide 3');
    });

    it('should track line numbers correctly', () => {
      const markdown = `# Slide 1
Content

---

# Slide 2
More content`;

      const parser = new MarkdownParser();
      const slides = parser.parseSlides(markdown);

      expect(slides.length).toBe(2);
      expect(slides[0].startLine).toBe(1);
      expect(slides[1].startLine).toBe(5);
    });

    it('should handle slides with frontmatter', () => {
      const markdown = `---
theme: default
---

# First Slide

---

# Second Slide`;

      const parser = new MarkdownParser();
      const slides = parser.parseSlides(markdown);

      // frontmatterを除いた最初のスライド
      expect(slides[0].content).toContain('# First Slide');
      expect(slides.length).toBe(2);
    });
  });

  describe('findElementInSlide', () => {
    it('should find heading element', () => {
      const markdown = `# Slide Title
Some content
## Subtitle`;

      const parser = new MarkdownParser();
      const element = parser.findElementInSlide(markdown, 'h1', 1);

      expect(element).toBeDefined();
      if (element) {
        expect(element.line).toBe(1);
        expect(element.content).toBe('# Slide Title');
      }
    });

    it('should find image element', () => {
      const markdown = `# Slide
Some text
![Alt text](/path/to/image.png)
More text`;

      const parser = new MarkdownParser();
      const element = parser.findElementInSlide(markdown, 'img', 1);

      expect(element).toBeDefined();
      if (element) {
        expect(element.content).toContain('![Alt text](/path/to/image.png)');
      }
    });

    it('should find code block', () => {
      const markdown = `# Slide
\`\`\`typescript
const x = 1;
console.log(x);
\`\`\`
`;

      const parser = new MarkdownParser();
      const element = parser.findElementInSlide(markdown, 'code', 1);

      expect(element).toBeDefined();
      if (element) {
        expect(element.lineEnd).toBeGreaterThan(element.line);
        expect(element.content).toContain('const x = 1');
      }
    });
  });
});
