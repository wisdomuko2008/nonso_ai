module.exports = async (sock, msg, from) => {

  try {

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      "";

    const sender = msg.key.participant || msg.key.remoteJid;

    if (!body) return;

    const linkRegex =
      /(https?:\/\/|chat.whatsapp.com|wa.me|\.com|\.net|\.ng)/gi;

    if (linkRegex.test(body)) {

      await sock.sendMessage(from, {
        text:
          "🚫 Links are not allowed in this group!"
      });

      // delete message (if bot has permission)
      try {
        await sock.sendMessage(from, {
          delete: msg.key
        });
      } catch (e) {}

    }

  } catch (err) {
    console.log("ANTILINK ERROR:", err);
  }

};
