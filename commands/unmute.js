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
    // UNMUTE GROUP
    // --------------------------

    await sock.groupSettingUpdate(
      from,
      "not_announcement"
    );

    await sock.sendMessage(from, {
      text: "🔊 Group unmuted successfully."
    });

  } catch (err) {

    console.log("UNMUTE ERROR:", err);

    await sock.sendMessage(from, {
      text: "❌ Failed to unmute group."
    });

  }

};
