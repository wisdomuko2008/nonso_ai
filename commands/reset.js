const fs = require("fs");

module.exports = async (sock, msg, from) => {

  try {

    if (!from.endsWith("@g.us")) {
      return await sock.sendMessage(from, {
        text: "❌ This command works only in groups."
      });
    }

    const sender = msg.key.participant;

    const metadata = await sock.groupMetadata(from);

    const admins = metadata.participants
      .filter(p => p.admin)
      .map(p => p.id);

    // admin check
    if (!admins.includes(sender)) {
      return await sock.sendMessage(from, {
        text: "❌ Only admins can use this command."
      });
    }

    const botNumber =
      sock.user.id.split(":")[0] + "@s.whatsapp.net";

    if (!admins.includes(botNumber)) {
      return await sock.sendMessage(from, {
        text: "❌ Bot must be admin first."
      });
    }

    // --------------------------
    // RESET WARNINGS FILE
    // --------------------------

    const file = "./warnings.json";

    fs.writeFileSync(
      file,
      JSON.stringify({}, null, 2)
    );

    await sock.sendMessage(from, {
      text:
        "🔄 Bot reset successfully.\n\n✔ Warnings cleared\n✔ Group data refreshed"
    });

  } catch (err) {

    console.log("RESET ERROR:", err);

    await sock.sendMessage(from, {
      text: "❌ Failed to reset bot data."
    });

  }

};
