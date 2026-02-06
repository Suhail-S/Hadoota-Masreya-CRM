// Vercel serverless function entry point
module.exports = async (req, res) => {
  const handler = require('../dist/vercel.cjs');
  const fn = handler.default || handler;
  return fn(req, res);
};
