const Discord = require('discord.js');
const Logger = require('./src/logger');
const JiraIssue = require('./src/jira');
const request = require('request');

const token = process.env.TOKEN;
const botUserId = process.env.BOTUSERID;
const jiraUrl = process.env.JIRA_URL;
const jiraToken = process.env.JIRA_TOKEN;
const jiraProject = process.env.JIRA_PROJECT;
const logger = new Logger('index');
const client = new Discord.Client({ autoReconnect: true });
const jiraIssue = new JiraIssue();

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
    const isMe = message.author.id == botUserId;
    if (!isMe && issueNameRegexp.test(text)) {
        const issues = text.match(issueNameRegexp).map((issue) => `${issue}`);
        const linksToBeSent = [];
        for (const issue of issues) {
            const url = `${jiraUrl}/rest/api/2/issue/${issue}?expand=renderedFields`;
            request({ url, headers : { "Authorization": `Basic ${jiraToken}` } }, (error, response, body) => {
                    if (error) {
                        channel.send(`${jiraUrl}/browse/${issue}`);
                        return;
                    }
                    issueObj = JSON.parse(response.body);
                    
                    const fields = [
                        {
                            name: 'Components',
                            value: jiraIssue.getIssueComponents(issueObj.fields.components),
                        },
                        {
                            name: 'Type and status',
                            value: `${issueObj.fields.issuetype.name}, ${issueObj.fields.status.name}`,
                        },
                    ];
                    if (issueObj.fields.subtasks && issueObj.fields.subtasks.length > 0) {
                        fields.push({
                            name: 'Subtasks',
                            value: jiraIssue.getIssueSubtasks(issueObj.fields.subtasks),
                        });
                    }
                    channel.send({
                        embed: {
                            color: jiraIssue.getColorByPriority(issueObj.fields.priority.name),
                            author: {
                                name: `${issue.toUpperCase()} ${issueObj.fields.assignee.displayName}`,
                                icon_url: issueObj.fields.assignee.avatarUrls['48x48'],
                              },
                            description: jiraIssue.getIssueDescription(issueObj.fields.description),
                            fields,
                            title: `${issueObj.fields.summary}`,
                            url: `${jiraUrl}/browse/${issue}`,
                            timestamp: issueObj.fields.created,
                            footer: {
                                icon_url: issueObj.fields.reporter.avatarUrls['48x48'],
                                text: `by ${issueObj.fields.reporter.displayName}`,
                              }
                        },
                    });
                });
        }
    }
});

client.login(token);
