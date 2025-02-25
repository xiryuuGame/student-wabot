import { format } from 'date-fns';

const jadwal = (msg, sock) => {
    try {
        sock.sendMessage(msg.key.remoteJid, {
            text: "Jadwal apa yang kamu cari?",
            footer: `XIRYUU - ${format(new Date(), 'dd-MM-yyyy')}`,
            buttons: [ 
                { buttonId: `!jadwalmapel`,
                 buttonText: {
                     displayText: 'Jadwal Mapel'
                 }, type: 1 },
                { buttonId: `!jadwalpiket`,
                 buttonText: {
                     displayText: 'Jadwal Piket'
                 }, type: 1 }
            ],
            headerType: 1,
            viewOnce: true
        },{ quoted: null })
    } catch (error) {
        console.error('Error in jadwal:', error);
        // Handle errors appropriately, e.g., send an error message to the user
        sock.sendMessage(msg.key.remoteJid, { text: 'An error occurred.', contextInfo: {
            quotedMessage: msg.message,
            stanzaId: msg.key.id,
            participant: msg.key.participant || msg.key.remoteJid
        } });
    }
};

export default jadwal;
