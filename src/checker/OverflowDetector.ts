import { Page } from 'playwright';
import {
  Issue,
  TextOverflowIssue,
  ElementOverflowIssue,
  ScrollbarIssue,
  DetectionConfig,
} from '../types';

/**
 * Class responsible for overflow detection logic
 */
export class OverflowDetector {
  private page: Page;
  private config: DetectionConfig;

  constructor(page: Page, config: DetectionConfig) {
    this.page = page;
    this.config = config;
  }

  /**
   * Detect all issues
   */
  async detectIssues(): Promise<Issue[]> {
    const issues: Issue[] = [];

    if (this.config.textOverflow) {
      const textIssues = await this.detectTextOverflow();
      issues.push(...textIssues);
    }

    if (this.config.elementOverflow) {
      const elementIssues = await this.detectElementOverflow();
      issues.push(...elementIssues);
    }

    if (this.config.scrollbar) {
      const scrollbarIssues = await this.detectScrollbar();
      issues.push(...scrollbarIssues);
    }

    return issues;
  }

  /**
   * Text overflow detection
   */
  private async detectTextOverflow(): Promise<TextOverflowIssue[]> {
    const issues = await this.page.evaluate(
      ({ exclude, threshold }) => {
        const results: any[] = [];

        // Find the current active slide page
        let activeSlidePage: Element | null = document.querySelector('.slidev-page.active');

        if (!activeSlidePage) {
          const urlMatch = window.location.pathname.match(/\/(\d+)/) ||
                          window.location.hash.match(/#?(\d+)/);
          if (urlMatch) {
            const slideNum = parseInt(urlMatch[1], 10);
            activeSlidePage = document.querySelector(`.slidev-page-${slideNum}`) ||
                             document.querySelector(`[data-slidev-no="${slideNum}"]`);
          }
        }

        if (!activeSlidePage) {
          const allSlides = document.querySelectorAll('.slidev-page');
          for (const slide of Array.from(allSlides)) {
            const rect = slide.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              activeSlidePage = slide;
              break;
            }
          }
        }

        // Only inspect main content area of slide
        const slideLayout = activeSlidePage?.querySelector('.slidev-layout') ||
                           document.querySelector('.slidev-layout');
        if (!slideLayout) return results;

        // Get the actual visible content boundary from .slidev-slide-content
        // This element has the scaled dimensions that represent what the user sees
        const slideContent = document.querySelector('.slidev-slide-content') ||
                            document.querySelector('#slide-content');
        const layoutRect = slideContent ? slideContent.getBoundingClientRect() : slideLayout.getBoundingClientRect();

        const allElements = slideLayout.querySelectorAll('*');

        allElements.forEach((element) => {
          // Skip elements matching exclusion selector
          for (const selector of exclude) {
            if (element.matches(selector) || element.closest(selector)) {
              return;
            }
          }

          const computed = window.getComputedStyle(element);
          const hasOverflowHidden =
            computed.overflow === 'hidden' ||
            computed.overflowX === 'hidden' ||
            computed.overflowY === 'hidden' ||
            computed.textOverflow === 'ellipsis';

          let overflowX = 0;
          let overflowY = 0;
          let containerWidth = element.clientWidth;
          let containerHeight = element.clientHeight;
          let contentWidth = element.scrollWidth;
          let contentHeight = element.scrollHeight;

          // For elements with overflow:hidden, use scrollWidth/scrollHeight
          if (hasOverflowHidden) {
            overflowX = Math.max(0, contentWidth - containerWidth);
            overflowY = Math.max(0, contentHeight - containerHeight);
          } else {
            // For elements without overflow:hidden, use Range API to check actual text bounds
            // Only check elements with direct text nodes
            const textNodes: Text[] = [];
            for (const node of Array.from(element.childNodes)) {
              if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                textNodes.push(node as Text);
              }
            }

            if (textNodes.length > 0) {
              const range = document.createRange();
              range.selectNodeContents(element);
              const rangeRect = range.getBoundingClientRect();

              // Check if text extends beyond layout bounds
              overflowX = Math.max(0, rangeRect.right - layoutRect.right);
              overflowY = Math.max(0, rangeRect.bottom - layoutRect.bottom);
              containerWidth = layoutRect.width;
              containerHeight = layoutRect.height;
              contentWidth = rangeRect.width;
              contentHeight = rangeRect.height;
            }
          }

          if (overflowX > threshold || overflowY > threshold) {
            // Generate CSS selector
            let selector = element.tagName.toLowerCase();
            if (element.id) {
              selector += `#${element.id}`;
            } else if (element.className && typeof element.className === 'string') {
              const classes = element.className.trim().split(/\s+/);
              if (classes.length > 0 && classes[0]) {
                selector += `.${classes.join('.')}`;
              }
            }

            results.push({
              type: 'text-overflow',
              element: {
                tag: element.tagName.toLowerCase(),
                class: element.className || undefined,
                id: element.id || undefined,
                selector,
                text: element.textContent?.substring(0, 50) || undefined,
              },
              details: {
                containerWidth,
                containerHeight,
                contentWidth,
                contentHeight,
                overflowX,
                overflowY,
              },
            });
          }
        });

        return results;
      },
      { exclude: this.config.exclude, threshold: this.config.threshold }
    );

    return issues as TextOverflowIssue[];
  }

  /**
   * Element overflow detection
   */
  private async detectElementOverflow(): Promise<ElementOverflowIssue[]> {
    const result = await this.page.evaluate(
      ({ exclude, threshold }) => {
        const results: any[] = [];

        // Helper function to check if element is actually visible
        const isElementVisible = (el: Element): boolean => {
          const style = window.getComputedStyle(el);

          // Check for hidden visibility
          if (style.display === 'none') return false;
          if (style.visibility === 'hidden') return false;
          if (style.opacity === '0') return false;

          // Check for v-click hidden elements (Slidev specific)
          if (el.classList.contains('slidev-vclick-hidden')) return false;
          if (el.closest('.slidev-vclick-hidden')) return false;

          // Check parent visibility recursively (up to 3 levels)
          let parent = el.parentElement;
          let depth = 0;
          while (parent && parent !== document.body && depth < 3) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.opacity === '0') return false;
            if (parentStyle.visibility === 'hidden') return false;
            parent = parent.parentElement;
            depth++;
          }

          return true;
        };

        // Find the current active slide page
        // Priority: 1) .active class, 2) slide number from URL, 3) visible slide, 4) first slide
        let activeSlidePage: Element | null = document.querySelector('.slidev-page.active');

        if (!activeSlidePage) {
          // Try to get slide number from URL
          const urlMatch = window.location.pathname.match(/\/(\d+)/) ||
                          window.location.hash.match(/#?(\d+)/);
          if (urlMatch) {
            const slideNum = parseInt(urlMatch[1], 10);
            activeSlidePage = document.querySelector(`.slidev-page-${slideNum}`) ||
                             document.querySelector(`[data-slidev-no="${slideNum}"]`);
          }
        }

        if (!activeSlidePage) {
          // Find the slide that is actually visible (has non-zero dimensions)
          const allSlides = document.querySelectorAll('.slidev-page');
          for (const slide of Array.from(allSlides)) {
            const rect = slide.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              activeSlidePage = slide;
              break;
            }
          }
        }

        if (!activeSlidePage) {
          activeSlidePage = document.querySelector('.slidev-page');
        }

        if (!activeSlidePage) return results;

        // Find the layout within the active slide
        const slideLayout = activeSlidePage.querySelector('.slidev-layout');
        if (!slideLayout) return results;

        // Get the actual visible content boundary from .slidev-slide-content
        // This element has the scaled dimensions that represent what the user sees
        const slideContent = document.querySelector('.slidev-slide-content') ||
                            document.querySelector('#slide-content');
        const slideRect = slideContent ? slideContent.getBoundingClientRect() : slideLayout.getBoundingClientRect();
        const slideBounds = {
          left: slideRect.left,
          top: slideRect.top,
          right: slideRect.right,
          bottom: slideRect.bottom,
        };

        const allElements = slideLayout.querySelectorAll('*');

        allElements.forEach((element) => {
          // Skip elements matching exclusion selector
          for (const selector of exclude) {
            if (element.matches(selector) || element.closest(selector)) {
              return;
            }
          }

          // Skip hidden elements (v-click, opacity: 0, etc.)
          if (!isElementVisible(element)) {
            return;
          }

          const rect = element.getBoundingClientRect();

          // Skip if element is not visible (size is 0)
          if (rect.width === 0 && rect.height === 0) {
            return;
          }

          const overflowLeft = Math.max(0, slideBounds.left - rect.left);
          const overflowTop = Math.max(0, slideBounds.top - rect.top);
          const overflowRight = Math.max(0, rect.right - slideBounds.right);
          const overflowBottom = Math.max(0, rect.bottom - slideBounds.bottom);

          const hasOverflow =
            overflowLeft > threshold ||
            overflowTop > threshold ||
            overflowRight > threshold ||
            overflowBottom > threshold;

          if (hasOverflow) {
            // Generate CSS selector
            let selector = element.tagName.toLowerCase();
            if (element.id) {
              selector += `#${element.id}`;
            } else if (element.className && typeof element.className === 'string') {
              const classes = element.className.trim().split(/\s+/);
              if (classes.length > 0 && classes[0]) {
                selector += `.${classes.join('.')}`;
              }
            }

            const elementInfo: any = {
              tag: element.tagName.toLowerCase(),
              class: element.className || undefined,
              id: element.id || undefined,
              selector,
            };

            // Add src for img elements
            if (element.tagName.toLowerCase() === 'img') {
              elementInfo.src = (element as HTMLImageElement).src;
            }

            results.push({
              type: 'element-overflow',
              element: elementInfo,
              details: {
                slideBounds,
                elementBounds: {
                  left: rect.left,
                  top: rect.top,
                  right: rect.right,
                  bottom: rect.bottom,
                },
                overflow: {
                  left: overflowLeft,
                  top: overflowTop,
                  right: overflowRight,
                  bottom: overflowBottom,
                },
              },
            });
          }
        });

        return results;
      },
      { exclude: this.config.exclude, threshold: this.config.threshold }
    );

    return result as ElementOverflowIssue[];
  }

  /**
   * Scrollbar detection
   */
  private async detectScrollbar(): Promise<ScrollbarIssue[]> {
    const issues = await this.page.evaluate(({ exclude }) => {
      const results: any[] = [];

      // Find the current active slide page
      let activeSlidePage: Element | null = document.querySelector('.slidev-page.active');

      if (!activeSlidePage) {
        const urlMatch = window.location.pathname.match(/\/(\d+)/) ||
                        window.location.hash.match(/#?(\d+)/);
        if (urlMatch) {
          const slideNum = parseInt(urlMatch[1], 10);
          activeSlidePage = document.querySelector(`.slidev-page-${slideNum}`) ||
                           document.querySelector(`[data-slidev-no="${slideNum}"]`);
        }
      }

      if (!activeSlidePage) {
        const allSlides = document.querySelectorAll('.slidev-page');
        for (const slide of Array.from(allSlides)) {
          const rect = slide.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            activeSlidePage = slide;
            break;
          }
        }
      }

      // Only inspect main content area of slide
      const slideLayout = activeSlidePage?.querySelector('.slidev-layout') ||
                         document.querySelector('.slidev-layout');
      if (!slideLayout) return results;

      const allElements = slideLayout.querySelectorAll('*');

      allElements.forEach((element) => {
        // Skip elements matching exclusion selector
        for (const selector of exclude) {
          if (element.matches(selector) || element.closest(selector)) {
            return;
          }
        }

        const computed = window.getComputedStyle(element);
        const overflowX = computed.overflowX;
        const overflowY = computed.overflowY;

        const hasVerticalScrollbar = element.scrollHeight > element.clientHeight;
        const hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;

        const showsVertical =
          hasVerticalScrollbar && (overflowY === 'scroll' || overflowY === 'auto');
        const showsHorizontal =
          hasHorizontalScrollbar && (overflowX === 'scroll' || overflowX === 'auto');

        if (showsVertical || showsHorizontal) {
          let scrollbarType: 'vertical' | 'horizontal' | 'both';
          if (showsVertical && showsHorizontal) {
            scrollbarType = 'both';
          } else if (showsVertical) {
            scrollbarType = 'vertical';
          } else {
            scrollbarType = 'horizontal';
          }

          // Generate CSS selector
          let selector = element.tagName.toLowerCase();
          if (element.id) {
            selector += `#${element.id}`;
          } else if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/);
            if (classes.length > 0 && classes[0]) {
              selector += `.${classes.join('.')}`;
            }
          }

          const overflow =
            scrollbarType === 'vertical'
              ? element.scrollHeight - element.clientHeight
              : scrollbarType === 'horizontal'
              ? element.scrollWidth - element.clientWidth
              : Math.max(
                  element.scrollHeight - element.clientHeight,
                  element.scrollWidth - element.clientWidth
                );

          results.push({
            type: 'scrollbar',
            element: {
              tag: element.tagName.toLowerCase(),
              class: element.className || undefined,
              id: element.id || undefined,
              selector,
            },
            details: {
              scrollbarType,
              containerWidth: element.clientWidth,
              containerHeight: element.clientHeight,
              contentWidth: element.scrollWidth,
              contentHeight: element.scrollHeight,
              overflow,
            },
          });
        }
      });

      return results;
    }, { exclude: this.config.exclude });

    return issues as ScrollbarIssue[];
  }
}
