const jadwalTugas = (msg, sock) => {
  if (msg.message?.conversation === '!jadwal' || msg.message?.extendedTextMessage?.text === '!jadwal') {
    const jadwal = {
      Senin: ["TLJ / PKK", "B. Inggris", "ASJ"],
      Selasa: ["RPL", "PAI", "PJOK", "MTK"],
      Rabu: ["AIJ", "B. Inggris", "RPL", "TLJ / PKK"],
      Kamis: ["PKN", "AIJ", "Mandarin", "Sejarah"],
      Jumat: ["B. Indo", "WAN"],
    };

    let response = "*JADWAL PELAJARAN*\n\n";

    for (const hari in jadwal) {
      response += `*${hari}:*\n`;
      jadwal[hari].forEach((pelajaran) => {
        response += `• ${pelajaran}\n`;
      });
      response += "\n";
    }

    response = response.trim(); // Remove trailing newline
    sock.sendMessage(msg.key.remoteJid, { text: response, contextInfo: {
        quotedMessage: msg.message,
        stanzaId: msg.key.id,
        participant: msg.key.participant || msg.key.remoteJid
    } });
  }
};

export default jadwalTugas;
