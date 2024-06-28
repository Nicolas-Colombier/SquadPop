import axios from 'axios'; // Ajouter axios pour faire des requêtes HTTP
import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import serverConfigs from './config.json' with { type: "json" }; // Importer la configuration des serveurs

serverConfigs.forEach(({ server, botToken }) => {
    // Création du client Discord
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    // Connexion du bot
    client.login(botToken).catch(error => {
        console.error(`Erreur de connexion pour le bot du serveur ${server.name}:`, error.message);
    });

    // Lorsque le bot est prêt
    client.on('ready', () => {
        console.log(`Connecté en tant que : ${client.user.tag}`);
        updateServerStatus(client, server);
        // Mise à jour de l'activité toutes les minutes
        setInterval(() => updateServerStatus(client, server), 30000);
    });

    // Fonction de mise à jour de l'activité du bot
    async function updateServerStatus(client, serverConfig) {
        try {
            // Utilisation de l'API BattleMetrics pour obtenir les informations du serveur
            const response = await axios.get(`https://api.battlemetrics.com/servers/${serverConfig.battleMetricsId}`, {
                headers: {
                    'Authorization': `Bearer ${serverConfig.battleMetricsToken}`
                }
            });

            const serverInfo = response.data.data.attributes;

            // Création du message d'activité
            const activityMessage = `${serverInfo.players}/${serverInfo.maxPlayers + serverInfo.details.squad_playerReserveCount}` +
                `${serverInfo.details.publicQueue > 0 ? ` (+${serverInfo.details.publicQueue})` : ''}` +
                ` | ${serverInfo.details.map}`;

            // Mise à jour de l'activité du bot
            client.user.setActivity(activityMessage, { type: ActivityType.Playing });
            console.log(`Mise à jour de l'activité pour ${serverConfig.name} : ${activityMessage}`);
        } catch (error) {
            console.error(`Une erreur est survenue avec le serveur ${serverConfig.name}:`, error);
        }
    }
});