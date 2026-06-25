const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { exec } = require('child_process');
const path = require('path');

const GROUP_ID = '40735515900-1625633920@g.us';
const PYTHON = path.join(__dirname, 'venv/bin/python3');
const SCRIPT = path.join(__dirname, 'smartthings_ac.py');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n📱 Scanează codul QR cu WhatsApp:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ Bot conectat! Ascult grupul...\n');
});

function detecteazaComanda(text) {
    const t = text.toLowerCase();
    if (t.includes('mi-e cald') || t.includes('porneste ac') || t.includes('pornește ac') || 
        t.includes('da drumul la ac') || t.includes('e cald')) {
        return 'PORNESTE_AC';
    }
    if (t.includes('mi-e frig') || t.includes('opreste ac') || t.includes('oprește ac') || 
        t.includes('oprit ac') || t.includes('e frig')) {
        return 'OPRESTE_AC';
    }
    return 'IGNORA';
}

async function handleMessage(msg) {
    if (msg.from !== GROUP_ID) return;

    const text = msg.body;
    console.log(`📨 Mesaj detectat: "${text}"`);

    const actiune = detecteazaComanda(text);

    if (actiune === 'PORNESTE_AC') {
        msg.reply('⏳ Pornesc AC-ul...');
        ruleazaAC('on', msg);
    } else if (actiune === 'OPRESTE_AC') {
        msg.reply('⏳ Opresc AC-ul...');
        ruleazaAC('off', msg);
    } else {
        console.log('💬 Mesaj ignorat.');
    }
}
function ruleazaAC(comanda, msg) {
    exec(`${PYTHON} ${SCRIPT} ${comanda}`, (error, stdout) => {
        if (error) {
            console.error(`❌ Eroare: ${error.message}`);
            msg.reply('❌ Eroare la comunicarea cu AC-ul.');
            return;
        }
        console.log(`✅ AC ${comanda}: ${stdout}`);
        msg.reply(
            `🤖 *[SISTEM AUTOMATIZARE AC]*\n` +
            `----------------------------------\n` +
            `✅ AC ${comanda === 'on' ? 'pornit' : 'oprit'} cu succes!\n` +
            `----------------------------------\n` +
            `⚙️ _Rulat via SmartThings Bot_`
        );
    });
}
client.on('message', handleMessage);
client.on('message_create', (msg) => {
    if (msg.fromMe) handleMessage(msg);
});

client.initialize();