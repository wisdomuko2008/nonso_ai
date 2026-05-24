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

    const body = msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      "";

    const args = body.trim().split(" ");
    const cmd = args[0].toLowerCase();

    let durationMs = 0;

    // --------------------------
    // HANDLE DIFFERENT FORMATS
    // --------------------------

    if (args.length === 1) {
      // !mute (no time) => permanent until unmute
      durationMs = null;
    }

    if (args.length >= 3) {

      const value = parseInt(args[1]);
      const unit = args[2].toLowerCase();

      if (unit.startsWith("sec")) {
        durationMs = value * 1000;
      }

      else if (unit.startsWith("min")) {
        durationMs = value * 60 * 1000;
      }

      else if (unit.startsWith("hour")) {
        durationMs = value * 60 * 60 * 1000;
      }

      else {
        return await sock.sendMessage(from, {
          text:
            "❌ Invalid format.\nUse:\n!mute\n!mute 10 secs\n!mute 5 minutes\n!mute 2 hours"
        });
      }
    }

    // --------------------------
    // APPLY MUTE
    // --------------------------

    await sock.groupSettingUpdate(
      from,
      "announcement"
    );

    await sock.sendMessage(from, {
      text:
        durationMs
          ? `🔇 Group muted for ${args[1]} ${args[2]}`
          : "🔇 Group muted (no time limit)"
    });

    // --------------------------
    // AUTO UNMUTE TIMER
    // --------------------------

    if (durationMs) {

      setTimeout(async () => {

        try {

          await sock.groupSettingUpdate(
            from,
            "not_announcement"
          );

          await sock.sendMessage(from, {
            text: "🔊 Group auto-unmuted"
          });

        } catch (e) {
          console.log("AUTO UNMUTE ERROR:", e);
        }

      }, durationMs);

    }

  } catch (err) {

    console.log("MUTE ERROR:", err);

    await sock.sendMessage(from, {
      text: "❌ Failed to mute group."
    });

  }

};
