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

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      "";

    const args = body.trim().split(" ");

    if (args.length < 2) {
      return await sock.sendMessage(from, {
        text:
          "❌ Usage:\n!add 234xxxxxxxxxx"
      });
    }

    let number = args[1].replace(/[^0-9]/g, "");

    if (!number.startsWith("234")) {
      return await sock.sendMessage(from, {
        text: "❌ Please use correct format with country code (e.g. 234xxxxxxxxxx)"
      });
    }

    const jid = number + "@s.whatsapp.net";

    try {

      // --------------------------
      // TRY DIRECT ADD
      // --------------------------

      await sock.groupParticipantsUpdate(
        from,
        [jid],
        "add"
      );

      await sock.sendMessage(from, {
        text: "✅ User added successfully."
      });

    } catch (err) {

      console.log("ADD ERROR (fallback triggered):", err);

      try {

        // --------------------------
        // FALLBACK: INVITE LINK
        // --------------------------

        const code =
          await sock.groupInviteCode(from);

        const inviteLink =
          "https://chat.whatsapp.com/" + code;

        await sock.sendMessage(jid, {
          text:
            `👋 You were invited to join a group:\n\n${inviteLink}`
        });

        await sock.sendMessage(from, {
          text:
            "⚠️ Couldn't add user directly (privacy restriction).\n📩 Invite link sent successfully."
        });

      } catch (err2) {

        console.log("INVITE ERROR:", err2);

        await sock.sendMessage(from, {
          text:
            "❌ Failed to add user and failed to send invite link."
        });

      }

    }

  } catch (err) {

    console.log("ADD COMMAND ERROR:", err);

    await sock.sendMessage(from, {
      text: "❌ Error processing add command."
    });

  }

};
