import axios from "axios";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

// Method to build the embed message with server information and a connect button
export async function buildConnectEmbed(server, client) {
    const baseLink = server?.corruptedBrowserLink;
    let url = baseLink?.endsWith("_join") ? baseLink : `${baseLink}_join`;

    if (url === '_join') {
        url = 'https://browser.corrupted-infantry.com/';
    }

    let curr = null, max = null, queue = 0;
    let map = "Unknown", nextMap = "Unknown";
    let factionOne = "Unknown", factionTwo = "Unknown";

    // Fetch server information from BattleMetrics API
    try {
        if (server?.battleMetricsId && server?.battleMetricsToken) {
            const { data } = await axios.get(
                `https://api.battlemetrics.com/servers/${server.battleMetricsId}`,
                { headers: { Authorization: `Bearer ${server.battleMetricsToken}` } }
            );
            const attr = data?.data?.attributes ?? {};

            curr = Number(attr.players ?? 0);
            max = Number((attr.maxPlayers ?? 0) + (attr.details?.squad_playerReserveCount ?? 0));
            queue = Number(attr.details?.publicQueue ?? 0);

            const mapRaw = attr.details?.map;
            map = (typeof mapRaw === "string" ? mapRaw.replace(/_/g, " ") : "Unknown") || "Unknown";

            const nextMapRaw = attr.details?.squad_nextLayer;
            nextMap = (typeof nextMapRaw === "string" ? nextMapRaw.replace(/_/g, " ") : "Unknown") || "Unknown";

            const t1 = attr.details?.squad_teamOne;
            const t2 = attr.details?.squad_teamTwo;
            factionOne = typeof t1 === "string" ? t1.split("_")[0] : "Unknown";
            factionTwo = typeof t2 === "string" ? t2.split("_")[0] : "Unknown";
        }
    } catch (e) {
        console.error(`[BM] Failed to fetch informations for ${server?.name}:`, e?.message);
    }

    // Prepare values for the embed fields
    const playersValue =
        curr === null || max === null
            ? "Unknown"
            : `\`\`\`${curr}/${max}${queue > 0 ? ` (+${queue})` : ""}\`\`\``;
    const mapValue = `\`\`\`${map}\`\`\``;
    const nextMapValue = `\`\`\`${nextMap}\`\`\``;
    const factionsValue = `\`\`\`${factionOne} vs ${factionTwo}\`\`\``;

    // Determine the color of the embed based on player count
    const color =
        playersValue === "Unknown"
            ? 0x808080
            : (() => {
                if (!max || max <= 0) return 0x808080;
                if (curr === 0) return 0x808080;
                if (curr / max < 0.5) return 0xffa500;
                return 0x00ff00;
            })();

    // Get the bot's avatar URL
    const botAvatar = client.user.displayAvatarURL();

    // Build the embed message
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(server?.name || "Server")
        .setTimestamp()
        .setThumbnail(botAvatar)
        .addFields(
            // Ligne 1
            { name: "Players", value: playersValue, inline: true },
            { name: "Map", value: mapValue, inline: true },

            { name: "", value: "" },

            // Ligne 2
            { name: "Factions", value: factionsValue, inline: true},
            { name: "Next Map", value: nextMapValue, inline: true},

            { name: "", value: "" },

            //Ligne 3
            { name: "", value: "-# Squad must be running and at least one player must already be connected." }
        )
        .setFooter({
            text: "Powered by https://browser.corrupted-infantry.com",
        });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel("CONNECT TO SERVER")
            .setStyle(ButtonStyle.Link)
            .setURL(url)
    );

    return { embeds: [embed], components: [row] };
}
