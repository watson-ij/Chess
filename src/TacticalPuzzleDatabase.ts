/**
 * Database of Tactical Puzzles
 * Organized by tactical themes with increasing difficulty
 */

import { TacticalPuzzle, TacticalTheme, PuzzleDifficulty } from './TacticalPuzzleTypes';

export const TACTICAL_PUZZLES: TacticalPuzzle[] = [
  // ========== FORK ==========
  {
    id: 'fork-001',
    theme: 'fork',
    title: 'Classic Knight Fork',
    description: 'Fork the king and rook with a check',
    fen: 'r1bqkb1r/pp1p1ppp/2n5/3Np3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
    playerSide: 'white',
    objective: 'win-material',
    objectiveDescription: 'Win the rook with a knight fork',
    difficulty: 1,
    solution: {
      'Nc7+': {
        'Kd8': {
          'Nxa8': 'success'
        },
        'Kf8': {
          'Nxa8': 'success'
        },
        'Ke7': {
          'Nxa8': 'success'
        }
      }
    },
    hints: [
      'Look for a square where your knight can attack two valuable pieces',
      'The black king is still in the center',
      'Nc7+ gives check and attacks the rook on a8!'
    ],
    educational: 'A knight fork is one of the most common tactical motifs. This is a classic example where the knight forks the king and rook. Since it\'s check, the opponent must move the king, allowing you to capture the rook on the next move. Knights are particularly effective at forking because they can attack squares that other pieces cannot reach simultaneously.',
    tags: ['beginner', 'knight-fork', 'fundamental']
  },
  {
    id: 'fork-002',
    theme: 'fork',
    title: 'Royal Fork',
    description: 'Fork the king and queen',
    fen: 'r1bqk2r/pppp1ppp/8/4p3/4n3/8/PPPP1PPP/RNQ2RK1 b kq - 0 1',
    playerSide: 'black',
    objective: 'win-material',
    objectiveDescription: 'Win the queen with a royal fork',
    difficulty: 2,
    solution: {
      'Ne2+': {
        'Kh1': {
          'Nxc1': 'success'
        },
        'Kf1': {
          'Nxc1': 'success'
        }
      }
    },
    hints: [
      'The white king and queen are on vulnerable squares',
      'Your knight on e4 can deliver a devastating blow',
      'Ne2+ gives check and forks the king on g1 and queen on c1!'
    ],
    educational: 'A "royal fork" is when a knight simultaneously attacks the enemy king and queen. This is often decisive as the opponent must move the king, allowing you to capture the queen on the next move. Always look for opportunities to place your knight where it can fork the king with other valuable pieces.',
    tags: ['intermediate', 'royal-fork', 'winning-queen']
  },
  {
    id: 'fork-003',
    theme: 'fork',
    title: 'Queen Fork Setup',
    description: 'Set up a devastating queen fork',
    fen: 'r2qkb1r/ppp2ppp/2n5/3np3/2B5/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1',
    playerSide: 'white',
    objective: 'win-material',
    objectiveDescription: 'Win the queen with a fork',
    difficulty: 3,
    solution: {
      'Nxe5': {
        'Nxe5': {
          'Qxd8+': 'success'
        },
        'Qe7': {
          'Nxc6': 'success'
        }
      }
    },
    hints: [
      'Capture the central pawn to threaten multiple pieces',
      'Your knight can attack both the queen and knight',
      'After Nxe5, you threaten both Qxd8+ and Nxc6'
    ],
    educational: 'Sometimes a fork doesn\'t happen immediately but creates a double threat that wins material. Here, after Nxe5, you threaten to capture the queen with check and also threaten the knight on c6, winning material by force.',
    tags: ['intermediate', 'fork', 'double-threat']
  },

  // ========== PIN ==========
  {
    id: 'pin-001',
    theme: 'pin',
    title: 'Absolute Pin',
    description: 'Exploit an absolute pin to win material',
    fen: 'r2qkb1r/ppp2ppp/4n3/3pP3/2B5/8/PPP2PPP/RNBQK2R w KQkq - 0 1',
    playerSide: 'white',
    objective: 'win-material',
    objectiveDescription: 'Win the pinned knight',
    difficulty: 1,
    solution: {
      'Bxe6': {
        'fxe6': 'success',
        'Qe7': 'success'
      }
    },
    hints: [
      'The knight on e6 is pinned to the king on e8',
      'Your bishop on c4 creates an absolute pin along the diagonal',
      'The knight cannot move without exposing the king to check - capture it!'
    ],
    educational: 'An absolute pin occurs when a piece cannot legally move because doing so would expose the king to check. Here, the black knight on e6 is pinned by your bishop on c4 to the black king on e8. The pinned piece is essentially paralyzed and can often be captured or exploited.',
    tags: ['beginner', 'absolute-pin', 'fundamental']
  },
  {
    id: 'pin-002',
    theme: 'pin',
    title: 'Breaking the Pin',
    description: 'Use a desperado move before being captured',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/1PB1P3/5N2/P1PP1PPP/RNBQK2R b KQkq - 0 1',
    playerSide: 'black',
    objective: 'win-material',
    objectiveDescription: 'Maximize your material',
    difficulty: 2,
    solution: {
      'Bxf2+': {
        'Kxf2': {
          'Nxe4+': {
            'Ke1': 'success',
            'Kf1': 'success',
            'Kg1': 'success',
            'Ke3': 'success'
          }
        }
      }
    },
    hints: [
      'Your bishop on c5 is under attack',
      'Before it gets captured, it can do damage',
      'Sacrifice it with check to win a pawn and fork'
    ],
    educational: 'When your piece is about to be captured, look for "desperado" moves - actions your piece can take to create maximum damage before it dies. Here, the bishop sacrifices itself with check, allowing the knight to win material.',
    tags: ['intermediate', 'desperado', 'tactics']
  },
  {
    id: 'pin-003',
    theme: 'pin',
    title: 'Pinning to Win',
    description: 'Create a pin to win the queen',
    fen: 'r2qkb1r/ppp2ppp/2n5/3pp3/4P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1',
    playerSide: 'white',
    objective: 'win-material',
    objectiveDescription: 'Win the queen',
    difficulty: 3,
    solution: {
      'Bg5': {
        'f6': {
          'Bxd8': 'success'
        },
        'Be7': {
          'Bxd8': 'success'
        },
        'Qe7': 'success',
        'Qc7': 'success',
        'Qb6': 'success'
      }
    },
    hints: [
      'The black queen and king are on the same file',
      'Your dark-squared bishop can attack the queen',
      'Bg5 attacks the queen, and if it moves, you can attack the king!'
    ],
    educational: 'Creating pins is as important as exploiting them. While this is more of a "queen trap" than a pure pin, the principle is similar - the queen is attacked and has limited escape squares. When enemy pieces are poorly placed, look for ways to attack valuable pieces and restrict their movement.',
    tags: ['intermediate', 'creating-pins', 'winning-queen']
  },

  // ========== SKEWER ==========
  {
    id: 'skewer-001',
    theme: 'skewer',
    title: 'Back Rank Skewer',
    description: 'Skewer the king and rook',
    fen: '3r2k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
    playerSide: 'white',
    objective: 'win-material',
    objectiveDescription: 'Win the rook',
    difficulty: 1,
    solution: {
      'Re8+': {
        'Kh7': {
          'Rxd8': 'success'
        },
        'Kg7': {
          'Rxd8': 'success'
        },
        'Kf7': {
          'Rxd8': 'success'
        }
      }
    },
    hints: [
      'The black king and rook are on the same file',
      'Your rook can give check',
      'After Re8+, the king must move and you win the rook on d8!'
    ],
    educational: 'A skewer is the opposite of a pin - you attack a valuable piece (the king), forcing it to move and exposing a less valuable piece (the rook) behind it. Rooks and bishops are particularly effective at skewering along ranks, files, and diagonals.',
    tags: ['beginner', 'skewer', 'endgame']
  },
  {
    id: 'skewer-002',
    theme: 'skewer',
    title: 'Diagonal Skewer',
    description: 'Skewer queen and rook on the diagonal',
    fen: 'r4rk1/ppp2ppp/8/3q4/3P4/2P5/PP3PPP/R1B2RK1 w - - 0 1',
    playerSide: 'white',
    objective: 'win-material',
    objectiveDescription: 'Win the rook',
    difficulty: 2,
    solution: {
      'Bb2+': {
        'Qf7': {
          'Bxa8': 'success'
        },
        'Qe5': {
          'Bxa8': 'success'
        },
        'f6': {
          'Bxa8': 'success'
        }
      }
    },
    hints: [
      'The black queen and rook on a8 are on the same diagonal',
      'Your bishop can attack the queen with check',
      'Bb2+ skewers the queen and the rook on a8!'
    ],
    educational: 'Look for enemy pieces aligned on diagonals, ranks, or files. When a more valuable piece is in front, you can skewer them, forcing the valuable piece to move and winning the piece behind. Here, the queen must move from check, exposing the rook.',
    tags: ['intermediate', 'diagonal-skewer']
  },

  // ========== DISCOVERED ATTACK ==========
  {
    id: 'discovered-001',
    theme: 'discovered-attack',
    title: 'Discovered Check',
    description: 'Use a discovered check to win material',
    fen: 'r1bqk2r/pppp1ppp/2n5/2b1p3/2B1P2N/8/PPPP1PPP/RNBQK2R w KQkq - 0 1',
    playerSide: 'white',
    objective: 'win-material',
    objectiveDescription: 'Win the queen',
    difficulty: 2,
    solution: {
      'Nf5': {
        'Qe7': 'success',
        'Qf6': 'success',
        'Qh4': 'success',
        'Qg5': 'success'
      }
    },
    hints: [
      'Your bishop on c4 is aiming at f7, next to the king',
      'The knight on h4 can move and discover an attack',
      'Moving the knight discovers check and attacks the queen!'
    ],
    educational: 'A discovered attack occurs when moving one piece exposes an attack from another piece behind it. Discovered checks are particularly powerful because the opponent must respond to the check while you can capture freely with your moving piece. Here, moving the knight discovers check from the bishop while simultaneously attacking the queen.',
    tags: ['intermediate', 'discovered-check', 'double-attack']
  },
  {
    id: 'discovered-002',
    theme: 'discovered-attack',
    title: 'Double Check Mate',
    description: 'Deliver checkmate with a double check',
    fen: '5rk1/pp3ppp/2p5/6N1/1b1p4/6P1/PP2PPBP/5RK1 w - - 0 1',
    playerSide: 'white',
    objective: 'checkmate',
    objectiveDescription: 'Checkmate in one move',
    difficulty: 3,
    solution: {
      'Ne6#': 'success'
    },
    hints: [
      'Your knight can give check',
      'Your bishop on g2 is aiming at the king along the diagonal',
      'Moving the knight will also uncover the bishop - double check mate!'
    ],
    educational: 'A double check is when two pieces give check simultaneously. The only way to escape double check is to move the king - you cannot block both checks or capture both checking pieces. Here, the knight checks from e6 while the bishop gives discovered check along the long diagonal, and the king has no escape squares - checkmate!',
    tags: ['advanced', 'double-check', 'checkmate']
  },

  // ========== BACK RANK MATE ==========
  {
    id: 'backrank-001',
    theme: 'back-rank-mate',
    title: 'Classic Back Rank',
    description: 'Exploit the trapped king',
    fen: '6k1/5ppp/8/8/8/8/5PPP/4R2K w - - 0 1',
    playerSide: 'white',
    objective: 'checkmate',
    objectiveDescription: 'Checkmate in one move',
    difficulty: 1,
    solution: {
      'Re8#': 'success'
    },
    hints: [
      'The black king is trapped by its own pawns',
      'Your rook controls the 8th rank',
      'Re8 is checkmate'
    ],
    educational: 'Back rank mates are among the most common tactical motifs. When a king is trapped on its back rank by its own pawns, a rook or queen on that rank delivers checkmate. Always be aware of back rank weaknesses in both your position and your opponent\'s.',
    tags: ['beginner', 'checkmate', 'back-rank']
  },
  {
    id: 'backrank-002',
    theme: 'back-rank-mate',
    title: 'Deflection to Back Rank',
    description: 'Remove the defender of the back rank',
    fen: '2r3k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1',
    playerSide: 'white',
    objective: 'checkmate',
    objectiveDescription: 'Force checkmate',
    difficulty: 2,
    solution: {
      'Rd8+': {
        'Rxd8': {
          'Rxd8#': 'success'
        }
      }
    },
    hints: [
      'The black rook is defending against back rank mate',
      'You have two rooks to coordinate the attack',
      'Rd8+ forces the rook to capture, then your second rook delivers mate!'
    ],
    educational: 'Deflection is a tactic where you force an enemy piece away from an important defensive duty. Here, we deflect the defender of the back rank by sacrificing one rook, allowing the second rook to deliver checkmate.',
    tags: ['intermediate', 'deflection', 'sacrifice']
  },

  // ========== DEFLECTION ==========
  {
    id: 'deflection-001',
    theme: 'deflection',
    title: 'Deflect the Defender',
    description: 'Force the defender away',
    fen: '3r2k1/6pp/8/8/8/6Q1/5PPP/5RK1 w - - 0 1',
    playerSide: 'white',
    objective: 'checkmate',
    objectiveDescription: 'Checkmate in two moves',
    difficulty: 2,
    solution: {
      'Qxg7+': {
        'Rxg7': {
          'Rf8#': 'success'
        }
      }
    },
    hints: [
      'The rook on d8 is defending the back rank',
      'Your queen can sacrifice herself to deflect the rook',
      'After Qxg7+ Rxg7, Rf8 is checkmate!'
    ],
    educational: 'Deflection involves luring or forcing an enemy piece away from a critical square or defensive task. Here, we sacrifice the queen to deflect the rook from the 8th rank, allowing our rook to deliver checkmate.',
    tags: ['intermediate', 'deflection', 'sacrifice']
  },

  // ========== DECOY ==========
  {
    id: 'decoy-001',
    theme: 'decoy',
    title: 'Lure the King',
    description: 'Bring the king into danger',
    fen: '6k1/5p1p/6p1/8/8/6Q1/5PPP/6K1 w - - 0 1',
    playerSide: 'white',
    objective: 'checkmate',
    objectiveDescription: 'Checkmate in two moves',
    difficulty: 2,
    solution: {
      'Qg7+': {
        'Kxg7': {
          'h4#': 'success'
        }
      }
    },
    hints: [
      'You need to bring the king to a worse square',
      'The queen can sacrifice herself',
      'After Qg7+ Kxg7, push h4 for a surprising checkmate pattern!'
    ],
    educational: 'A decoy is a sacrifice that lures an enemy piece (often the king) to a worse square where it becomes vulnerable to a follow-up tactic. Here, after the king captures the queen on g7, it\'s trapped by its own pawns and the simple pawn move h4 delivers checkmate!',
    tags: ['intermediate', 'decoy', 'sacrifice']
  },

  // ========== REMOVE THE DEFENDER ==========
  {
    id: 'remove-defender-001',
    theme: 'remove-defender',
    title: 'Capture the Defender',
    description: 'Eliminate the piece protecting the target',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 1',
    playerSide: 'white',
    objective: 'win-material',
    objectiveDescription: 'Win the bishop on c5',
    difficulty: 2,
    solution: {
      'Nxe5': {
        'Nxe5': {
          'Qd5': 'success'
        },
        'Qe7': {
          'Nxc6': 'success'
        }
      }
    },
    hints: [
      'The knight on c6 is defending the bishop on c5',
      'The pawn on e5 is defending the knight on c6',
      'Remove the pawn first, and you win material!'
    ],
    educational: 'Removing the defender is a straightforward but powerful tactic. Identify what piece is defending your target, and find a way to capture, deflect, or destroy that defender. Here, after capturing the pawn that defends the knight, if Black recaptures, you can win the bishop with a discovered attack.',
    tags: ['intermediate', 'remove-defender', 'tactics']
  },

  // ========== SACRIFICE ==========
  {
    id: 'sacrifice-001',
    theme: 'sacrifice',
    title: 'Greek Gift Sacrifice',
    description: 'The classic bishop sacrifice on h7',
    fen: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQ1RK1 w - - 0 1',
    playerSide: 'white',
    objective: 'checkmate',
    objectiveDescription: 'Win the game with a kingside attack',
    difficulty: 4,
    solution: {
      'Bxh7+': {
        'Kxh7': {
          'Ng5+': {
            'Kg8': {
              'Qh5': {
                'Re8': 'success',
                'f6': 'success',
                'Nf6': 'success'
              }
            },
            'Kg6': {
              'Qg4': 'success'
            }
          }
        }
      }
    },
    hints: [
      'The classic Greek Gift sacrifice starts with Bxh7+',
      'After Kxh7 Ng5+, the king is exposed',
      'Bring the queen to h5 for a devastating attack'
    ],
    educational: 'The Greek Gift sacrifice (Bxh7+) is one of the most famous attacking patterns in chess. It works when the enemy king has castled kingside and lacks proper defenders. The sacrifice exposes the king and allows your pieces to coordinate for a mating attack.',
    tags: ['advanced', 'sacrifice', 'mating-attack', 'greek-gift']
  },

  // ========== DOUBLE ATTACK ==========
  {
    id: 'double-attack-001',
    theme: 'double-attack',
    title: 'Queen Double Attack',
    description: 'Attack two pieces simultaneously',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
    playerSide: 'white',
    objective: 'win-material',
    objectiveDescription: 'Win a piece',
    difficulty: 2,
    solution: {
      'Bxf7+': {
        'Kxf7': {
          'Nxe5+': 'success'
        }
      }
    },
    hints: [
      'You can check the king and attack the pawn',
      'After the king captures, your knight can win material',
      'Bxf7+ followed by Nxe5+ wins the pawn with check'
    ],
    educational: 'A double attack occurs when a single piece attacks two enemy pieces or targets simultaneously. The opponent can often only defend one, allowing you to win the other. Queens, knights, and bishops are particularly good at double attacks.',
    tags: ['intermediate', 'double-attack', 'tactics']
  },

  // ========== IN-BETWEEN MOVE (Zwischenzug) ==========
  {
    id: 'zwischenzug-001',
    theme: 'in-between-move',
    title: 'Intermediate Check',
    description: 'Insert a powerful in-between move',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/1PB1P3/5N2/P1PP1PPP/RNBQK2R b KQkq - 0 1',
    playerSide: 'black',
    objective: 'win-material',
    objectiveDescription: 'Win the bishop on c4',
    difficulty: 3,
    solution: {
      'Bxf2+': {
        'Kxf2': {
          'Nxe4+': 'success'
        },
        'Kf1': {
          'Bxe4': 'success'
        }
      }
    },
    hints: [
      'Don\'t just capture the bishop on c4',
      'You can check the king first',
      'Bxf2+ is an in-between check that wins more material'
    ],
    educational: 'A Zwischenzug (German for "in-between move") is an intermediate move inserted before an expected recapture or continuation. It\'s often a check or threat that disrupts the opponent\'s plans and can win extra material or improve your position.',
    tags: ['advanced', 'zwischenzug', 'intermediate-move', 'tactics']
  }
];

/**
 * Get all puzzles for a specific theme
 */
export function getPuzzlesByTheme(theme: TacticalTheme): TacticalPuzzle[] {
  return TACTICAL_PUZZLES.filter(puzzle => puzzle.theme === theme);
}

/**
 * Get a specific puzzle by ID
 */
export function getPuzzleById(id: string): TacticalPuzzle | undefined {
  return TACTICAL_PUZZLES.find(puzzle => puzzle.id === id);
}

/**
 * Get puzzles by difficulty level
 */
export function getPuzzlesByDifficulty(difficulty: PuzzleDifficulty): TacticalPuzzle[] {
  return TACTICAL_PUZZLES.filter(puzzle => puzzle.difficulty === difficulty);
}

/**
 * Get all unique themes in the database
 */
export function getAllThemes(): TacticalTheme[] {
  const themes = new Set<TacticalTheme>();
  TACTICAL_PUZZLES.forEach(puzzle => themes.add(puzzle.theme));
  return Array.from(themes);
}

/**
 * Get theme display name
 */
export function getThemeDisplayName(theme: TacticalTheme): string {
  const displayNames: Record<TacticalTheme, string> = {
    'fork': 'Fork',
    'pin': 'Pin',
    'skewer': 'Skewer',
    'discovered-attack': 'Discovered Attack',
    'double-attack': 'Double Attack',
    'back-rank-mate': 'Back Rank Mate',
    'deflection': 'Deflection',
    'decoy': 'Decoy',
    'remove-defender': 'Remove the Defender',
    'sacrifice': 'Sacrifice',
    'zugzwang': 'Zugzwang',
    'in-between-move': 'In-Between Move (Zwischenzug)'
  };
  return displayNames[theme];
}

/**
 * Get theme icon
 */
export function getThemeIcon(theme: TacticalTheme): string {
  const icons: Record<TacticalTheme, string> = {
    'fork': '🔱',
    'pin': '📌',
    'skewer': '🗡️',
    'discovered-attack': '💥',
    'double-attack': '⚔️',
    'back-rank-mate': '👑',
    'deflection': '↗️',
    'decoy': '🎯',
    'remove-defender': '🛡️',
    'sacrifice': '💎',
    'zugzwang': '⏸️',
    'in-between-move': '⚡'
  };
  return icons[theme];
}
