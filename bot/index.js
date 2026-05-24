const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const express = require("express");
const P = require("pino");
const readline = require("readline");

const app = express();

const PORT = process.env.PORT || 3000;
const PREFIX = process.env.PREFIX || "!";
const BOT_NAME = process.env.BOT_NAME || "NONSO AI";

let pairingCode = "";
let connectionStatus = "DISCONNECTED";
let sock;
let pairingRequested = false;

// -----------------------------
// WEB DASHBOARD
// -----------------------------

app.get("/", (req, res) => {

  res.send(`

  <!DOCTYPE html>
  <html>
  <head>

    <title>${BOT_NAME}</title>

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    >

    <style>

      body {
        font-family: Arial, sans-serif;
        background: #0f172a;
        color: white;
        text-align: center;
        padding: 40px;
      }

      .card {
        background: #1e293b;
        padding: 25px;
        border-radius: 15px;
        max-width: 500px;
        margin: auto;
      }

      h1 {
        color: #38bdf8;
      }

      .status {
        margin-top: 15px;
        font-size: 18px;
      }

      .online {
        color: #22c55e;
      }

      .offline {
        color: #ef4444;
      }

      .pair-box {
        margin-top: 25px;
        background: #0f172a;
        padding: 15px;
        border-radius: 10px;
      }

      .pair-code {
        font-size: 35px;
        letter-spacing: 5px;
        font-weight: bold;
        color: #22c55e;
      }

      .footer {
        margin-top: 25px;
        font-size: 14px;
        opacity: 0.7;
      }

    </style>

  </head>

  <body>

    <div class="card">

      <h1>${BOT_NAME}</h1>

      <div class="
        status
        ${connectionStatus === "CONNECTED"
          ? "online"
          : "offline"}
      ">
        STATUS: ${connectionStatus}
      </div>

      <div class="pair-box">

        ${
          pairingCode
          ? `
            <div class="pair-code">
              ${pairingCode}
            </div>

            <p>
              Open WhatsApp →
              Linked Devices →
              Link with phone number
            </p>
          `
          : `
            <p>
              Waiting for pairing code...
            </p>
          `
        }

      </div>

      <div class="footer">
        NONSO AI WhatsApp Bot
      </div>

    </div>

  </body>
  </html>

  `);

});

// -----------------------------
// KEEP RENDER ALIVE
// -----------------------------

app.get("/health", (req, res) => {
  res.json({
    status: "running",
    bot: BOT_NAME,
    connection: connectionStatus
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Dashboard running on port ${PORT}`);
});

// -----------------------------
// START BOT
// -----------------------------

async function startBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const { version } =
    await fetchLatestBaileysVersion();

  sock = makeWASocket({

    version,

    logger: P({
      level: "silent"
    }),

    auth: state,

    browser: [
      "NONSO AI",
      "Chrome",
      "1.0.0"
    ]

  });

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  // -----------------------------
  // PAIRING CODE
  // -----------------------------

  if (
    !sock.authState.creds.registered &&
    !pairingRequested
  ) {

    pairingRequested = true;

    const rl =
      readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

    rl.question(
      "Enter WhatsApp number (234xxxxxxxxxx): ",
      async (number) => {

        try {

          const code =
            await sock.requestPairingCode(number);

          pairingCode = code;

          console.log(
            `📲 Pairing Code: ${code}`
          );

          rl.close();

        } catch (err) {

          console.log(
            "PAIRING ERROR:",
            err
          );

        }

      }
    );

  }

  // -----------------------------
  // CONNECTION UPDATE
  // -----------------------------

  sock.ev.on(
    "connection.update",
    async (update) => {

      const {
        connection,
        lastDisconnect
      } = update;

      if (connection === "open") {

        connectionStatus = "CONNECTED";

        pairingCode = "";

        console.log(
          `✅ ${BOT_NAME} CONNECTED`
        );

      }

      if (connection === "close") {

        connectionStatus = "DISCONNECTED";

        console.log(
          "❌ CONNECTION CLOSED"
        );

        const shouldReconnect =
          lastDisconnect?.error?.output
            ?.statusCode !==
          DisconnectReason.loggedOut;

        if (shouldReconnect) {

          console.log(
            "🔄 RECONNECTING..."
          );

          startBot();

        }

      }

    }
  );

  // -----------------------------
  // MESSAGE LISTENER
  // -----------------------------

  sock.ev.on("messages.upsert", async ({ messages }) => {

  try {

    const msg = messages[0];

    if (!msg.message) return;

    const from = msg.key.remoteJid;

    const isGroup = from.endsWith("@g.us");
    const isDM = from.endsWith("@s.whatsapp.net");

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      "";

    const sender = isGroup
      ? msg.key.participant
      : from;

    console.log("MESSAGE:", body);

    // --------------------------
    // IGNORE EMPTY MESSAGES
    // --------------------------

    if (!body) return;

    // --------------------------
    // COMMAND ROUTER (GLOBAL)
    // --------------------------

    if (body.startsWith(PREFIX)) {

      const args = body.trim().split(" ");
      const command = args[0].toLowerCase();

      // --------------------------
      // LOAD COMMAND FILES
      // --------------------------

      const ai = require("./commands/ai");
      const ginfo = require("./commands/ginfo");
      const kick = require("./commands/kick");
      const promote = require("./commands/promote");
      const mute = require("./commands/mute");
      const unmute = require("./commands/unmute");
      const add = require("./commands/add");
      const reset = require("./commands/reset");

      // --------------------------
      // ROUTING COMMANDS
      // --------------------------

      if (command === "!ai") {
        return ai(sock, msg, body, from);
      }

      if (command === "!ginfo") {
        return ginfo(sock, msg, from);
      }

      if (command === "!kick") {
        return kick(sock, msg, from);
      }

      if (command === "!promote") {
        return promote(sock, msg, from);
      }

      if (command === "!mute") {
        return mute(sock, msg, from);
      }

      if (command === "!unmute") {
        return unmute(sock, msg, from);
      }

      if (command === "!add") {
        return add(sock, msg, from);
      }

      if (command === "!reset") {
        return reset(sock, msg, from);
      }

    }

    // --------------------------
    // DM AUTO RESPONSE (OPTIONAL)
    // --------------------------

    if (isDM) {

      if (body.toLowerCase().includes("hi")) {

        await sock.sendMessage(from, {
          text: `👋 Hello! I am NONSO AI.\nType !ai to chat with me.`
        });

      }

    }

  } catch (err) {

    console.log("MESSAGE HANDLER ERROR:", err);

  }

});
        // -----------------------------
        // TEST COMMAND
        // -----------------------------

        if (
          body === `${PREFIX}ping`
        ) {

          await sock.sendMessage(
            from,
            {
              text: "🏓 Pong"
            }
          );

        }

      } catch (err) {

        console.log(
          "MESSAGE ERROR:",
          err
        );

      }

    }
  );

}

startBot();
