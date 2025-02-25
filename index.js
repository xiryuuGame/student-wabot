import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    isJidBroadcast,
    isJidGroup,
} from '@fizzxydev/baileys-pro';

import pino from 'pino';
import { Boom } from '@hapi/boom';
import chalk from "chalk";
import { inputFunction } from './function/input.js';
import listTugas from './function/tugas.js';
import aiFunction from './function/aiFunction.js';
import jadwalTugas from './function/jadwalmapel.js';
import deleteTask from './function/delete.js';
import topdf from './function/topdf.js';
import scrapeAndSummarize from './function/scrape.js';
import test from './function/test.js';
import jadwal from './function/jadwal.js';
import jadwalpiket from './function/jadwalpiket.js';

async function connectToWhatsApp() {
    const logger = pino({ level: 'debug' });
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const { state, saveCreds } = await useMultiFileAuthState('session');

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }), 
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })), 
        },
        msgRetryCounterCache: undefined,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            return {
                conversation: 'pesan ini hanya pesan pengalihan, abaikan saja'
            }
        }
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error) {
                const shouldReconnect = (lastDisconnect.error instanceof Boom) ? 
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut :
                    false;

                if (shouldReconnect) {
                    await connectToWhatsApp();
                } else {
                console.log('Connection closed. You are logged out.');
            }
            } else {
                console.log('Connection closed.');
        }
        }
    
        console.log('connection update', update);
    });

    sock.ev.on('creds.update', saveCreds);

    const messageCounts = new Map();
    setInterval(() => messageCounts.clear(), 60000);

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'append') return;
        const msg = m.messages[0];
        if (!msg.message) return;
        const time = new Date(msg.messageTimestamp * 1000).toLocaleTimeString();
        let from = msg.key.remoteJid;

        if (isJidBroadcast(from)) {
            from = chalk.magenta('Broadcast');
        } else if (isJidGroup(from)) {
            from = chalk.cyan('Group:') + chalk.cyan(from);
        } else if (from.endsWith('@status')) { 
            from = chalk.yellow("Status");
        } else {
            from = chalk.green(from); 
        }
        
        let text = '';
        if (msg.message?.conversation) {
            text = msg.message.conversation;
        } else if (msg.message?.extendedTextMessage?.text) {
            text = msg.message.extendedTextMessage.text;
        } else if (msg.message?.imageMessage?.caption) {
            text = msg.message.imageMessage.caption;
        } else if (msg.message?.videoMessage?.caption) {
            text = msg.message.videoMessage.caption;
        } else if (msg.message?.documentWithCaptionMessage?.message?.documentMessage?.caption) {
            text = msg.message.documentWithCaptionMessage.message.documentMessage.caption;
        } else if (msg.message?.buttonsResponseMessage?.selectedButtonId) {
            text = msg.message.buttonsResponseMessage.selectedButtonId;
        }

        console.log(chalk.gray('Raw Message:'), chalk.gray(JSON.stringify(msg, null, 2)));
        console.log(`[${chalk.blue(time)}][${from}]: ${text}`);

        if (msg.key.fromMe) {
            const count = messageCounts.get(from) || 0;
            messageCounts.set(from, count + 1);
            if (count >= 9) {
                console.log('Spam detected! Shutting down bot...');
                process.exit(0);
            }
        }

         
        const commands = {
            '!jadwal': { func: jadwal, params: [msg, sock] },
            '!jadwalpiket': { func: jadwalpiket, params: [msg, sock] },
            '!jadwalmapel': { func: jadwalTugas, params: [msg, sock] },
            '!input': { func: inputFunction, params: [msg, sock] },
            '!tugas': { func: listTugas, params: [msg, sock] },
            '!ai': { func: aiFunction, params: [msg, sock] },
            '!delete': { func: deleteTask, params: [msg, sock]},
            '!topdf': { func: topdf, params: [msg, sock] },
            '!scrape': { func: scrapeAndSummarize, params: [msg, sock] },
            '!test': { func: test, params: [msg, sock] },
        };

        Object.keys(commands).forEach((command) => {
            const regex = new RegExp(`^${command}(\\s|$)`);
            if (regex.test(text)) {
                commands[command].func(...commands[command].params);
    }
        });
    
    });

    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        console.log(`Group ${id} - Participants ${action}:\n`, participants)
    })
}

connectToWhatsApp();
