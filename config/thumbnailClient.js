const OpenAI = require("openai");

const thumbnailClient = new OpenAI({
  baseURL: "https://api.studio.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY,
});

module.exports = { thumbnailClient };
