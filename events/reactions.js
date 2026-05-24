module.exports = async (sock, msg, from) => {

  try {

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      "";

    if (!body) return;

    const text = body.toLowerCase();

    // --------------------------
    // NONSO TRIGGER
    // --------------------------

    if (text.includes("nonso")) {

      await sock.sendMessage(from, {
        react: {
          text: "🤖",
          key: msg.key
        }
      });

    }

    // optional extra reactions
    if (text.includes("ai")) {

      await sock.sendMessage(from, {
        react: {
          text: "🧠",
          key: msg.key
        }
      });

    }

  } catch (err) {
    console.log("REACTION ERROR:", err);
  }

};
