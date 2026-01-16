/**
 * Tests for Layout Definitions
 * TDD: Define layout content areas for Slidev built-in layouts
 */
import { describe, it, expect } from 'vitest';
import {
  getLayoutContentArea,
  calculateContentArea,
  LAYOUT_DEFINITIONS,
  DEFAULT_PADDING,
} from '../../src/calibration/LayoutDefinitions.js';

describe('LayoutDefinitions', () => {
  const defaultCanvas = { width: 980, height: 552 };

  describe('DEFAULT_PADDING', () => {
    it('should define Slidev default padding (px-14 py-10)', () => {
      expect(DEFAULT_PADDING.left).toBe(56);
      expect(DEFAULT_PADDING.right).toBe(56);
      expect(DEFAULT_PADDING.top).toBe(40);
      expect(DEFAULT_PADDING.bottom).toBe(40);
    });
  });

  describe('calculateContentArea', () => {
    it('should calculate content area from canvas and padding', () => {
      const area = calculateContentArea(defaultCanvas.width, defaultCanvas.height);
      expect(area.width).toBe(868); // 980 - 56 - 56
      expect(area.height).toBe(472); // 552 - 40 - 40
    });

    it('should accept custom padding', () => {
      const area = calculateContentArea(980, 552, {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      });
      expect(area.width).toBe(980);
      expect(area.height).toBe(552);
    });
  });

  describe('LAYOUT_DEFINITIONS', () => {
    it('should define default layout', () => {
      expect(LAYOUT_DEFINITIONS.default).toBeDefined();
    });

    it('should define two-cols layout', () => {
      expect(LAYOUT_DEFINITIONS['two-cols']).toBeDefined();
    });

    it('should define full layout', () => {
      expect(LAYOUT_DEFINITIONS.full).toBeDefined();
    });

    it('should define image-left layout', () => {
      expect(LAYOUT_DEFINITIONS['image-left']).toBeDefined();
    });

    it('should define image-right layout', () => {
      expect(LAYOUT_DEFINITIONS['image-right']).toBeDefined();
    });
  });

  describe('getLayoutContentArea', () => {
    describe('default layout', () => {
      it('should return full content area with standard padding', () => {
        const layout = getLayoutContentArea('default', defaultCanvas.width, defaultCanvas.height);
        expect(layout.layout).toBe('default');
        expect(layout.slots).toHaveLength(1);
        expect(layout.slots[0].name).toBe('default');
        expect(layout.slots[0].width).toBe(868);
        expect(layout.slots[0].height).toBe(472);
        expect(layout.slots[0].position).toBe('full');
      });
    });

    describe('full layout', () => {
      it('should return full canvas with no padding', () => {
        const layout = getLayoutContentArea('full', defaultCanvas.width, defaultCanvas.height);
        expect(layout.slots[0].width).toBe(980);
        expect(layout.slots[0].height).toBe(552);
      });
    });

    describe('center layout', () => {
      it('should return same dimensions as default', () => {
        const layout = getLayoutContentArea('center', defaultCanvas.width, defaultCanvas.height);
        expect(layout.slots[0].width).toBe(868);
        expect(layout.slots[0].height).toBe(472);
      });
    });

    describe('two-cols layout', () => {
      it('should return two slots with half width each', () => {
        const layout = getLayoutContentArea('two-cols', defaultCanvas.width, defaultCanvas.height);
        expect(layout.slots).toHaveLength(2);
        expect(layout.slots[0].name).toBe('left');
        expect(layout.slots[0].position).toBe('left');
        expect(layout.slots[1].name).toBe('right');
        expect(layout.slots[1].position).toBe('right');

        // Each column is roughly half of content area minus gap
        const expectedColWidth = Math.floor((868 - 16) / 2); // 16px gap
        expect(layout.slots[0].width).toBe(expectedColWidth);
        expect(layout.slots[1].width).toBe(expectedColWidth);
      });
    });

    describe('two-cols-header layout', () => {
      it('should return header slot and two column slots', () => {
        const layout = getLayoutContentArea('two-cols-header', defaultCanvas.width, defaultCanvas.height);
        expect(layout.slots).toHaveLength(3);
        expect(layout.slots[0].name).toBe('header');
        expect(layout.slots[0].position).toBe('top');
        expect(layout.slots[1].name).toBe('left');
        expect(layout.slots[2].name).toBe('right');
      });
    });

    describe('image-left layout', () => {
      it('should return content area on right side', () => {
        const layout = getLayoutContentArea('image-left', defaultCanvas.width, defaultCanvas.height);
        expect(layout.slots).toHaveLength(1);
        expect(layout.slots[0].name).toBe('default');
        expect(layout.slots[0].position).toBe('right');
        // Content gets about half of canvas width minus right padding
        // 980 / 2 - 56 = 434
        expect(layout.slots[0].width).toBe(434);
      });
    });

    describe('image-right layout', () => {
      it('should return content area on left side', () => {
        const layout = getLayoutContentArea('image-right', defaultCanvas.width, defaultCanvas.height);
        expect(layout.slots).toHaveLength(1);
        expect(layout.slots[0].name).toBe('default');
        expect(layout.slots[0].position).toBe('left');
      });
    });

    describe('cover layout', () => {
      it('should return standard content area', () => {
        const layout = getLayoutContentArea('cover', defaultCanvas.width, defaultCanvas.height);
        expect(layout.slots[0].width).toBe(868);
      });
    });

    describe('fact layout', () => {
      it('should return narrower content area with extra padding', () => {
        const layout = getLayoutContentArea('fact', defaultCanvas.width, defaultCanvas.height);
        // Fact layout typically has extra horizontal padding
        expect(layout.slots[0].width).toBeLessThan(868);
      });
    });

    describe('unknown layout', () => {
      it('should fall back to default layout', () => {
        const layout = getLayoutContentArea('unknown-layout', defaultCanvas.width, defaultCanvas.height);
        expect(layout.layout).toBe('unknown-layout');
        expect(layout.slots[0].width).toBe(868); // Same as default
      });
    });

    describe('custom canvas size', () => {
      it('should calculate content area for custom canvas', () => {
        const layout = getLayoutContentArea('default', 1200, 675);
        // 1200 - 56 - 56 = 1088
        expect(layout.slots[0].width).toBe(1088);
        // 675 - 40 - 40 = 595
        expect(layout.slots[0].height).toBe(595);
      });
    });
  });

  describe('totalAvailableArea', () => {
    it('should calculate total available area for single slot', () => {
      const layout = getLayoutContentArea('default', defaultCanvas.width, defaultCanvas.height);
      expect(layout.totalAvailableArea).toBe(868 * 472);
    });

    it('should calculate total available area for multiple slots', () => {
      const layout = getLayoutContentArea('two-cols', defaultCanvas.width, defaultCanvas.height);
      const slot1Area = layout.slots[0].width * layout.slots[0].height;
      const slot2Area = layout.slots[1].width * layout.slots[1].height;
      expect(layout.totalAvailableArea).toBe(slot1Area + slot2Area);
    });
  });
});
