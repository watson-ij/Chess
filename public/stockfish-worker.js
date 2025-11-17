// Stockfish Web Worker
// Loads Stockfish engine from same origin (no external CDN needed)

let stockfish = null;

// Load Stockfish from the same directory (served from public/)
// This avoids all CORS and CSP issues since it's same-origin
importScripts('./stockfish.js');

// Initialize Stockfish when loaded
if (typeof STOCKFISH !== 'undefined') {
  stockfish = STOCKFISH();

  stockfish.onmessage = function(line) {
    postMessage(line);
  };
} else {
  postMessage('error: Stockfish failed to load');
}

// Handle incoming messages from main thread
onmessage = function(e) {
  if (stockfish) {
    stockfish.postMessage(e.data);
  } else {
    postMessage('error: Stockfish not initialized');
  }
};
