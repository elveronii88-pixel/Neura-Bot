const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

const dogrulamaKodlari = new Map();

// Ayarlar
const PREFIX = 'n!';
const KAYITSIZ_ROL_ID = '1496082858077327420';
const UYE_ROL_ID = '1496082069099511950';
const SURE_DAKIKA = 8;

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'kodal') {
        const kod = Math.random().toString(36).substring(2, 8).toUpperCase();
        let kalanSure = SURE_DAKIKA * 60; // Saniyeye çevirdik

        dogrulamaKodlari.set(message.author.id, kod);

        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('Doğrulama Kodu Oluşturuldu')
            .setDescription(`Kodun: **${kod}**\n\nKayıt olmak için: \`${PREFIX}kodgir ${kod}\` yazmalısın.\n**Kalan Süre:** \`${SURE_DAKIKA}:00\``)
            .setFooter({ text: 'Süre dolunca kod geçersiz sayılacaktır.' });

        const mesaj = await message.reply({ embeds: [embed] });

        // Geri Sayım Döngüsü
        const sayac = setInterval(async () => {
            kalanSure -= 10; // Her 10 saniyede bir mesajı güncelle (Hız sınırı yememek için)

            if (kalanSure <= 0) {
                clearInterval(sayac);
                dogrulamaKodlari.delete(message.author.id);
                embed.setColor('Red').setDescription('❌ **Süre doldu!** Kod geçersiz hale geldi. Tekrar almak için `n!kodal` yazın.').setFooter({ text: 'Süre bitti.' });
                return mesaj.edit({ embeds: [embed] }).catch(() => {});
            }

            const dakika = Math.floor(kalanSure / 60);
            const saniye = kalanSure % 60;
            
            embed.setDescription(`Kodun: **${kod}**\n\nKayıt olmak için: \`${PREFIX}kodgir ${kod}\` yazmalısın.\n**Kalan Süre:** \`${dakika}:${saniye.toString().padStart(2, '0')}\``);
            
            mesaj.edit({ embeds: [embed] }).catch(() => {});
        }, 10000); // 10 saniyede bir güncelleme
    }

    if (command === 'kodgir') {
        const girilenKod = args[0];
        const saklananKod = dogrulamaKodlari.get(message.author.id);

        if (!saklananKod) {
            return message.reply('❌ Geçerli bir kodun yok veya süresi dolmuş. `n!kodal` ile yeni bir kod al.');
        }

        if (girilenKod === saklananKod) {
            try {
                const uyeRol = message.guild.roles.cache.get(UYE_ROL_ID);
                const kayitsizRol = message.guild.roles.cache.get(KAYITSIZ_ROL_ID);

                await message.member.roles.add(uyeRol);
                await message.member.roles.remove(kayitsizRol);
                
                dogrulamaKodlari.delete(message.author.id); 
                return message.reply('✅ Başarıyla kayıt oldun! Keyifli sohbetler.');
            } catch (e) {
                return message.reply('Rol yetkilerimi kontrol et lütfen!');
            }
        } else {
            return message.reply('❌ Kod yanlış!');
        }
    }
});

client.login(process.env.TOKEN);