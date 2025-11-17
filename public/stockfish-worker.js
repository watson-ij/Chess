// Stockfish Web Worker
// This worker loads Stockfish from unpkg CDN and forwards UCI commands

let stockfish = null;
let ready = false;

// Load Stockfish from unpkg (has good CORS support)
importScripts('https://unpkg.com/stockfish@14.0.0/stockfish.js');

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
