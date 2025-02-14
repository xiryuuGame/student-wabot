import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSortedTasks } from './utils.js';

/**
 * Deletes a task from the specified subject.
 *
 * @param {object} msg - The WhatsApp message object.
 * @param {object} sock - The WhatsApp socket object.
 */
const deleteTask = (msg, sock) => {
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    const match = text.match(/^!delete\s+([a-zA-Z_]+):(\d+)$/i);

    if (match) {
        const subject = match[1].toUpperCase();
        const taskIndex = parseInt(match[2], 10) - 1; // Adjust for 0-based indexing

        getSortedTasks(subject)
            .then(files => {
                if (files.length === 0) {
                    sock.sendMessage(msg.key.remoteJid, { text: `No tasks found for subject "${subject}".`, contextInfo: { quotedMessage: msg.message, stanzaId: msg.key.id, participant: msg.key.participant || msg.key.remoteJid } });
                    return;
                }

                if (taskIndex < 0 || taskIndex >= files.length) {
                    sock.sendMessage(msg.key.remoteJid, { text: `Invalid task index for subject "${subject}".`, contextInfo: { quotedMessage: msg.message, stanzaId: msg.key.id, participant: msg.key.participant || msg.key.remoteJid } });
                    return;
                }

                const fileToDelete = files[taskIndex];

                fs.unlink(fileToDelete, (err) => {
                    if (err) {
                        console.error(`Error deleting file ${fileToDelete}:`, err);
                        sock.sendMessage(msg.key.remoteJid, { text: `Error deleting task.`, contextInfo: { quotedMessage: msg.message, stanzaId: msg.key.id, participant: msg.key.participant || msg.key.remoteJid } });
                        return;
                    }

                    sock.sendMessage(msg.key.remoteJid, { text: `Task deleted successfully from subject "${subject}".`, contextInfo: { quotedMessage: msg.message, stanzaId: msg.key.id, participant: msg.key.participant || msg.key.remoteJid } });
                });
            })
            .catch(err => {
                console.error(`Error getting sorted tasks for ${subject}:`, err);
                sock.sendMessage(msg.key.remoteJid, { text: `Error reading subject directory.`, contextInfo: { quotedMessage: msg.message, stanzaId: msg.key.id, participant: msg.key.participant || msg.key.remoteJid } });
            });
    } else {
        sock.sendMessage(msg.key.remoteJid, { text: 'Invalid command format. Use !delete [subject]:[task_index]', contextInfo: { quotedMessage: msg.message, stanzaId: msg.key.id, participant: msg.key.participant || msg.key.remoteJid } });
    }
};

export default deleteTask;
