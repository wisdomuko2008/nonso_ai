const axios = require("axios");

module.exports = async (
  sock,
  msg,
  body,
  from
) => {

  try {

    const prompt =
      body.replace("!ai", "").trim();

    if (!prompt) {

      return await sock.sendMessage(
        from,
        {
          text:
            "❌ Please provide a prompt.\n\nExample:\n!ai Hello"
        }
      );

    }

    // typing indicator
    await sock.sendPresenceUpdate(
      "composing",
      from
    );

    // AI SERVER LINK
    const response =
      await axios.post(

        "https://your-ai-server-link.com/ai",

        {
          prompt
        },

        {
          headers: {
            "Content-Type":
              "application/json"
          }
        }

      );

    const aiResponse =

      response.data.response ||

      response.data.reply ||

      response.data.message ||

      "No response from AI.";

    await sock.sendMessage(
      from,
      {
        text:
          `🤖 NONSO AI\n\n${aiResponse}`
      }
    );

  } catch (err) {

    console.log(
      "AI ERROR:",
      err.response?.data || err.message
    );

    await sock.sendMessage(
      from,
      {
        text:
          "❌ Failed to get AI response."
      }
    );

  }

};
