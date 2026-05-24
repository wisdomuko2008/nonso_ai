module.exports = async (
  sock,
  msg,
  from
) => {

  try {

    // group only
    if (!from.endsWith("@g.us")) {

      return await sock.sendMessage(
        from,
        {
          text:
            "❌ This command works only in groups."
        }
      );

    }

    const sender =
      msg.key.participant;

    // group metadata
    const metadata =
      await sock.groupMetadata(from);

    // admins
    const admins =
      metadata.participants
      .filter(p => p.admin)
      .map(p => p.id);

    // sender must be admin
    if (!admins.includes(sender)) {

      return await sock.sendMessage(
        from,
        {
          text:
            "❌ Only admins can use this command."
        }
      );

    }

    // bot must be admin
    const botNumber =
      sock.user.id.split(":")[0] +
      "@s.whatsapp.net";

    if (!admins.includes(botNumber)) {

      return await sock.sendMessage(
        from,
        {
          text:
            "❌ Bot must be admin first."
        }
      );

    }

    // mentioned user
    const mentioned =
      msg.message.extendedTextMessage
      ?.contextInfo
      ?.mentionedJid;

    if (
      !mentioned ||
      !mentioned[0]
    ) {

      return await sock.sendMessage(
        from,
        {
          text:
            "❌ Mention a user to promote.\n\nExample:\n!promote @user"
        }
      );

    }

    const user = mentioned[0];

    // already admin
    if (admins.includes(user)) {

      return await sock.sendMessage(
        from,
        {
          text:
            "⚠️ User is already an admin."
        }
      );

    }

    // promote user
    await sock.groupParticipantsUpdate(
      from,
      [user],
      "promote"
    );

    await sock.sendMessage(
      from,
      {
        text:
          "✅ User promoted successfully."
      }
    );

  } catch (err) {

    console.log(
      "PROMOTE ERROR:",
      err
    );

    await sock.sendMessage(
      from,
      {
        text:
          "❌ Failed to promote user."
      }
    );

  }

};
