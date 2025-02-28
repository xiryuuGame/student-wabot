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
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Import Command functions
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
import menu from './function/menu.js';


// Constants
const SESSION_FILE = 'session';
const TEMP_DIR = './temp';
const SPAM_THRESHOLD = 9;
const SPAM_COOLDOWN_DURATION = 60000; // 1 minute
const TEMP_FILE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const PAIRING_CODE_DELAY = 3000;
const RUNTIME_START = Date.now();


const getRuntime = () => {
    const now = Date.now();
    const diff = now - RUNTIME_START;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const formattedSeconds = (seconds % 60).toString().padStart(2, '0');
    const formattedMinutes = (minutes % 60).toString().padStart(2, '0');
    const formattedHours = (hours % 24).toString().padStart(2, '0');

    if (days > 0) {
        return `${days} days, ${formattedHours} hours, ${formattedMinutes} minutes, ${formattedSeconds} seconds`;
    } else if (hours > 0) {
        return `${formattedHours} hours, ${formattedMinutes} minutes, ${formattedSeconds} seconds`;
    } else if (minutes > 0) {
        return `${formattedMinutes} minutes, ${formattedSeconds} seconds`;
    } else {
        return `${formattedSeconds} seconds`;
    }
};


// Command Map
const PREFIXES = ['!', '/', '.', '\\'];

const COMMANDS = {
    'tugas': { func: listTugas, params: [] },
    'input': { func: inputFunction, params: [] },
    'delete': { func: deleteTask, params: [] },
    'jadwal': { func: jadwal, params: [] },
    'jadwalpiket': { func: jadwalpiket, params: [] },
    'jadwalmapel': { func: jadwalTugas, params: [] },
    'menu': { func: menu, params: [] },
    'ai': { func: aiFunction, params: [] },
    'scrape': { func: scrapeAndSummarize, params: [] },
    'topdf': { func: topdf, params: [] },
    'test': { func: test, params: [] },
};

// Helper Functions
const getMessageContent = (msg) => {
    const message = msg.message;
    if (!message) return '';

    const content = message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        message.documentWithCaptionMessage?.message?.documentMessage?.caption ||
        message.buttonsResponseMessage?.selectedButtonId ||
        (() => {
            try {
                return (JSON.parse(message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson)).id;
            } catch (e) {
                return '';
            }
        })() || '';
    return content;
};

const deleteTempFiles = () => {
    if (!fs.existsSync(TEMP_DIR)) {
        console.log('./temp directory does not exist.');
        return;
    }

    try {
        fs.readdirSync(TEMP_DIR).forEach((file) => {
            const filePath = path.join(TEMP_DIR, file);
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
        });
        console.log('All files in ./temp have been deleted.');
    } catch (error) {
        console.error('Error deleting temp files:', error);
    }
};

const ensureTempDirExists = () => {
    if (!fs.existsSync(TEMP_DIR)) {
        try {
            fs.mkdirSync(TEMP_DIR);
            console.log('./temp directory created.');
        } catch (error) {
            console.error('Error creating temp directory:', error);
        }
    }
};

const formatJid = (jid) => {
    if (isJidBroadcast(jid)) return chalk.magenta('Broadcast');
    if (isJidGroup(jid)) return chalk.cyan('Group:') + chalk.cyan(jid);
    if (jid.endsWith('@status')) return chalk.yellow('Status');
    return chalk.green(jid);
};

async function connectToWhatsApp() {
    const logger = pino({ level: 'silent' });
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FILE);

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: true,
    });

    if (!sock.authState.creds.registered) {
        const rawData = fs.readFileSync('nomor.json');
        const phoneNumber = JSON.parse(rawData)[0].replace(/\D/g, '');
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log(chalk.black(chalk.bgGreen('Your pairing code : ')), chalk.black(chalk.white(code)));
        }, PAIRING_CODE_DELAY);
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        console.log('connection update', update);

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error instanceof Boom && lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.error('Connection Closed:', lastDisconnect?.error || 'Unknown Reason');
            if (shouldReconnect) {
                console.log('Attempting to reconnect...');
                connectToWhatsApp().catch(console.error);
            } else {
                console.log('Connection closed. You are logged out or an unrecoverable error occurred.');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    const messageCounts = new Map();
    const spamCooldowns = new Map();

    setInterval(() => {
        messageCounts.clear();
        spamCooldowns.clear();
    }, 60000);

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'append' || !m.messages) return;
        const msg = m.messages[0];
        if (!msg.message) return;

        const time = new Date(msg.messageTimestamp * 1000).toLocaleTimeString();
        const from = msg.key.remoteJid;
        const formattedFrom = formatJid(from);
        const messageContent = getMessageContent(msg);

        try {
            console.log(chalk.gray('Raw Message:'), chalk.gray(JSON.stringify(msg, null, 2)));
            console.log(`[${chalk.blue(time)}][${formattedFrom}]: ${messageContent}`);
        } catch (error) {
            console.error('Error logging message:', error);
        }

        if (msg.key.fromMe) {
            const count = (messageCounts.get(from) || 0) + 1;
            messageCounts.set(from, count);

            if (count >= SPAM_THRESHOLD) {
                const lastSpamTime = spamCooldowns.get(from) || 0;
                const currentTime = Date.now();

                if (currentTime - lastSpamTime < SPAM_COOLDOWN_DURATION) {
                    console.log(chalk.red(`Spam detected from ${from} - Bot is in cooldown!`));
                    return;
                }
                spamCooldowns.set(from, currentTime);
            }
        }

        for (const prefix of PREFIXES) {
            for (const command in COMMANDS) {
                const regex = new RegExp(`^${prefix}${command}(\\s|$)`);
                if (regex.test(messageContent)) {
                    try {
                        COMMANDS[command].func(msg, sock, ...COMMANDS[command].params);
                    } catch (err) {
                        console.error(`Error executing command ${command}:`, err);
                    }
                    return;
                }
            }
        }
    });

    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        console.log(`Group ${id} - Participants ${action}:\n`, participants);
    });
}

ensureTempDirExists();
setInterval(deleteTempFiles, TEMP_FILE_CLEANUP_INTERVAL);
connectToWhatsApp().catch(console.error);

export { COMMANDS, getRuntime };
