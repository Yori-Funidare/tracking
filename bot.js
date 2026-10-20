const { Telegraf } = require('telegraf');
const axios = require('axios');

// Mengambil token dari Environment Variables (GitHub Secrets)
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const GH_PAT = process.env.GH_PAT;
// Ganti dengan repo web utama kamu (tempat website github.io kamu berada)
const TARGET_REPO = 'yori-funidare/NAMA_REPO_WEB_KAMU'; 
const BRANCH = 'main';

// 1. Command /createfolder namafolder
bot.command('createfolder', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const folderName = args[1];

    if (!folderName) {
        return ctx.reply('❌ Format salah!\nContoh: /createfolder EpicSkins');
    }

    try {
        // GitHub membuat folder otomatis jika kita upload file placeholder di dalamnya
        const path = `web/${folderName}/placeholder.txt`;
        const content = Buffer.from('Folder created via Telegram Bot').toString('base64');

        await axios.put(`https://api.github.com/repos/${TARGET_REPO}/contents/${path}`, {
            message: `Create new album folder: ${folderName}`,
            content: content,
            branch: BRANCH
        }, {
            headers: { Authorization: `Bearer ${GH_PAT}` }
        });

        ctx.reply(`✅ Berhasil! Folder "web/${folderName}" berhasil dibuat di repository web.`);
    } catch (err) {
        console.error(err.response?.data || err.message);
        ctx.reply('❌ Gagal membuat folder. Pastikan nama folder valid.');
    }
});

// 2. Command /imgupload namafolder (sambil kirim foto)
bot.command('imgupload', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const folderName = args[1];

    if (!folderName || !ctx.message.photo) {
        return ctx.reply('❌ Jangan lupa tulis nama foldernya dan lampirkan fotonya ya!\nContoh: /imgupload EpicSkins');
    }

    try {
        ctx.reply('⏳ Sedang mengupload foto ke GitHub...');

        // Ambil foto kualitas tertinggi dari array Telegram
        const photo = ctx.message.photo;
        const fileId = photo[photo.length - 1].file_id;
        const fileLink = await ctx.telegram.getFileLink(fileId);
        
        // Download gambar jadi buffer
        const imgResponse = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
        const base64Image = Buffer.from(imgResponse.data).toString('base64');

        // Buat nama file unik berdasarkan timestamp
        const fileName = `skin_${Date.now()}.jpg`;
        const imagePath = `web/${folderName}/${fileName}`;

        // Push foto ke repo web utama
        await axios.put(`https://api.github.com/repos/${TARGET_REPO}/contents/${imagePath}`, {
            message: `Add new image to ${folderName} via bot`,
            content: base64Image,
            branch: BRANCH
        }, {
            headers: { Authorization: `Bearer ${GH_PAT}` }
        });

        ctx.reply(`✅ Berhasil!\nFoto tersimpan di folder web/${folderName}/${fileName}\nWeb kamu akan segera melakukan re-deploy otomatis.`);
    } catch (err) {
        console.error(err.response?.data || err.message);
        ctx.reply('❌ Gagal mengupload gambar ke GitHub.');
    }
});

console.log("Bot script initialized...");
// Catatan: Karena berjalan via GitHub Actions / Webhook sekali jalan, 
// skrip ini mengeksekusi trigger perintah yang masuk.
