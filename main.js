import { updateServerStatus } from "./methods/updateServerStatus.js";
import { handleConnectInteraction, registerConnectCommand } from "./commands/connectCommand.js";
import { startConnectUpdater } from "./methods/connectUpdater.js";
import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import serverConfigs from './config.json' with { type: "json" };

serverConfigs.forEach(({ server, botToken }) => {
    // Creation of the bot client
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    // Bot login
    client.login(botToken).catch(error => {
        console.error(`Connection error for server ${server.name}:`, error.message);
    });

    // When the bot is ready, update the server status
    client.on('clientReady', async () => {
        console.log(`Connected as : ${client.user.tag} on ${client.guilds.cache.size} servers.`);

        // List of servers where the bot is connected
        client.guilds.cache.forEach(guild => {
            console.log(` - ${guild.name}`);
        });

        // Register /connect for THIS bot
        try {
            await registerConnectCommand(client, server);
            console.log(`/connect command registered for ${server.name}`);
        } catch (e) {
            console.error(`Failed to register /connect for ${server.name}:`, e);
        }

        // Update the server activity every 60 seconds
        await updateServerStatus(client, server);
        setInterval(() => updateServerStatus(client, server), 60000);

        // Start the /connect message updater
        await startConnectUpdater(client, server);
    });

    // Handle interactions for the /connect command
    client.on("interactionCreate", async (interaction) => {
        try {
            await handleConnectInteraction(interaction, server);
        } catch (e) {
            console.error("Interaction error:", e);
            if (interaction.isRepliable()) {
                await interaction.reply({content: "❌ Something went wrong.", flags: MessageFlags.Ephemeral }).catch(() => {});
            }
        }
    });
});