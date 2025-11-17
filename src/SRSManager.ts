import { OpeningNode, SRSData } from './OpeningNode';
import { SRS_CONFIG, SRS_ALGORITHM, TIME_CONSTANTS } from './constants';

/**
 * Quality of the user's response in practice (0-5 scale)
 * Based on SuperMemo SM-2 algorithm
 */
export enum ResponseQuality {
  /** Complete blackout - didn't remember at all */
  COMPLETE_BLACKOUT = 0,
  /** Incorrect response, but remembered upon seeing correct answer */
  INCORRECT_BUT_FAMILIAR = 1,
  /** Incorrect response, felt familiar */
  INCORRECT_FAMILIAR = 2,
  /** Correct with serious difficulty */
  CORRECT_DIFFICULT = 3,
  /** Correct after hesitation */
  CORRECT_HESITATION = 4,
  /** Perfect response */
  PERFECT = 5
}

/**
 * Manages Spaced Repetition System for opening practice
 * Implements SuperMemo SM-2 algorithm
 */
export class SRSManager {
  /**
   * Update SRS data after a review
   *
   * @param node - The opening node that was reviewed
   * @param quality - Quality of response (0-5)
   * @returns Updated SRS data
   */
  static review(node: OpeningNode, quality: ResponseQuality): SRSData {
    const srs = node.srsData;
    const currentDate = Date.now();

    srs.lastReviewed = currentDate;
    srs.totalReviews++;

    // Update ease factor based on quality
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    // where q is quality (0-5)
    const qualityNum = quality as number;
    const qualityDiff = SRS_ALGORITHM.MAX_QUALITY - qualityNum;
    let newEaseFactor = srs.easeFactor + (
      SRS_ALGORITHM.BASE_ADJUSTMENT -
      qualityDiff * (SRS_ALGORITHM.PRIMARY_COEFFICIENT + qualityDiff * SRS_ALGORITHM.SECONDARY_COEFFICIENT)
    );

    // Ease factor must be at least the minimum threshold
    if (newEaseFactor < SRS_CONFIG.MIN_EASE_FACTOR) {
      newEaseFactor = SRS_CONFIG.MIN_EASE_FACTOR;
    }

    srs.easeFactor = newEaseFactor;

    // Update repetition count and interval
    if (quality < SRS_CONFIG.CORRECT_QUALITY_THRESHOLD) {
      // Incorrect response - reset repetitions
      srs.repetitions = 0;
      srs.interval = SRS_CONFIG.FAILED_INTERVAL;
    } else {
      // Correct response - increment repetitions
      srs.correctCount++;
      srs.repetitions++;

      if (srs.repetitions === 1) {
        srs.interval = SRS_CONFIG.FIRST_INTERVAL;
      } else if (srs.repetitions === 2) {
        srs.interval = SRS_CONFIG.SECOND_INTERVAL;
      } else {
        // Subsequent repetitions: previous interval * ease factor
        srs.interval = Math.round(srs.interval * srs.easeFactor);
      }
    }

    // Calculate next review date
    srs.nextReview = currentDate + (srs.interval * TIME_CONSTANTS.MS_PER_DAY);

    return srs;
  }

  /**
   * Get positions due for review from a list of nodes
   *
   * @param nodes - List of opening nodes
   * @param limit - Maximum number of positions to return
   * @returns Array of nodes due for review, sorted by priority
   */
  static getDuePositions(nodes: OpeningNode[], limit: number = SRS_CONFIG.DEFAULT_LIMIT): OpeningNode[] {
    const currentDate = Date.now();

    // Filter nodes that are due for review
    const dueNodes = nodes.filter(node =>
      node.isKeyPosition && node.isDueForReview(currentDate)
    );

    // Sort by priority:
    // 1. Never reviewed (nextReview === null)
    // 2. Most overdue (nextReview furthest in the past)
    // 3. Lowest ease factor (harder positions)
    dueNodes.sort((a, b) => {
      // Never reviewed comes first
      if (a.srsData.nextReview === null && b.srsData.nextReview !== null) return -1;
      if (a.srsData.nextReview !== null && b.srsData.nextReview === null) return 1;
      if (a.srsData.nextReview === null && b.srsData.nextReview === null) return 0;

      // Then by how overdue (earlier nextReview = more overdue)
      const overdueDiff = a.srsData.nextReview! - b.srsData.nextReview!;
      if (overdueDiff !== 0) return overdueDiff;

      // Then by ease factor (lower = harder)
      return a.srsData.easeFactor - b.srsData.easeFactor;
    });

    return dueNodes.slice(0, limit);
  }

  /**
   * Get statistics for an opening
   */
  static getStatistics(rootNode: OpeningNode): {
    totalPositions: number;
    keyPositions: number;
    dueForReview: number;
    masteredPositions: number;
    averageEaseFactor: number;
    totalReviews: number;
    accuracy: number;
  } {
    const allNodes: OpeningNode[] = [];

    // Collect all nodes
    const collectNodes = (node: OpeningNode) => {
      allNodes.push(node);
      node.children.forEach(collectNodes);
    };
    collectNodes(rootNode);

    const keyNodes = allNodes.filter(n => n.isKeyPosition);
    const dueNodes = rootNode.getDueNodes();

    // Mastered = ease factor >= threshold and interval >= threshold days
    const masteredNodes = keyNodes.filter(n =>
      n.srsData.easeFactor >= SRS_CONFIG.MASTERED_EASE_THRESHOLD &&
      n.srsData.interval >= SRS_CONFIG.MASTERED_INTERVAL_THRESHOLD
    );

    const totalReviews = keyNodes.reduce((sum, n) => sum + n.srsData.totalReviews, 0);
    const totalCorrect = keyNodes.reduce((sum, n) => sum + n.srsData.correctCount, 0);
    const avgEaseFactor = keyNodes.length > 0
      ? keyNodes.reduce((sum, n) => sum + n.srsData.easeFactor, 0) / keyNodes.length
      : SRS_CONFIG.INITIAL_EASE_FACTOR;

    return {
      totalPositions: allNodes.length,
      keyPositions: keyNodes.length,
      dueForReview: dueNodes.length,
      masteredPositions: masteredNodes.length,
      averageEaseFactor: avgEaseFactor,
      totalReviews,
      accuracy: totalReviews > 0 ? totalCorrect / totalReviews : 0
    };
  }

  /**
   * Reset SRS data for a node
   */
  static reset(node: OpeningNode): void {
    node.srsData = {
      easeFactor: SRS_CONFIG.INITIAL_EASE_FACTOR,
      interval: 0,
      repetitions: 0,
      lastReviewed: null,
      nextReview: null,
      totalReviews: 0,
      correctCount: 0
    };
  }

  /**
   * Format interval for display
   */
  static formatInterval(days: number): string {
    if (days === 0) return 'New';
    if (days === 1) return '1 day';
    if (days < TIME_CONSTANTS.DAYS_PER_MONTH) return `${days} days`;
    if (days < TIME_CONSTANTS.DAYS_PER_YEAR) {
      const months = Math.round(days / TIME_CONSTANTS.DAYS_PER_MONTH);
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    const years = Math.round(days / TIME_CONSTANTS.DAYS_PER_YEAR);
    return `${years} year${years > 1 ? 's' : ''}`;
  }

  /**
   * Format next review date
   */
  static formatNextReview(nextReview: number | null): string {
    if (nextReview === null) return 'Not scheduled';

    const now = Date.now();
    const diff = nextReview - now;

    if (diff < 0) {
      const days = Math.abs(Math.floor(diff / TIME_CONSTANTS.MS_PER_DAY));
      return days === 0 ? 'Due now' : `Overdue by ${days} day${days > 1 ? 's' : ''}`;
    }

    const days = Math.ceil(diff / TIME_CONSTANTS.MS_PER_DAY);
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  }
}
