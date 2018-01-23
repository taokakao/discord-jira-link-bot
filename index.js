const Discord = require('discord.js');
const Logger = require('./src/logger');
const JiraIssue = require('./src/jira');
const request = require('request');

const token = process.env.TOKEN;
const botUserId = process.env.BOTUSERID;
const jiraUrl = process.env.JIRA_URL;
const jiraToken = process.env.JIRA_TOKEN;
const jiraProjects = process.env.JIRA_PROJECTS ? process.env.JIRA_PROJECTS.split(',') : [];
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
logger.info(`Jira projects: ${jiraProjects.join(', ')}`);

// unfortunately, there is no 'look behind'-regexp in javascript
const issueNameRegexps = [];
for (const project of jiraProjects) {
    issueNameRegexps.push({
        project,
        regexp: new RegExp(`${project}-\\d\\d\\d\\d?`, 'gi'),
    });
}

client.on('ready', () => {
    logger.log('Client is ready');
});

client.on('message', (message) => {
    const channel = message.channel;
    const text = message.content;
    const isMe = message.author.id == botUserId;
    const ignore = text.indexOf('no-jira-links') !== -1;
    if (ignore) {
        channel.send('Okaaay... As you wish... Sure...');
    }
    if (!isMe && !ignore) {
        for (const p of issueNameRegexps) {
            if (p.regexp.test(text)) {
                const issues = text.match(p.regexp).map((issue) => `${issue}`);
                const linksToBeSent = [];
                for (const issue of issues) {
                    const url = `${jiraUrl}/rest/api/2/issue/${issue}?expand=renderedFields`;
                    request({ url, headers : { "Authorization": `Basic ${jiraToken}` } }, (error, response, body) => {
                            const issueUrl = `${jiraUrl}/browse/${issue}`;
                            if (error) {
                                channel.send(issueUrl);
                                return;
                            }
                            issueObj = JSON.parse(response.body);
                            const components = jiraIssue.getIssueComponents(issueObj.fields.components);
                            const parent = issueObj.fields.parent;
                            const assignee = issueObj.fields.assignee;
                            const reporter = issueObj.fields.reporter;
                            const subtasks = issueObj.fields.subtasks;
                            const attachment = issueObj.fields.attachment;
                            const status = issueObj.fields.status.name;

                            const fields = [];
                            if (components) {
                                fields.push({
                                    name: 'Components',
                                    value: components,
                                });
                            }
                            fields.push({
                                name: 'Type and status',
                                value: `${issueObj.fields.issuetype.name}                                   ${jiraIssue.formatByStatus(status, status)}`,
                            });
                            if (subtasks && subtasks.length > 0) {
                                fields.push({
                                    name: 'Subtasks',
                                    value: jiraIssue.getIssueSubtasks(subtasks),
                                });
                            }
                            if (parent) {
                                fields.push({
                                    name: 'Parent',
                                    value: `[${parent.key} ${parent.fields.summary}](${jiraUrl}/browse/${parent.key})`,
                                });
                            }
                            const message = {
                                embed: {
                                    color: jiraIssue.getColorByPriority(issueObj.fields.priority.name),
                                    author: {
                                        name: `${issue.toUpperCase()} ${assignee ? assignee.displayName : ''}`,
                                        icon_url: assignee ? assignee.avatarUrls['48x48'] : '',
                                      },
                                    description: jiraIssue.getIssueDescription(issueObj.fields.description, issueUrl),
                                    fields,
                                    title: `${jiraIssue.formatByStatus(issueObj.fields.summary, status)}`,
                                    url: issueUrl,
                                    timestamp: issueObj.fields.created,
                                    footer: {
                                        icon_url: reporter.avatarUrls['48x48'],
                                        text: `by ${reporter.displayName}`,
                                      },
                                },
                            };
                            channel.send(message);
                        });
                }
            }
        }
    }
});

client.login(token);
