const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");

const PREFIX = process.env.PREFIX || "!";
const BOT_NAME = process.env.BOT_NAME || "FLEXI AI";

async function startBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const { version } =
    await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {

    const {
      connection,
      qr,
      lastDisconnect
    } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log(`✅ ${BOT_NAME} CONNECTED`);
    }

    if (connection === "close") {

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ CONNECTION CLOSED");

      if (shouldReconnect) {
        startBot();
      }
    }

  });

  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0];

    if (!msg.message) return;

    const from = msg.key.remoteJid;

    const isGroup = from.endsWith("@g.us");

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    console.log("MESSAGE:", body);

  });

}

startBot();
