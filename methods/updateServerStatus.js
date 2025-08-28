import axios from 'axios';
import { ActivityType } from 'discord.js';

// Function to update the server status in the bot's activity
export async function updateServerStatus(client, serverConfig) {
    try {
        // Usage of the BattleMetrics API to get server information
        const response = await axios.get(`https://api.battlemetrics.com/servers/${serverConfig.battleMetricsId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.battleMetricsToken}`
            }
        });
        const serverInfo = response.data.data.attributes;

        // Creation of the activity message
        const activityMessage = `${serverInfo.players}/${serverInfo.maxPlayers + serverInfo.details.squad_playerReserveCount}` +
            `${serverInfo.details.publicQueue > 0 ? ` (+${serverInfo.details.publicQueue})` : ''}` +
            ` - ${serverInfo.details.map.replace(/_/g, ' ')}`;

        // Update the bot's activity
        client.user.setPresence({activities: [{name: activityMessage, type:4,}], status: 'online' });
        console.log(`Updated data for ${serverConfig.name} : ${activityMessage}`);
    } catch (error) {
        console.error(`Failed to update data for ${serverConfig.name}:`, error);
    }
}