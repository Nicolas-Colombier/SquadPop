import { buildConnectEmbed } from "./connectEmbedBuilder.js";

const registry = new Map();
const REFRESH_MS = 60_000;

// Update messages from the /connect command every minute
export function startConnectUpdater(client, server) {
    // avoid double registration for the same bot
    const key = client.user?.id;
    if (!key || registry.has(key)) return;

    // Set up the registry entry for each bot
    const entry = { server, msgs: [] };
    registry.set(key, entry);

    // Update tracked messages
    entry.intervalId = setInterval(async () => {
        if (!entry.msgs.length) return;

        const payload = await buildConnectEmbed(server, client).catch(() => null);
        if (!payload) return;

        for (const { channelId, messageId } of entry.msgs) {
            try {
                const channel = await client.channels.fetch(channelId);
                if (!channel?.isTextBased()) continue;
                const msg = await channel.messages.fetch(messageId);
                await msg.edit(payload);
                console.log(`Updated messages for ${server.name}`);
            } catch {
                entry.msgs = entry.msgs.filter(m => m.messageId !== messageId);
            }
        }
    }, REFRESH_MS);
}

// keep track of messages sent by /connect to update them later
export function trackConnectMessage(client, channelId, messageId) {
    const key = client.user?.id;
    if (!key) return;

    const entry = registry.get(key);
    if (!entry) return;

    entry.msgs = [{ channelId, messageId }, ...entry.msgs.filter(m => m.messageId !== messageId)];
    entry.msgs = entry.msgs.slice(0, 5);
}
