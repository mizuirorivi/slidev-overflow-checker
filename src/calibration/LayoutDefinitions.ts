/**
 * Layout Definitions for Slidev Built-in Layouts
 * Defines content areas based on layout type
 *
 * Reference: https://sli.dev/builtin/layouts
 */

import type { LayoutContentArea, SlotInfo } from '../types/index.js';

/**
 * Default Slidev padding (px-14 py-10 in UnoCSS)
 * px-14 = 3.5rem = 56px
 * py-10 = 2.5rem = 40px
 */
export const DEFAULT_PADDING = {
  left: 56,
  right: 56,
  top: 40,
  bottom: 40,
};

/**
 * Gap between columns in multi-column layouts
 */
const COLUMN_GAP = 16;

/**
 * Extra padding for emphasis layouts (fact, quote)
 */
const EMPHASIS_EXTRA_PADDING = 100;

/**
 * Estimated header height for two-cols-header layout
 */
const HEADER_HEIGHT = 80;

export interface Padding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Calculate content area from canvas dimensions and padding
 */
export function calculateContentArea(
  canvasWidth: number,
  canvasHeight: number,
  padding: Padding = DEFAULT_PADDING
): { width: number; height: number } {
  return {
    width: canvasWidth - padding.left - padding.right,
    height: canvasHeight - padding.top - padding.bottom,
  };
}

type LayoutDefinition = (
  canvasWidth: number,
  canvasHeight: number
) => Omit<LayoutContentArea, 'layout'>;

/**
 * Layout definitions for Slidev built-in layouts
 */
export const LAYOUT_DEFINITIONS: Record<string, LayoutDefinition> = {
  /**
   * Default layout - standard content area with padding
   */
  default: (canvasWidth, canvasHeight) => {
    const area = calculateContentArea(canvasWidth, canvasHeight);
    const slots: SlotInfo[] = [
      {
        name: 'default',
        width: area.width,
        height: area.height,
        position: 'full',
      },
    ];
    return {
      slots,
      totalAvailableArea: area.width * area.height,
    };
  },

  /**
   * Full layout - no padding, uses entire canvas
   */
  full: (canvasWidth, canvasHeight) => {
    const slots: SlotInfo[] = [
      {
        name: 'default',
        width: canvasWidth,
        height: canvasHeight,
        position: 'full',
      },
    ];
    return {
      slots,
      totalAvailableArea: canvasWidth * canvasHeight,
    };
  },

  /**
   * Center layout - same dimensions as default, content centered
   */
  center: (canvasWidth, canvasHeight) => {
    const area = calculateContentArea(canvasWidth, canvasHeight);
    const slots: SlotInfo[] = [
      {
        name: 'default',
        width: area.width,
        height: area.height,
        position: 'full',
      },
    ];
    return {
      slots,
      totalAvailableArea: area.width * area.height,
    };
  },

  /**
   * Two-cols layout - splits content into left and right columns
   */
  'two-cols': (canvasWidth, canvasHeight) => {
    const area = calculateContentArea(canvasWidth, canvasHeight);
    const colWidth = Math.floor((area.width - COLUMN_GAP) / 2);
    const slots: SlotInfo[] = [
      {
        name: 'left',
        width: colWidth,
        height: area.height,
        position: 'left',
      },
      {
        name: 'right',
        width: colWidth,
        height: area.height,
        position: 'right',
      },
    ];
    return {
      slots,
      totalAvailableArea: colWidth * area.height * 2,
    };
  },

  /**
   * Two-cols-header layout - header on top, two columns below
   */
  'two-cols-header': (canvasWidth, canvasHeight) => {
    const area = calculateContentArea(canvasWidth, canvasHeight);
    const colWidth = Math.floor((area.width - COLUMN_GAP) / 2);
    const bodyHeight = area.height - HEADER_HEIGHT - COLUMN_GAP;

    const slots: SlotInfo[] = [
      {
        name: 'header',
        width: area.width,
        height: HEADER_HEIGHT,
        position: 'top',
      },
      {
        name: 'left',
        width: colWidth,
        height: bodyHeight,
        position: 'left',
      },
      {
        name: 'right',
        width: colWidth,
        height: bodyHeight,
        position: 'right',
      },
    ];
    return {
      slots,
      totalAvailableArea:
        area.width * HEADER_HEIGHT + colWidth * bodyHeight * 2,
    };
  },

  /**
   * Image-left layout - image on left, content on right
   */
  'image-left': (canvasWidth, canvasHeight) => {
    const contentWidth = Math.floor(canvasWidth / 2) - DEFAULT_PADDING.right;
    const contentHeight = canvasHeight - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom;
    const slots: SlotInfo[] = [
      {
        name: 'default',
        width: contentWidth,
        height: contentHeight,
        position: 'right',
      },
    ];
    return {
      slots,
      totalAvailableArea: contentWidth * contentHeight,
    };
  },

  /**
   * Image-right layout - content on left, image on right
   */
  'image-right': (canvasWidth, canvasHeight) => {
    const contentWidth = Math.floor(canvasWidth / 2) - DEFAULT_PADDING.left;
    const contentHeight = canvasHeight - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom;
    const slots: SlotInfo[] = [
      {
        name: 'default',
        width: contentWidth,
        height: contentHeight,
        position: 'left',
      },
    ];
    return {
      slots,
      totalAvailableArea: contentWidth * contentHeight,
    };
  },

  /**
   * Cover layout - standard content area (typically with larger fonts)
   */
  cover: (canvasWidth, canvasHeight) => {
    const area = calculateContentArea(canvasWidth, canvasHeight);
    const slots: SlotInfo[] = [
      {
        name: 'default',
        width: area.width,
        height: area.height,
        position: 'full',
      },
    ];
    return {
      slots,
      totalAvailableArea: area.width * area.height,
    };
  },

  /**
   * Fact layout - narrower content area for emphasis
   */
  fact: (canvasWidth, canvasHeight) => {
    const area = calculateContentArea(canvasWidth, canvasHeight, {
      ...DEFAULT_PADDING,
      left: DEFAULT_PADDING.left + EMPHASIS_EXTRA_PADDING / 2,
      right: DEFAULT_PADDING.right + EMPHASIS_EXTRA_PADDING / 2,
    });
    const slots: SlotInfo[] = [
      {
        name: 'default',
        width: area.width,
        height: area.height,
        position: 'full',
      },
    ];
    return {
      slots,
      totalAvailableArea: area.width * area.height,
    };
  },

  /**
   * Quote layout - same as fact (narrower for emphasis)
   */
  quote: (canvasWidth, canvasHeight) => {
    return LAYOUT_DEFINITIONS.fact(canvasWidth, canvasHeight);
  },

  /**
   * Statement layout - same dimensions as default
   */
  statement: (canvasWidth, canvasHeight) => {
    return LAYOUT_DEFINITIONS.default(canvasWidth, canvasHeight);
  },

  /**
   * Section layout - same dimensions as default
   */
  section: (canvasWidth, canvasHeight) => {
    return LAYOUT_DEFINITIONS.default(canvasWidth, canvasHeight);
  },

  /**
   * Intro layout - same dimensions as default
   */
  intro: (canvasWidth, canvasHeight) => {
    return LAYOUT_DEFINITIONS.default(canvasWidth, canvasHeight);
  },

  /**
   * End layout - same dimensions as default
   */
  end: (canvasWidth, canvasHeight) => {
    return LAYOUT_DEFINITIONS.default(canvasWidth, canvasHeight);
  },

  /**
   * Image layout - full canvas for background image
   */
  image: (canvasWidth, canvasHeight) => {
    return LAYOUT_DEFINITIONS.full(canvasWidth, canvasHeight);
  },

  /**
   * Iframe layout - full canvas for iframe
   */
  iframe: (canvasWidth, canvasHeight) => {
    return LAYOUT_DEFINITIONS.full(canvasWidth, canvasHeight);
  },

  /**
   * Iframe-left layout - iframe on left, content on right
   */
  'iframe-left': (canvasWidth, canvasHeight) => {
    return LAYOUT_DEFINITIONS['image-left'](canvasWidth, canvasHeight);
  },

  /**
   * Iframe-right layout - content on left, iframe on right
   */
  'iframe-right': (canvasWidth, canvasHeight) => {
    return LAYOUT_DEFINITIONS['image-right'](canvasWidth, canvasHeight);
  },

  /**
   * None layout - minimal styling, same as default dimensions
   */
  none: (canvasWidth, canvasHeight) => {
    return LAYOUT_DEFINITIONS.default(canvasWidth, canvasHeight);
  },
};

/**
 * Get layout content area for a given layout type
 * Falls back to default layout if layout is unknown
 */
export function getLayoutContentArea(
  layout: string,
  canvasWidth: number,
  canvasHeight: number
): LayoutContentArea {
  const definition = LAYOUT_DEFINITIONS[layout] || LAYOUT_DEFINITIONS.default;
  const result = definition(canvasWidth, canvasHeight);

  return {
    layout,
    ...result,
  };
}

/**
 * Get the primary (first) slot width for a layout
 * Useful for quick text overflow checks
 */
export function getPrimarySlotWidth(
  layout: string,
  canvasWidth: number,
  canvasHeight: number
): number {
  const layoutArea = getLayoutContentArea(layout, canvasWidth, canvasHeight);
  return layoutArea.slots[0]?.width || calculateContentArea(canvasWidth, canvasHeight).width;
}
