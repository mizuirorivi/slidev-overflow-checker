/**
 * Tests for EnhancedMarkdownParser
 * TDD: Extends MarkdownParser with semantic content extraction
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  EnhancedMarkdownParser,
  type ParsedPresentation,
  type SlideContent,
} from '../../src/parsers/EnhancedMarkdownParser.js';
import type { ContentNode, SlidevConfig } from '../../src/types/index.js';

describe('EnhancedMarkdownParser', () => {
  let parser: EnhancedMarkdownParser;

  beforeEach(() => {
    parser = new EnhancedMarkdownParser();
  });

  describe('parsePresentation', () => {
    it('should parse a basic presentation', () => {
      const markdown = `---
theme: default
---

# Slide 1

Content

---

# Slide 2

More content
`;
      const result = parser.parsePresentation(markdown);

      expect(result.slides).toHaveLength(2);
      expect(result.globalConfig).toBeDefined();
    });

    it('should extract global configuration from frontmatter', () => {
      const markdown = `---
theme: seriph
canvasWidth: 980
aspectRatio: 16/9
fonts:
  sans: Roboto
  mono: Fira Code
---

# Title
`;
      const result = parser.parsePresentation(markdown);

      expect(result.globalConfig.theme).toBe('seriph');
      expect(result.globalConfig.canvasWidth).toBe(980);
      expect(result.globalConfig.aspectRatio).toBe('16/9');
      expect(result.globalConfig.fonts?.sans).toBe('Roboto');
    });

    it('should return default config when no frontmatter', () => {
      const markdown = `# Simple slide

Content
`;
      const result = parser.parsePresentation(markdown);

      expect(result.globalConfig.theme).toBe('default');
      expect(result.globalConfig.canvasWidth).toBe(980);
    });
  });

  describe('parseSlideContent', () => {
    it('should extract layout from slide frontmatter', () => {
      const markdown = `---
layout: two-cols
---

# Left

::right::

# Right
`;
      const result = parser.parsePresentation(markdown);

      expect(result.slides[0].layout).toBe('two-cols');
    });

    it('should default to "default" layout', () => {
      const markdown = `# Title

Content
`;
      const result = parser.parsePresentation(markdown);

      expect(result.slides[0].layout).toBe('default');
    });

    it('should parse cover layout', () => {
      const markdown = `---
theme: default
---

---
layout: cover
---

# Welcome
`;
      const result = parser.parsePresentation(markdown);

      expect(result.slides[0].layout).toBe('cover');
    });
  });

  describe('extractContentNodes', () => {
    it('should extract h1 heading', () => {
      const markdown = `# Welcome to Presentation

Content here
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const h1 = nodes.find((n) => n.type === 'heading' && n.level === 1);
      expect(h1).toBeDefined();
      expect(h1?.text).toBe('Welcome to Presentation');
      expect(h1?.charCount).toBe(23);
    });

    it('should extract h2 heading', () => {
      const markdown = `## Section Title

Content
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const h2 = nodes.find((n) => n.type === 'heading' && n.level === 2);
      expect(h2).toBeDefined();
      expect(h2?.text).toBe('Section Title');
    });

    it('should extract h3 heading', () => {
      const markdown = `### Subsection

Details
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const h3 = nodes.find((n) => n.type === 'heading' && n.level === 3);
      expect(h3).toBeDefined();
      expect(h3?.level).toBe(3);
    });

    it('should extract code block with language', () => {
      const markdown = `# Code Example

\`\`\`typescript
function hello(): string {
  return 'world';
}
\`\`\`
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const code = nodes.find((n) => n.type === 'code-block');
      expect(code).toBeDefined();
      expect(code?.metadata.language).toBe('typescript');
      expect(code?.metadata.lineCount).toBe(3);
    });

    it('should extract code block without language', () => {
      const markdown = `\`\`\`
plain code
\`\`\`
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const code = nodes.find((n) => n.type === 'code-block');
      expect(code?.metadata.language).toBe('');
    });

    it('should extract unordered list', () => {
      const markdown = `- Item 1
- Item 2
- Item 3
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const list = nodes.find((n) => n.type === 'list');
      expect(list).toBeDefined();
      expect(list?.metadata.ordered).toBe(false);
      expect(list?.metadata.itemCount).toBe(3);
    });

    it('should extract ordered list', () => {
      const markdown = `1. First
2. Second
3. Third
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const list = nodes.find((n) => n.type === 'list');
      expect(list).toBeDefined();
      expect(list?.metadata.ordered).toBe(true);
    });

    it('should extract nested list', () => {
      const markdown = `- Item 1
  - Subitem 1.1
  - Subitem 1.2
- Item 2
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const list = nodes.find((n) => n.type === 'list');
      expect(list).toBeDefined();
      expect(list?.metadata.maxDepth).toBeGreaterThan(0);
    });

    it('should extract image', () => {
      const markdown = `![Alt text](/images/hero.png)
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const img = nodes.find((n) => n.type === 'image');
      expect(img).toBeDefined();
      expect(img?.metadata.alt).toBe('Alt text');
      expect(img?.metadata.src).toBe('/images/hero.png');
    });

    it('should extract table', () => {
      const markdown = `| Header 1 | Header 2 | Header 3 |
| --- | --- | --- |
| Cell 1 | Cell 2 | Cell 3 |
| Cell 4 | Cell 5 | Cell 6 |
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const table = nodes.find((n) => n.type === 'table');
      expect(table).toBeDefined();
      expect(table?.metadata.columns).toBe(3);
      expect(table?.metadata.rows).toBe(2); // excluding header
    });

    it('should extract blockquote', () => {
      const markdown = `> This is a quote
> spanning multiple lines
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const quote = nodes.find((n) => n.type === 'blockquote');
      expect(quote).toBeDefined();
    });

    it('should extract paragraph text', () => {
      const markdown = `# Title

This is a paragraph with some text content.

Another paragraph here.
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const paragraphs = nodes.filter((n) => n.type === 'paragraph');
      expect(paragraphs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Slidev component recognition', () => {
    it('should recognize v-click directive', () => {
      const markdown = `# Title

<v-click>

Hidden content

</v-click>
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const vclick = nodes.find((n) => n.type === 'slidev-component' && n.metadata.component === 'v-click');
      expect(vclick).toBeDefined();
    });

    it('should recognize v-clicks directive', () => {
      const markdown = `<v-clicks>

- Item 1
- Item 2

</v-clicks>
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const vclicks = nodes.find((n) => n.type === 'slidev-component' && n.metadata.component === 'v-clicks');
      expect(vclicks).toBeDefined();
    });

    it('should recognize slot separator ::right::', () => {
      const markdown = `---
layout: two-cols
---

# Left side

::right::

# Right side
`;
      const result = parser.parsePresentation(markdown);
      const nodes = result.slides[0].contentNodes;

      const slot = nodes.find((n) => n.type === 'slot-separator');
      expect(slot).toBeDefined();
      expect(slot?.metadata.slotName).toBe('right');
    });
  });

  describe('line tracking', () => {
    it('should track line numbers for headings', () => {
      const markdown = `---
theme: default
---

# Title on line 5

Content
`;
      const result = parser.parsePresentation(markdown);
      const h1 = result.slides[0].contentNodes.find((n) => n.type === 'heading');

      expect(h1?.lineStart).toBeDefined();
      expect(h1?.lineEnd).toBeDefined();
    });

    it('should track line range for code blocks', () => {
      const markdown = `\`\`\`typescript
line 1
line 2
line 3
\`\`\`
`;
      const result = parser.parsePresentation(markdown);
      const code = result.slides[0].contentNodes.find((n) => n.type === 'code-block');

      expect(code?.lineStart).toBeDefined();
      expect(code?.lineEnd).toBeDefined();
      expect(code!.lineEnd - code!.lineStart).toBeGreaterThanOrEqual(4);
    });
  });

  describe('content area calculation', () => {
    it('should calculate content area for default layout', () => {
      const markdown = `# Title

Content
`;
      const result = parser.parsePresentation(markdown);

      expect(result.slides[0].contentArea.width).toBe(868);
      expect(result.slides[0].contentArea.height).toBe(472);
    });

    it('should calculate content area for two-cols layout', () => {
      const markdown = `---
layout: two-cols
---

# Left

::right::

# Right
`;
      const result = parser.parsePresentation(markdown);

      // two-cols has narrower content per column
      expect(result.slides[0].contentArea.width).toBeLessThan(868);
    });

    it('should calculate content area for full layout', () => {
      const markdown = `---
layout: full
---

# Full Width
`;
      const result = parser.parsePresentation(markdown);

      expect(result.slides[0].contentArea.width).toBe(980);
    });
  });

  describe('metrics calculation', () => {
    it('should count total characters in slide', () => {
      const markdown = `# Title

This is some content.
`;
      const result = parser.parsePresentation(markdown);

      expect(result.slides[0].metrics.totalCharacters).toBeGreaterThan(0);
    });

    it('should count elements by type', () => {
      const markdown = `# Title

- Item 1
- Item 2

\`\`\`js
code
\`\`\`
`;
      const result = parser.parsePresentation(markdown);
      const counts = result.slides[0].metrics.elementCounts;

      expect(counts.headings).toBe(1);
      expect(counts.lists).toBe(1);
      expect(counts.codeBlocks).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle empty markdown', () => {
      const result = parser.parsePresentation('');

      expect(result.slides).toHaveLength(0);
    });

    it('should handle malformed frontmatter', () => {
      const markdown = `---
invalid: yaml: syntax: here
---

# Title
`;
      // Should not throw, should use defaults
      const result = parser.parsePresentation(markdown);

      expect(result.globalConfig).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should handle unclosed code block', () => {
      const markdown = `\`\`\`typescript
function incomplete() {
  // no closing
`;
      const result = parser.parsePresentation(markdown);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('getSlideAnalysisSummary', () => {
    it('should provide summary for all slides', () => {
      const markdown = `# Slide 1

Content

---

# Slide 2 with much more content

- Item 1
- Item 2
- Item 3
`;
      const result = parser.parsePresentation(markdown);
      const summary = parser.getSlideAnalysisSummary(result);

      expect(summary).toHaveLength(2);
      expect(summary[0].slideIndex).toBe(0);
      expect(summary[1].slideIndex).toBe(1);
    });
  });
});
