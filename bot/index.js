const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const express = require("express");
const P = require("pino");
const readline = require("readline");
const fs = require("fs");

// -----------------------------
// IMPORT COMMANDS
// -----------------------------

const ai = require("./commands/ai");
const ginfo = require("./commands/ginfo");
const kick = require("./commands/kick");
const promote = require("./commands/promote");
const mute = require("./commands/mute");
const unmute = require("./commands/unmute");
const add = require("./commands/add");
const reset = require("./commands/reset");
const quiet = require("./commands/quiet");
const speak = require("./commands/speak");

// -----------------------------
// IMPORT EVENTS
// -----------------------------

const antilink = require("./events/antilink");
const reactions = require("./events/reactions");
const welcome = require("./events/welcome");

// -----------------------------
// APP SETUP
// -----------------------------

const app = express();
const PORT = process.env.PORT || 3000;

const PREFIX = process.env.PREFIX || "!";
const BOT_NAME = process.env.BOT_NAME || "NONSO AI";

let sock;
let pairingCode = "";
let connectionStatus = "DISCONNECTED";
let pairingRequested = false;

// -----------------------------
// BOT STATE (quiet/speak)
// -----------------------------

const STATE_FILE = "./botstate.json";

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE));
}

function saveState(data) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
}

// -----------------------------
// DASHBOARD
// -----------------------------

app.get("/", (req, res) => {

  res.send(`

  <!DOCTYPE html>
  <html>
  <head>
    <title>${BOT_NAME}</title>

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <style>
      body {
        font-family: Arial;
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

      h1 { color: #38bdf8; }

      .status { margin-top: 10px; }

      .online { color: #22c55e; }
      .offline { color: #ef4444; }

      .pair {
        margin-top: 20px;
        font-size: 30px;
        letter-spacing: 4px;
        color: #22c55e;
        font-weight: bold;
      }

    </style>
  </head>

  <body>

    <div class="card">

      <h1>${BOT_NAME}</h1>

      <div class="status ${connectionStatus === "CONNECTED" ? "online" : "offline"}">
        STATUS: ${connectionStatus}
      </div>

      <div class="pair">
        ${pairingCode || "WAITING FOR PAIRING CODE..."}
      </div>

      <p>NONSO AI WhatsApp Bot</p>

    </div>

  </body>
  </html>

  `);

});

app.listen(PORT, () => {
  console.log("🌐 Dashboard running on port", PORT);
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
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: ["NONSO AI", "Chrome", "1.0.0"]

  });

  sock.ev.on("creds.update", saveCreds);

  // -----------------------------
  // PAIRING CODE
  // -----------------------------

  if (!sock.authState.creds.registered && !pairingRequested) {

    pairingRequested = true;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("Enter WhatsApp number: ", async (number) => {

      try {

        const code = await sock.requestPairingCode(number);

        pairingCode = code;

        console.log("PAIRING CODE:", code);

        rl.close();

      } catch (err) {
        console.log("PAIRING ERROR:", err);
      }

    });

  }

  // -----------------------------
  // CONNECTION
  // -----------------------------

  sock.ev.on("connection.update", (update) => {

    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      connectionStatus = "CONNECTED";
      pairingCode = "";
      console.log("✅ NONSO AI CONNECTED");
    }

    if (connection === "close") {

      connectionStatus = "DISCONNECTED";

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) startBot();

    }

  });

  // -----------------------------
  // MESSAGES
  // -----------------------------

  sock.ev.on("messages.upsert", async ({ messages }) => {

    try {

      const msg = messages[0];
      if (!msg.message) return;

      const from = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");

      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";

      if (!body) return;

      const state = loadState();
      const isQuiet = state[from] === "quiet";

      console.log("MESSAGE:", body);

      // -----------------------------
      // EVENTS
      // -----------------------------

      antilink(sock, msg, from);
      reactions(sock, msg, from);

      // -----------------------------
      // GROUP COMMANDS
      // -----------------------------

      if (isGroup && body.startsWith(PREFIX)) {

        if (isQuiet) {
          return sock.sendMessage(from, {
            text: "🔇 Bot is in quiet mode for this chat."
          });
        }

        const args = body.split(" ");
        const command = args[0].toLowerCase();

        if (command === "!ai") return ai(sock, msg, body, from);
        if (command === "!ginfo") return ginfo(sock, msg, from);
        if (command === "!kick") return kick(sock, msg, from);
        if (command === "!promote") return promote(sock, msg, from);
        if (command === "!mute") return mute(sock, msg, from);
        if (command === "!unmute") return unmute(sock, msg, from);
        if (command === "!add") return add(sock, msg, from);
        if (command === "!reset") return reset(sock, msg, from);
        if (command === "!quiet") return quiet(sock, msg, from);
        if (command === "!speak") return speak(sock, msg, from);

      }

      // -----------------------------
      // DM MODE (AUTO AI)
      // -----------------------------

      if (!isGroup) {

        if (isQuiet) return;

        const fakeMsg = {
          ...msg,
          message: {
            conversation: `!ai ${body}`
          }
        };

        return ai(sock, fakeMsg, fakeMsg.message.conversation, from);

      }

    } catch (err) {
      console.log("MESSAGE ERROR:", err);
    }

  });

  // -----------------------------
  // WELCOME EVENTS
  // -----------------------------

  sock.ev.on("group-participants.update", (update) => {
    welcome(sock, update);
  });

}

startBot();
