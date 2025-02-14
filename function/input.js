import fs from 'fs';
import { format } from 'date-fns';

const allowedSubjects = [
    "AIJ", "ASJ", "B_INDO", "B_INGGRIS", "MTK", "MANDARIN", "PAI", "PJOK", "PKN", "RPL", "SEJARAH", "TLJ-PKK", "WAN"
];

export const inputFunction = (msg, sock) => {
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    // Regex yang dimodifikasi untuk menangani input multiline
    const regex = /^!input\s+mapel:\s*([\w\s]+)\s+judul:\s*(.+?)\s+isi tugas:\s*(.+)$/si;
    const match = text.match(regex);

    if (match) {
        const subject = match[1].trim().toUpperCase();
        const title = match[2].trim();
        const task = match[3].trim();
        const date = format(new Date(), 'dd-MM-yyyy');
        const filePath = `./function/mapel/${subject}/${date}.json`;

        if (!allowedSubjects.includes(subject.toUpperCase())) {
            const subjectList = allowedSubjects.map(subject => `- ${subject}`).join('\n');
            console.error(`Mata pelajaran '${subject}' tidak ditemukan. Mata pelajaran yang tersedia:\n${subjectList}`);
            sock.sendMessage(msg.key.remoteJid, { text: `Mata pelajaran '${subject}' tidak ditemukan. Mata pelajaran yang tersedia:\n${subjectList}`, contextInfo: {
                quotedMessage: msg.message,
                stanzaId: msg.key.id,
                participant: msg.key.participant || msg.key.remoteJid
            } });
            return;
        }

        const jsonData = {
            nama_mapel: subject,
            tugas_dibuat_pada: date,
            judul_tugas: title,
            isi_tugas: task
        };

        try {
            fs.mkdirSync(`./function/mapel/${subject}`, { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
            console.log(`File JSON berhasil dibuat: ${filePath}`);
            sock.sendMessage(msg.key.remoteJid, { text: `File JSON berhasil dibuat untuk mata pelajaran ${subject}.`, contextInfo: {
                quotedMessage: msg.message,
                stanzaId: msg.key.id,
                participant: msg.key.participant || msg.key.remoteJid
            }});
        } catch (error) {
            console.error(`Error saat membuat file JSON: ${error}`);
            sock.sendMessage(msg.key.remoteJid, { text: `Terjadi kesalahan saat membuat file JSON.`, contextInfo: {
                quotedMessage: msg.message,
                stanzaId: msg.key.id,
                participant: msg.key.participant || msg.key.remoteJid
            } });
        }
    } else {
            sock.sendMessage(msg.key.remoteJid, { text: "!input\nmapel: [nama mapel]\n\njudul: [judul]\n\nisi tugas: [tugas]\n\nContoh:\n!input mapel: MTK judul: Tugas Matematika isi tugas: Kerjakan soal nomor 1-10\n\n*Format input salah, hapus pesan ini jika ingin mengisi form*", contextInfo: {
                quotedMessage: msg.message,
                stanzaId: msg.key.id,
                participant: msg.key.participant || msg.key.remoteJid
            } });
        }
};