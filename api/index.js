// Vercel serverless function entry point
const path = require('path');

// Import the compiled Express app
let app;

module.exports = async (req, res) => {
  if (!app) {
    try {
      // Try to load from dist
      const handler = require(path.join(__dirname, '..', 'dist', 'index.js'));
      app = handler.default || handler;
    } catch (error) {
      console.error('Failed to load app:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
      return;
    }
  }

  return app(req, res);
};
