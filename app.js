const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');

// --- RENDER İÇİN WEB SUNUCUSU (Kapanmayı Önler) ---
const app = express();
app.get('/', (req, res) => res.send('Bot 7/24 Aktif!'));
app.listen(process.env.PORT || 3000, () => console.log("Web sunucusu hazır."));

// --- DISCORD BOT AYARLARI ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const dogrulamaKodlari = new Map();

// --- AYARLAR (Burayı Kendi ID'lerinle Doldur) ---
const PREFIX = 'n!';
const KAYITSIZ_ROL_ID = '1496082858077327420'; // Buraya Kayıtsız rol ID'sini yaz
const UYE_ROL_ID = '1496082069099511950';      // Buraya Üye rol ID'sini yaz
const SURE_DAKIKA = 8;

client.on('ready', () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // --- KOD ALMA KOMUTU ---
    if (command === 'kodal') {
        const kod = Math.random().toString(36).substring(2, 8).toUpperCase();
        let kalanSure = SURE_DAKIKA * 60;

        dogrulamaKodlari.set(message.author.id, kod);

        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('Doğrulama Kodu Oluşturuldu')
            .setDescription(`Kodun: **${kod}**\n\nKayıt olmak için: \`${PREFIX}kodgir ${kod}\` yazmalısın.\n**Kalan Süre:** \`${SURE_DAKIKA}:00\``)
            .setFooter({ text: 'Süre dolunca kod geçersiz sayılacaktır.' });

        const mesaj = await message.reply({ embeds: [embed] });

        const sayac = setInterval(async () => {
            kalanSure -= 10;

            if (kalanSure <= 0) {
                clearInterval(sayac);
                dogrulamaKodlari.delete(message.author.id);
                embed.setColor('Red').setDescription('❌ **Süre doldu!** Kod geçersiz hale geldi.').setFooter({ text: 'Süre bitti.' });
                return mesaj.edit({ embeds: [embed] }).catch(() => {});
            }

            const dakika = Math.floor(kalanSure / 60);
            const saniye = kalanSure % 60;
            
            embed.setDescription(`Kodun: **${kod}**\n\nKayıt olmak için: \`${PREFIX}kodgir ${kod}\` yazmalısın.\n**Kalan Süre:** \`${dakika}:${saniye.toString().padStart(2, '0')}\``);
            
            mesaj.edit({ embeds: [embed] }).catch(() => {});
        }, 10000);
    }

    // --- KOD GİRME KOMUTU ---
    if (command === 'kodgir') {
        const girilenKod = args[0];
        const saklananKod = dogrulamaKodlari.get(message.author.id);

        if (!saklananKod) {
            return message.reply('❌ Geçerli bir kodun yok veya süresi dolmuş.');
        }

        if (girilenKod === saklananKod) {
            try {
                const uyeRol = message.guild.roles.cache.get(UYE_ROL_ID);
                const kayitsizRol = message.guild.roles.cache.get(KAYITSIZ_ROL_ID);

                await message.member.roles.add(uyeRol);
                await message.member.roles.remove(kayitsizRol);
                
                dogrulamaKodlari.delete(message.author.id); 
                return message.reply('✅ Başarıyla kayıt oldun!');
            } catch (e) {
                return message.reply('Hata: Yetkilerimi veya Rol IDlerini kontrol et!');
            }
        } else {
            return message.reply('❌ Girdiğin kod yanlış.');
        }
    }
});

// Render'da Environment Variables kısmına TOKEN eklemeyi unutma!
client.login(process.env.TOKEN);