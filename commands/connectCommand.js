import { MessageFlags } from "discord.js";
import { trackConnectMessage } from "../methods/connectUpdater.js";
import { buildConnectEmbed } from "../methods/connectEmbedBuilder.js";

const GLOBAL_COOLDOWN = 60_000;
const lastUsedByBot = new Map();

// Method to register the /connect command
export async function registerConnectCommand(client, server) {
    const data = [
        {
            name: "connect",
            description: `Post a Connect button for ${server?.name}`,
            dm_permission: false,
        },
    ];
    await client.application.commands.set(data);
}

// Handle the /connect command
export async function handleConnectInteraction(interaction, server) {
    if (!interaction.isChatInputCommand() || interaction.commandName !== "connect") return;
    console.log(`/connect used by ${interaction.user.tag} on ${interaction.guild?.name}`);

    // Cooldown PAR BOT (indépendant)
    const botId = interaction.client.user.id;
    const now = Date.now();
    const last = lastUsedByBot.get(botId) ?? 0;
    const remainingMs = GLOBAL_COOLDOWN - (now - last);

    if (remainingMs > 0) {
        const remaining = Math.ceil(remainingMs / 1000);
        await interaction.reply({
            content: `⏳ Please wait **${remaining}s** before reusing this command.`,
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // Start the cooldown for THIS bot
    lastUsedByBot.set(botId, now);

    const payload = await buildConnectEmbed(server, interaction.client);
    await interaction.reply(payload);

    try {
        const sent = await interaction.fetchReply();
        trackConnectMessage(interaction.client, sent.channelId, sent.id);
    } catch (error) {
        console.error("Failed to track the messages:", error);
    }
}
