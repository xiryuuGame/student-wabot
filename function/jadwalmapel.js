import fs from 'fs';

const jadwalTugas = (msg, sock) => {
  // Read mapel.json file
  const rawData = fs.readFileSync('mapel.json');
  const jadwal = JSON.parse(rawData);
  

  let response = "*JADWAL PELAJARAN*\n\n";

  for (const hari in jadwal) {
    response += `*${hari}:*\n`;
    jadwal[hari].forEach((pelajaran) => {
      const formattedPelajaran = pelajaran.replace(/[\s.]/g, '-').toUpperCase();
      response += `• ${formattedPelajaran}\n`;
    });
    response += "\n";
  }

  response = response.trim();
  sock.sendMessage(msg.key.remoteJid, {
    text: response,
    contextInfo: {
      quotedMessage: msg.message,
      stanzaId: msg.key.id,
      participant: msg.key.participant || msg.key.remoteJid,
    },
  });
};

export default jadwalTugas;
