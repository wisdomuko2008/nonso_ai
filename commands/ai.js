const fs = require("fs");
const axios = require("axios");

const MEMORY_FILE = "./memory.json";

function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) return {};
  return JSON.parse(fs.readFileSync(MEMORY_FILE));
}

function saveMemory(data) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
}

module.exports = async (sock, msg, body, from) => {

  try {

    const prompt =
      body.replace("!ai", "").trim();

    if (!prompt) {
      return await sock.sendMessage(from, {
        text: "❌ Please provide a message."
      });
    }

    const userId = from;

    let memory = loadMemory();

    if (!memory[userId]) {
      memory[userId] = [];
    }

    // --------------------------
    // ADD USER MESSAGE TO MEMORY
    // --------------------------

    memory[userId].push({
      role: "user",
      text: prompt
    });

    // keep last 10 messages only
    memory[userId] =
      memory[userId].slice(-10);

    // typing indicator
    await sock.sendPresenceUpdate("composing", from);

    // --------------------------
    // CALL AI SERVER WITH MEMORY
    // --------------------------

    const response = await axios.post(
      "https://your-ai-server-link.com/ai",
      {
        prompt,
        history: memory[userId]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const aiText =
      response.data.response ||
      response.data.reply ||
      "No response from AI.";

    // --------------------------
    // SAVE AI RESPONSE TO MEMORY
    // --------------------------

    memory[userId].push({
      role: "assistant",
      text: aiText
    });

    saveMemory(memory);

    await sock.sendMessage(from, {
      text: `🤖 NONSO AI\n\n${aiText}`
    });

  } catch (err) {

    console.log("AI MEMORY ERROR:", err.message);

    await sock.sendMessage(from, {
      text: "❌ AI failed to respond."
    });

  }

};
