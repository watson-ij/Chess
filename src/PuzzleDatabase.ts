/**
 * Database of classic endgame puzzles
 */

import { EndgamePuzzle } from './EndgameTypes';

/**
 * Collection of endgame puzzles organized by category
 */
export const ENDGAME_PUZZLES: EndgamePuzzle[] = [
  // ========================================
  // BASIC CHECKMATES
  // ========================================

  {
    id: 'back-rank-mate-1',
    category: 'basic-checkmates',
    title: 'Back Rank Mate Pattern',
    description: 'Recognize and execute a classic back rank checkmate',
    fen: '6k1/5ppp/8/8/8/8/8/4R2K w - - 0 1',
    playerSide: 'white',
    objective: 'checkmate',
    objectiveDescription: 'Checkmate in 1 move',
    difficulty: 1,
    solution: {
      'Re8#': 'success',
    },
    hints: [
      'The black king is trapped by its own pawns',
      'Look for a checkmate on the back rank',
      'Move your rook to deliver checkmate',
    ],
    educational:
      'Back rank mate is one of the most common mating patterns:\n' +
      '- The king is trapped on the back rank by its own pieces (usually pawns)\n' +
      '- A rook or queen on the back rank delivers checkmate\n' +
      '- Always watch for this vulnerability in your own position!',
    tags: ['pattern', 'back-rank', 'tactical'],
  },

  {
    id: 'kq-vs-k-simple',
    category: 'basic-checkmates',
    title: 'King and Queen vs King - Simple',
    description: 'Practice the queen and king checkmate',
    fen: '7k/8/6K1/8/8/8/8/6Q1 w - - 0 1',
    playerSide: 'white',
    objective: 'checkmate',
    objectiveDescription: 'Checkmate the black king',
    difficulty: 1,
    solution: {
      'Qg7#': 'success',
    },
    hints: [
      'The black king is already on the edge',
      'Your king controls escape squares',
      'Find the checkmate with your queen',
    ],
    educational:
      'When the enemy king is on the edge and your king controls key squares:\n' +
      '- The queen can deliver checkmate\n' +
      '- Make sure the king cannot escape\n' +
      '- Verify it\'s checkmate, not stalemate!',
    tags: ['elementary', 'queen', 'mating-pattern'],
  },

  {
    id: 'kr-vs-k-edge',
    category: 'basic-checkmates',
    title: 'King and Rook vs King - Edge Mate',
    description: 'Deliver checkmate with rook when king is on edge',
    fen: '7k/8/6K1/8/8/8/8/7R w - - 0 1',
    playerSide: 'white',
    objective: 'checkmate',
    objectiveDescription: 'Checkmate with King and Rook',
    difficulty: 1,
    solution: {
      'Rh1#': 'success',
    },
    hints: [
      'The black king is trapped on the h-file',
      'Your king controls escape squares',
      'Move the rook to deliver mate',
    ],
    educational:
      'Rook checkmate on the edge:\n' +
      '- Enemy king on the edge with no escape\n' +
      '- Your king blocks escape squares\n' +
      '- Rook delivers mate from the side',
    tags: ['elementary', 'rook', 'mating-pattern'],
  },

  {
    id: 'kq-vs-k-medium',
    category: 'basic-checkmates',
    title: 'Queen Checkmate - Multi-Move',
    description: 'Force the king to the edge and checkmate',
    fen: '8/8/8/3k4/8/2K5/8/7Q w - - 0 1',
    playerSide: 'white',
    objective: 'checkmate',
    objectiveDescription: 'Checkmate the king',
    difficulty: 2,
    solution: {
      'Qd1+': {
        Ke5: {
          Kd3: {
            Kf5: {
              'Qe1': {
                Kg5: {
                  Ke4: {
                    Kg4: {
                      'Qg1+': {
                        Kh5: {
                          Kf5: {
                            Kh6: {
                              'Qg6+': {
                                Kh7: {
                                  'Qg7#': 'success',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    hints: [
      'Start with a check to push the king',
      'Bring your king closer to help',
      'Force the king toward the edge',
      'Once on the edge, deliver checkmate',
    ],
    educational:
      'Key principles for K+Q vs K:\n' +
      '1. Use checks to restrict the king\n' +
      '2. Bring your king up to help\n' +
      '3. Push the enemy king to the edge\n' +
      '4. Be careful not to stalemate!',
    tags: ['elementary', 'queen', 'mating-pattern'],
  },

  {
    id: 'ladder-mate',
    category: 'basic-checkmates',
    title: 'Ladder Mate with Two Rooks',
    description: 'Use two rooks to checkmate the king',
    fen: '6k1/8/8/8/8/8/R7/R6K w - - 0 1',
    playerSide: 'white',
    objective: 'checkmate',
    objectiveDescription: 'Checkmate with the ladder technique',
    difficulty: 2,
    solution: {
      'Ra8+': {
        Kh7: {
          'R1a7+': {
            Kh6: {
              'R8a6+': {
                Kh5: {
                  'R7a5+': {
                    Kh4: {
                      'R6a4+': {
                        Kh3: {
                          'R5a3+': {
                            Kh2: {
                              'R4a2#': 'success',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    hints: [
      'Use one rook to check and push the king',
      'Use the other rook to cut off escape squares',
      'Alternate rooks like a "ladder"',
      'Drive the king to the edge systematically',
    ],
    educational:
      'The Ladder Mate:\n' +
      '- Also called "staircase mate"\n' +
      '- One rook checks, the other cuts off a rank\n' +
      '- Alternate the rooks to push the king\n' +
      '- Forces checkmate on the edge',
    tags: ['rook', 'pattern', 'two-rooks'],
  },

  {
    id: 'queen-vs-pawn-7th',
    category: 'queen-endgames',
    title: 'Queen vs Pawn on 7th Rank',
    description: 'Win against a pawn one square from promotion',
    fen: '8/5P1k/8/8/8/8/8/q3K3 b - - 0 1',
    playerSide: 'black',
    objective: 'checkmate',
    objectiveDescription: 'Stop the pawn and checkmate',
    difficulty: 2,
    solution: {
      'Qf1+': {
        Kd2: {
          'Qf2+': {
            Kd3: {
              'Qf3+': {
                Kd4: {
                  'Qf4+': {
                    Kd5: {
                      'Qf5+': {
                        Kd6: {
                          'Qf6+': {
                            Kd7: {
                              'Qxf7+': 'success',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    hints: [
      'Use checks to force the king toward the pawn',
      'The king must eventually block the pawn',
      'Capture the pawn with check',
    ],
    educational:
      'Queen vs Pawn on 7th:\n' +
      '- Usually a win for the queen\n' +
      '- Give checks to force king to block pawn\n' +
      '- Capture pawn with check to win\n' +
      '- Exception: Rook pawns can sometimes draw',
    tags: ['queen', 'pawn', 'technique'],
  },

  {
    id: 'king-pawn-basic',
    category: 'pawn-endgames',
    title: 'King and Pawn Endgame',
    description: 'Push your pawn to promotion',
    fen: '8/8/8/8/4k3/8/4P3/4K3 w - - 0 1',
    playerSide: 'white',
    objective: 'promotion',
    objectiveDescription: 'Promote the pawn',
    difficulty: 2,
    solution: {
      e3: {
        Kd5: {
          Kd2: {
            Kd4: {
              e4: {
                Kd5: {
                  Kd3: {
                    Kd6: {
                      e5: {
                        Kd5: {
                          Kd3: {
                            Kd6: {
                              e6: {
                                Kd5: {
                                  Kd3: {
                                    Kd6: {
                                      e7: {
                                        Kd7: {
                                          'e8=Q+': 'success',
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    hints: [
      'Push your pawn forward',
      'Keep your king near to support',
      'Block the enemy king from stopping the pawn',
      'Promote when you reach the 8th rank',
    ],
    educational:
      'Basic K+P endgame:\n' +
      '- Your king must support the pawn\n' +
      '- Push the pawn when safe\n' +
      '- Keep enemy king from blockading\n' +
      '- Promote to win!',
    tags: ['pawn', 'fundamental'],
  },
];

/**
 * Get puzzles by category
 */
export function getPuzzlesByCategory(category: string): EndgamePuzzle[] {
  return ENDGAME_PUZZLES.filter((puzzle) => puzzle.category === category);
}

/**
 * Get puzzle by ID
 */
export function getPuzzleById(id: string): EndgamePuzzle | undefined {
  return ENDGAME_PUZZLES.find((puzzle) => puzzle.id === id);
}

/**
 * Get puzzles by difficulty
 */
export function getPuzzlesByDifficulty(difficulty: number): EndgamePuzzle[] {
  return ENDGAME_PUZZLES.filter((puzzle) => puzzle.difficulty === difficulty);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(ENDGAME_PUZZLES.map((p) => p.category));
  return Array.from(categories);
}
