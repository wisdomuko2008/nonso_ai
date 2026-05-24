module.exports = async (sock, update) => {

  try {

    const { id, participants, action } = update;

    if (!id.endsWith("@g.us")) return;

    // --------------------------
    // WELCOME
    // --------------------------

    if (action === "add") {

      for (let user of participants) {

        await sock.sendMessage(id, {
          text:
            `👋 Welcome @${user.split("@")[0]} to the group!\n\nPowered by NONSO AI`,
          mentions: [user]
        });

      }

    }

    // --------------------------
    // GOODBYE
    // --------------------------

    if (action === "remove") {

      for (let user of participants) {

        await sock.sendMessage(id, {
          text:
            `😔 @${user.split("@")[0]} left the group.`,
          mentions: [user]
        });

      }

    }

  } catch (err) {
    console.log("WELCOME ERROR:", err);
  }

};
