// Vercel serverless function entry point
module.exports = async (req, res) => {
  const handler = require('../dist/index.js');
  const app = handler.default || handler;
  return app(req, res);
};
