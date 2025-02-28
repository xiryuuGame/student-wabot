import { format } from "date-fns";
import { COMMANDS, getRuntime } from "../index.js";

const bot = {};
bot.name = `XIRYUU BOT`;
bot.owner = `Cuma Pelajar biasa`;

const menu = (msg, sock) => {
  try {
    const text = `
╭─❮ *${bot.name}* ❯─╮
│  
│  🤖 *Bot Info*
│   • *Owner:* ${bot.owner}
│   • *Runtime:* ${getRuntime()}
│   • *Prefix:* Multi Prefix (*! / . \\*)
│
│  📚 *Command Categories*
│   • *Tugas*
│   • *Info*
│   • *Utilities*
│
╰───────────────╯
        `;

    const categorizedCommands = {
      Tugas: [],
      Info: [],
      Utilities: [],
    };

    // Categorize commands and add descriptions
    for (const commandName in COMMANDS) {
      let description = "";
      switch (commandName) {
        // Tugas (Most Important)
        case "tugas":
          description = "📄 Lihat daftar semua tugas.";
          categorizedCommands["Tugas"].push({
            command: commandName,
            description,
          });
          break;
        case "input":
          description = "➕ Tambahkan tugas baru.";
          categorizedCommands["Tugas"].push({
            command: commandName,
            description,
          });
          break;
        case "delete":
          description = "🗑️ Hapus tugas yang sudah selesai.";
          categorizedCommands["Tugas"].push({
            command: commandName,
            description,
          });
          break;
        // Info (Important)
        case "jadwal":
          description = "📅 Lihat menu untuk jadwal.";
          categorizedCommands["Info"].push({
            command: commandName,
            description,
          });
          break;
        case "jadwalmapel":
          description = "📚 Lihat jadwal mata pelajaran.";
          categorizedCommands["Info"].push({
            command: commandName,
            description,
          });
          break;
        case "jadwalpiket":
          description = "🗓️ Lihat jadwal piket.";
          categorizedCommands["Info"].push({
            command: commandName,
            description,
          });
          break;
        case "menu":
          description = "ℹ️ Tampilkan menu bantuan (perintah).";
          categorizedCommands["Info"].push({
            command: commandName,
            description,
          });
          break;
        // Utilities (Less Important)
        case "ai":
          description = "🧠 Chat dengan kecerdasan buatan (AI).";
          categorizedCommands["Utilities"].push({
            command: commandName,
            description,
          });
          break;
        case "scrape":
          description = "🌐 Rangkum isi website.";
          categorizedCommands["Utilities"].push({
            command: commandName,
            description,
          });
          break;
        case "topdf":
          description = "🖼️ Ubah gambar menjadi file PDF.";
          categorizedCommands["Utilities"].push({
            command: commandName,
            description,
          });
          break;
        case "test":
          description = "🧪 test.";
          categorizedCommands["Utilities"].push({
            command: commandName,
            description,
          });
          break;
        default:
          description = `Command ${commandName}`;
          categorizedCommands["Utilities"].push({
            command: commandName,
            description,
          });
          break;
      }
    }

    const sections = [];
    sections.push({
      title: `Pilih Salah Satu`,
      rows: [],
    });
    for (const category in categorizedCommands) {
      const rows = categorizedCommands[category].map((cmd) => ({
        header: `${cmd.command}`,
        title: `/${cmd.command}`, // Display with prefix
        description: cmd.description,
        id: `!${cmd.command}`,
      }));
      const firstCommandDescription =
        categorizedCommands[category][0]?.description || "";

      sections.push({
        title: category,
        highlight_label: `${firstCommandDescription}`, // Set highlight_label to description
        rows: rows,
      });
    }

    sock.sendMessage(
      msg.key.remoteJid,
      {
        text: text,
        footer: `XIRYUU - ${format(new Date(), "dd-MM-yyyy")}`,
        buttons: [
          {
            buttonId: ".tugas",
            buttonText: {
              displayText: "Tugas",
            },
            type: 1,
          },
          {
            buttonId: ".jadwal",
            buttonText: {
              displayText: "Jadwal",
            },
            type: 1,
          },
          {
            buttonId: " ",
            buttonText: {
              displayText: "Select Menu",
            },
            type: 4,
            nativeFlowInfo: {
              name: "single_select",
              paramsJson: JSON.stringify({
                title: "MENU",
                sections: sections,
              }),
            },
          },
        ],
        headerType: 1,
        viewOnce: true,
      }
    );
  } catch (error) {
    console.error("Error in menu:", error);
    sock.sendMessage(msg.key.remoteJid, {
      text: "An error occurred.",
      contextInfo: {
        quotedMessage: msg.message,
        stanzaId: msg.key.id,
        participant: msg.key.participant || msg.key.remoteJid,
      },
    });
  }
};

export default menu;
