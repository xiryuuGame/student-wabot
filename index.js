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

// Constants
const SESSION_FILE = 'session';
const TEMP_DIR = './temp';
const SPAM_THRESHOLD = 9;
const SPAM_COOLDOWN_DURATION = 60000; // 1 minute
const TEMP_FILE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Helper Functions
/**
 * get message content
 * @param {Object} msg Message object
 * @returns {String} Message Content
 */
const getMessageContent = (msg) => {
    if (msg.message?.conversation) return msg.message.conversation;
    if (msg.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
    if (msg.message?.imageMessage?.caption) return msg.message.imageMessage.caption;
    if (msg.message?.videoMessage?.caption) return msg.message.videoMessage.caption;
    if (msg.message?.documentWithCaptionMessage?.message?.documentMessage?.caption) return msg.message.documentWithCaptionMessage.message.documentMessage.caption;
    if (msg.message?.buttonsResponseMessage?.selectedButtonId) return msg.message.buttonsResponseMessage.selectedButtonId;
    return '';
};

/**
 * Delete files from the temp directory
 */
const deleteTempFiles = () => {
    try {
        if (fs.existsSync(TEMP_DIR)) {
            fs.readdirSync(TEMP_DIR).forEach((file) => {
                const filePath = path.join(TEMP_DIR, file);
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            });
            console.log('All files in ./temp have been deleted.');
        } else {
            console.log('./temp directory does not exist.');
        }
    } catch (error) {
        console.error('Error deleting temp files:', error);
    }
};

/**
 * create temp directory if it does not exist
 */
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

// Command Map
const COMMANDS = {
    '!jadwal': { func: jadwal, params: [] },
    '!jadwalpiket': { func: jadwalpiket, params: [] },
    '!jadwalmapel': { func: jadwalTugas, params: [] },
    '!input': { func: inputFunction, params: [] },
    '!tugas': { func: listTugas, params: [] },
    '!ai': { func: aiFunction, params: [] },
    '!delete': { func: deleteTask, params: [] },
    '!topdf': { func: topdf, params: [] },
    '!scrape': { func: scrapeAndSummarize, params: [] },
    '!test': { func: test, params: [] },
};

async function connectToWhatsApp() {
    const logger = pino({ level: 'debug' });
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FILE);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        msgRetryCounterCache: undefined,
        generateHighQualityLinkPreview: true
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        console.log('connection update', update);
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error instanceof Boom && lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.error('Connection Closed:', lastDisconnect?.error || 'Unknown Reason');
            if (shouldReconnect) {
                console.log('Attempting to reconnect...');
                await connectToWhatsApp();
            } else {
                console.log('Connection closed. You are logged out or an unrecoverable error occurred.');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    const messageCounts = new Map();
    const spamCooldowns = new Map(); // New: Track cooldowns

    // Clear message counts and spam cooldowns
    setInterval(() => {
        messageCounts.clear();
        spamCooldowns.clear();
    }, 60000);

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'append') return;
        const msg = m.messages[0];
        if (!msg.message) return;

        const time = new Date(msg.messageTimestamp * 1000).toLocaleTimeString();
        let from = msg.key.remoteJid;

        // Format the "from" information for the console log
        if (isJidBroadcast(from)) {
            from = chalk.magenta('Broadcast');
        } else if (isJidGroup(from)) {
            from = chalk.cyan('Group:') + chalk.cyan(from);
        } else if (from.endsWith('@status')) {
            from = chalk.yellow("Status");
        } else {
            from = chalk.green(from);
        }

        const messageContent = getMessageContent(msg);
        console.log(chalk.gray('Raw Message:'), chalk.gray(JSON.stringify(msg, null, 2)));
        console.log(`[${chalk.blue(time)}][${from}]: ${messageContent}`);

        // Check for spam
        if (msg.key.fromMe) {
            const count = messageCounts.get(from) || 0;
            messageCounts.set(from, count + 1);

            if (count >= SPAM_THRESHOLD) {
                const lastSpamTime = spamCooldowns.get(from) || 0;
                const currentTime = Date.now();

                if (currentTime - lastSpamTime < SPAM_COOLDOWN_DURATION) {
                    console.log(chalk.red(`Spam detected from ${from} - Bot is in cooldown!`));
                    return; 
                } else {
                    spamCooldowns.set(from, currentTime);
                }
            }
        }

        // Dynamic command handling
        for (const command in COMMANDS) {
            const regex = new RegExp(`^${command}(\\s|$)`);
            if (regex.test(messageContent)) {
                try {
                    COMMANDS[command].func(...[msg, sock, ...COMMANDS[command].params]);
                } catch (err){
                    console.error(`Error executing command ${command}:`, err);
                }
                return; //Stop searching for commands
            }
        }
    });

    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        console.log(`Group ${id} - Participants ${action}:\n`, participants)
    })
}

// Initialize
ensureTempDirExists();
setInterval(deleteTempFiles, TEMP_FILE_CLEANUP_INTERVAL);
connectToWhatsApp().catch((error) => {
    console.error("An unexpected error occurred:", error);
});
