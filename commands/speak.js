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

    delete state[from];

    save(state);

    await sock.sendMessage(from, {
      text: "🔊 Bot is now ACTIVE for this chat."
    });

  } catch (err) {
    console.log(err);
  }

};
