/**
 * Application-wide constants and configuration values
 * Centralizes all magic numbers for better maintainability
 */

// ============================================================================
// BOARD RENDERING CONSTANTS
// ============================================================================

export const BOARD_CONFIG = {
  /** Default square size in pixels */
  DEFAULT_SQUARE_SIZE: 80,

  /** Board size in squares (8x8 chess board) */
  BOARD_SIZE: 8,

  /** Maximum canvas size for large screens */
  MAX_CANVAS_SIZE: 640,

  /** Default canvas size fallback */
  DEFAULT_CANVAS_SIZE: 640,
} as const;

export const BOARD_COLORS = {
  /** Light square color */
  LIGHT_SQUARE: '#f0d9b5',

  /** Dark square color */
  DARK_SQUARE: '#b58863',
} as const;

export const PIECE_COLORS = {
  /** White piece gradient start */
  WHITE_START: '#ffffff',

  /** White piece gradient end */
  WHITE_END: '#c9b899',

  /** Black piece gradient start */
  BLACK_START: '#4a4a4a',

  /** Black piece gradient end */
  BLACK_END: '#1a1a1a',

  /** White piece outline */
  WHITE_OUTLINE: '#323232',

  /** Black piece outline */
  BLACK_OUTLINE: '#666666',
} as const;

export const HIGHLIGHT_COLORS = {
  /** Selected square highlight (yellow with transparency) */
  SELECTED_SQUARE: 'rgba(255, 255, 0, 0.4)',

  /** Legal move highlight (green with transparency) */
  LEGAL_MOVE: 'rgba(0, 255, 0, 0.3)',
} as const;

export const PIECE_RENDERING = {
  /** Piece size as ratio of square size */
  SIZE_RATIO: 0.4,

  /** Legal move indicator size as ratio of square size */
  MOVE_INDICATOR_RATIO: 1 / 6,

  /** Base pedestal width ratio */
  PEDESTAL_WIDTH_RATIO: 0.55,

  /** Base pedestal height ratio */
  PEDESTAL_HEIGHT_RATIO: 0.15,

  /** Default line width for piece outlines */
  LINE_WIDTH: 2,

  /** Thicker line width for special elements */
  THICK_LINE_WIDTH: 2.5,

  /** Thin line width for details */
  THIN_LINE_WIDTH: 1.5,
} as const;

export const TEXT_RENDERING = {
  /** Font size for board coordinates */
  COORDINATE_FONT_SIZE: 12,

  /** Font family for board text */
  FONT_FAMILY: 'sans-serif',

  /** Coordinate label offset from edge */
  COORDINATE_OFFSET: 5,

  /** Column letter offset from right edge */
  COLUMN_OFFSET: 15,

  /** Row number offset from top */
  ROW_OFFSET: 15,
} as const;

// ============================================================================
// UI TIMING CONSTANTS
// ============================================================================

export const TIMING = {
  /** Delay before AI makes a move (for better UX) */
  AI_MOVE_DELAY_MS: 300,

  /** Debounce delay for window resize events */
  RESIZE_DEBOUNCE_MS: 250,

  /** Scroll behavior animation timing */
  SCROLL_BEHAVIOR: 'smooth' as ScrollBehavior,
} as const;

// ============================================================================
// GAME STATUS COLORS
// ============================================================================

export const GAME_STATUS_COLORS = {
  /** Color for checkmate status */
  CHECKMATE: '#d32f2f',

  /** Color for check status */
  CHECK: '#f57c00',

  /** Color for stalemate status */
  STALEMATE: '#1976d2',

  /** Color for white turn */
  WHITE_TURN: '#333',

  /** Color for black turn */
  BLACK_TURN: '#666',
} as const;

// ============================================================================
// SPACED REPETITION SYSTEM (SRS) CONSTANTS
// ============================================================================

export const SRS_CONFIG = {
  /** Maximum number of positions to show in a practice session */
  MAX_DUE_POSITIONS: 20,

  /** Default limit for getDuePositions */
  DEFAULT_LIMIT: 20,

  /** Initial ease factor for new positions (SuperMemo SM-2) */
  INITIAL_EASE_FACTOR: 2.5,

  /** Minimum allowed ease factor */
  MIN_EASE_FACTOR: 1.3,

  /** Interval for first correct repetition (days) */
  FIRST_INTERVAL: 1,

  /** Interval for second correct repetition (days) */
  SECOND_INTERVAL: 6,

  /** Interval for failed repetition (days) */
  FAILED_INTERVAL: 1,

  /** Ease factor threshold for "mastered" status */
  MASTERED_EASE_THRESHOLD: 2.5,

  /** Interval threshold for "mastered" status (days) */
  MASTERED_INTERVAL_THRESHOLD: 21,

  /** Minimum quality score for correct response */
  CORRECT_QUALITY_THRESHOLD: 3,
} as const;

/**
 * SM-2 algorithm coefficients for ease factor calculation
 * Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
export const SRS_ALGORITHM = {
  /** Base adjustment coefficient */
  BASE_ADJUSTMENT: 0.1,

  /** Primary difficulty coefficient */
  PRIMARY_COEFFICIENT: 0.08,

  /** Secondary difficulty coefficient */
  SECONDARY_COEFFICIENT: 0.02,

  /** Maximum quality score */
  MAX_QUALITY: 5,
} as const;

// ============================================================================
// TIME CONVERSION CONSTANTS
// ============================================================================

export const TIME_CONSTANTS = {
  /** Milliseconds in one day */
  MS_PER_DAY: 24 * 60 * 60 * 1000,

  /** Days per month (approximate) */
  DAYS_PER_MONTH: 30,

  /** Days per year */
  DAYS_PER_YEAR: 365,
} as const;

// ============================================================================
// CANVAS RENDERING SETTINGS
// ============================================================================

export const CANVAS_SETTINGS = {
  /** Enable image smoothing for high-quality rendering */
  IMAGE_SMOOTHING_ENABLED: true,

  /** Image smoothing quality level */
  IMAGE_SMOOTHING_QUALITY: 'high' as ImageSmoothingQuality,

  /** Disable alpha channel for better performance */
  ALPHA: false,
} as const;

// ============================================================================
// MOVE TREE UI CONSTANTS
// ============================================================================

export const TREE_UI = {
  /** Indentation per tree depth level */
  INDENT_PER_LEVEL: 20,

  /** Margin for tree title */
  TITLE_MARGIN_BOTTOM: 10,
} as const;
