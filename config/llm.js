const dotenv = require("dotenv");
const { ChatCerebras } = require("@langchain/cerebras");

dotenv.config();

const llm = new ChatCerebras({
  model: "llama3.1-8b",
  temperature: 0,
  maxRetries: 2,
  apiKey: process.env.CEREBRAS_API_KEY, // ✅ Make sure this is set in your .env file
});

module.exports = { llm };
