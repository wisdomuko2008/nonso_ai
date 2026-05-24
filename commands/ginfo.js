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

    // fetch metadata
    const metadata =
      await sock.groupMetadata(from);

    const groupName =
      metadata.subject;

    const members =
      metadata.participants.length;

    const admins =
      metadata.participants.filter(
        p => p.admin !== null
      ).length;

    const owner =
      metadata.owner
      ? metadata.owner.split("@")[0]
      : "Unknown";

    const desc =
      metadata.desc ||
      "No description";

    const created =
      metadata.creation
      ? new Date(
          metadata.creation * 1000
        ).toLocaleString()
      : "Unknown";

    const text = `
🤖 NONSO AI GROUP INFO

📛 Name:
${groupName}

👥 Members:
${members}

🛡️ Admins:
${admins}

👑 Owner:
${owner}

📝 Description:
${desc}

📅 Created:
${created}
`;

    await sock.sendMessage(
      from,
      {
        text
      }
    );

  } catch (err) {

    console.log(
      "GINFO ERROR:",
      err
    );

    await sock.sendMessage(
      from,
      {
        text:
          "❌ Failed to fetch group info."
      }
    );

  }

};
