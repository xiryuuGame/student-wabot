import fs from 'fs'

const jadwalpiket = (msg, sock) => {
    try {
        const password = 'hahahihi'
        const msg = msg.message.conversation || msg.message.extendedTextMessage.text || msg.message.imageMessage.caption || msg.message.videoMessage.caption || msg.message.documentWithCaptionMessage.message.documentMessage.caption || msg.message.buttonsResponseMessage.selectedButtonId || msg.message.listResponseMessage.singleSelectReply.selectedRowId
        if(msg.includes(password)){
            const response = 'kamu harus memberi password, dikarenakan ini berisi banyak data pribadi seseorang.'
            sock.sendMessage(msg.key.remoteJid, {text: response}, {quoted: msg})
            return;
        }

        const response = fs.readFileSync('piket.txt', 'utf-8');

        sock.sendMessage(msg.key.remoteJid, {text: response}, {quoted: msg})
    } catch (error) {
        console.error('Error in jadwalpiket:', error);
        // Handle errors appropriately, e.g., send an error message to the user
        sock.sendMessage(msg.key.remoteJid, { text: 'An error occurred.', contextInfo: {
            quotedMessage: msg.message,
            stanzaId: msg.key.id,
            participant: msg.key.participant || msg.key.remoteJid
        } });
    }
};

export default jadwalpiket;
