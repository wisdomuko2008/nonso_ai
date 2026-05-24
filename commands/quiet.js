const fs = require("fs");

const FILE = "./botstate.json";

function load() {
  return JSON.parse(fs.readFileSync(FILE));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

module.exports = async (sock, msg, from) => {

  try {

    let state = load();

    state[from] = "quiet";

    save(state);

    await sock.sendMessage(from, {
      text: "🔇 Bot is now in QUIET mode for this chat."
    });

  } catch (err) {
    console.log(err);
  }

};
