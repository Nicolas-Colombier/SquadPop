import axios from 'axios';
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
    client.on('ready', () => {
        console.log(`Connected as : ${client.user.tag}`);
        updateServerStatus(client, server);
        // Update the server status every 10 seconds
        setInterval(() => updateServerStatus(client, server), 10000);
    });

    // Method to update the bot activity
    async function updateServerStatus(client, serverConfig) {
        try {
            // Fetch the server information from the BattleMetrics API
            const response = await axios.get(`https://api.battlemetrics.com/servers/${serverConfig.battleMetricsId}`, {
                headers: {
                    'Authorization': `Bearer ${serverConfig.battleMetricsToken}`
                }
            });

            const serverInfo = response.data.data.attributes;

            // Create the activity message
            const activityMessage = `${serverInfo.players}/${serverInfo.maxPlayers + serverInfo.details.squad_playerReserveCount}` +
                `${serverInfo.details.publicQueue > 0 ? ` (+${serverInfo.details.publicQueue})` : ''}` +
                ` | ${serverInfo.details.map}`;

            // Update the bot activity
            client.user.setActivity(activityMessage, { type: ActivityType.Playing });
            console.log(`Updating activity for ${serverConfig.name} : ${activityMessage}`);
        } catch (error) {
            console.error(`Error while updating activity for ${serverConfig.name}:`, error);
        }
    }
});