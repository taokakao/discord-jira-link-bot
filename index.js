const Discord = require('discord.js');
const Logger = require('./src/logger');

const token = process.env.TOKEN;
const botUserId = process.env.BOTUSERID;
const jiraUrl = process.env.JIRA_URL;
const jiraProject = process.env.JIRA_PROJECT;
const logger = new Logger('index');
const client = new Discord.Client({ autoReconnect: true });

if (!token) {
    logger.error('Token not defined. Exiting..');
    return;
}

logger.info(`Token: ${token}`);
logger.info(`Bot user ID: ${botUserId}`);
logger.info(`Jira url: ${jiraUrl}`);
logger.info(`Jira project: ${jiraProject}`);

// unfortunately, there is no look behind regexp in javascript
const issueNameRegexp = new RegExp(`${jiraProject}-\\d\\d\\d\\d?`, 'gi');

client.on('ready', () => {
    logger.log('Client is ready');
});

client.on('message', (message) => {
    const channel = message.channel;
    const text = message.content;
    if (issueNameRegexp.test(text)) {
        const issueLinks = text.match(issueNameRegexp).map((issue) => `${jiraUrl}/browse/${issue}`);
        const linksToBeSent = [];
        for (const issueLink of issueLinks) {
            if (text.indexOf(issueLink) === -1) {
                linksToBeSent.push(issueLink);
            }
        }
        if (linksToBeSent.length > 0) {
            channel.send(linksToBeSent.join('\n'));
        }
    }
});

client.login(token);
