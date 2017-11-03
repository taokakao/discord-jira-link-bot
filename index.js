const Discord = require('discord.js');
const Logger = require('./src/logger');

const token = process.env.TOKEN;
const botUserId = process.env.BOTUSERID;
const jiraUrl = process.env.JIRA_URL;
const issueMask = process.env.ISSUE_MASK;
const logger = new Logger('index');
const client = new Discord.Client({ autoReconnect: true });

if (!token) {
    logger.error('Token not defined. Exiting..');
    return;
}

logger.info(`Token: ${token}`);
logger.info(`Bot user ID: ${botUserId}`);
logger.info(`Jira url: ${jiraUrl}`);
logger.info(`Issue mask: ${issueMask}`);

client.on('ready', () => {
    logger.log('Client is ready');
});

client.on('message', (message) => {
    const channel = message.channel;
    const text = message.content;
});

client.login(token);
