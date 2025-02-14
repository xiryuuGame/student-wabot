import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format, parse } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Lists available assignments for each subject.
 *
 * @param {object} msg - The WhatsApp message object.
 * @param {object} sock - The WhatsApp socket object.
 */
const listTugas = (msg, sock) => {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const mapelDir = path.resolve(__dirname, '..', 'function', 'mapel');
        let tugasList = '';
        let counter = 1;

        fs.readdir(mapelDir, { withFileTypes: true }, (err, subjects) => {
            if (err) {
                console.error('Error reading mapel directory:', err);
                sock.sendMessage(msg.key.remoteJid, { text: 'Error reading assignment data.', contextInfo: { quotedMessage: msg.message, stanzaId: msg.key.id, participant: msg.key.participant || msg.key.remoteJid } });
                return;
            }

            const subjectGroups = {};
            subjects.forEach(subject => {
                if (subject.isDirectory()) {
                    subjectGroups[subject.name] = [];
                }
            });

            subjects.forEach(subject => {
                if (subject.isDirectory()) {
                    const subjectPath = path.join(mapelDir, subject.name);
                    fs.readdir(subjectPath, (err, files) => {
                        if (err) {
                            console.error(`Error reading subject directory ${subject.name}:`, err);
                            return;
                        }
                        if (files.length > 0) {
                            files.forEach(file => {
                                const filePath = path.join(subjectPath, file);
                                fs.readFile(filePath, 'utf8', (err, data) => {
                                    if (err) {
                                        console.error(`Error reading file ${filePath}:`, err);
                                        return;
                                    }

                                    try {
                                        const jsonData = JSON.parse(data);
                                        const formattedDate = format(parse(jsonData.tugas_dibuat_pada, 'dd-MM-yyyy', new Date()), 'dd MMMM yyyy', { locale: id });
                                        subjectGroups[subject.name].push({ formattedDate, jsonData });
                                    } catch (error) {
                                        console.error(`Error parsing JSON in file ${filePath}:`, error);
                                    }
                                });
                            });
                        }
                    });
                }
            });

            setTimeout(() => {
                const subjectsWithTasks = Object.keys(subjectGroups).filter(subject => subjectGroups[subject].length > 0);
                if (subjectsWithTasks.length === 0) {
                    sock.sendMessage(msg.key.remoteJid, { text: 'Tidak ada tugas yang tersedia.', contextInfo: { quotedMessage: msg.message, stanzaId: msg.key.id, participant: msg.key.participant || msg.key.remoteJid } });
                    return;
                }
                let output = 'Tugas yang tersedia:\n';
                subjectsWithTasks.forEach((subject, index) => {
                    output += `${index + 1}. [${subject}]\n`;
                    subjectGroups[subject].forEach(item => {
                        // Modifikasi di sini untuk menambahkan "> " di setiap baris isi tugas, kecuali baris kosong dan list
                        const isiTugas = item.jsonData.isi_tugas
                            .split('\n')
                            .map(line => {
                                if (line.trim() === '' || line.startsWith(' ') ||  line.startsWith('* ') || line.startsWith('- ')) {
                                    return line; // Biarkan baris kosong dan list tanpa "> "
                                } else {
                                    return `> ${line}`; // Tambahkan "> " jika bukan baris kosong atau list
                                }
                            })
                            .join('\n');

                        output += `* ${item.formattedDate} (${item.jsonData.judul_tugas}):\n${isiTugas}\n`;
                    });
                });
                sock.sendMessage(msg.key.remoteJid, { text: output, contextInfo: { quotedMessage: msg.message, stanzaId: msg.key.id, participant: msg.key.participant || msg.key.remoteJid } });
            }, 500);
        });
    } catch (error) {
        console.error('Error in listTugas:', error);
        sock.sendMessage(msg.key.remoteJid, { text: 'An error occurred.', contextInfo: { quotedMessage: msg.message, stanzaId: msg.key.id, participant: msg.key.participant || msg.key.remoteJid } });
    }
};

export default listTugas;