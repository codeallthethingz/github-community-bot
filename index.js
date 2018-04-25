"use strict";

const express       = require('express');
const createApp     = require('github-app');
const createHandler = require('github-webhook-handler');

const app = express();

const githubApp = createApp({
    id: process.env.APP_ID,
    cert: process.env.BOT_PK || require('fs').readFileSync('private-key.pem')
});

// Middleware for handling Github Webhooks
const handler = createHandler({
    path: '/',
    secret: process.env.WEBHOOK_SECRET
});

handler.on('issue_comment', async (event) => {

    console.log("Got issue_comment");
    // console.log(event);

    // Only respond if comment was created or edited
    var action = event.payload.action;
    if (!(action == 'created' || action == 'edited')) {
        return;
    }

    // User requests issue assignment using the '/assign to me' command
    if (event.payload.comment.body == '/assign to me') {

        try {
            let github = await githubApp.asInstallation(event.payload.installation.id);

            // Issue must be triaged before assigning
            let labels = event.payload.issue.labels;
            labels = labels.filter(labelObj => labelObj.name == "triaged");
            if (labels.length != 1) {

                await github.issues.createComment({
                    owner:  event.payload.repository.owner.login,
                    repo:   event.payload.repository.name,
                    number: event.payload.issue.number,
                    body:   "Issue must be triaged before assignment. Please contact the \
                            repository owner."
                });

                return;

            }

            // User must be approved to work in the project
            try {
                await github.repos.checkCollaborator({
                    owner:    event.payload.repository.owner.login,
                    repo:     event.payload.repository.name,
                    username: event.payload.comment.user.login
                });
            }
            catch (error) {

                await github.issues.createComment({
                    owner:  event.payload.repository.owner.login,
                    repo:   event.payload.repository.name,
                    number: event.payload.issue.number,
                    body:   "You must be a collaborator to assign this issue to \
                            yourself. Please contact the repository owner to get access."
                });

                return;

            }

            // Assign to user and leave comment.
            await github.issues.addAssigneesToIssue({
                owner:     event.payload.repository.owner.login,
                repo:      event.payload.repository.name,
                number:    event.payload.issue.number,   
                assignees: [event.payload.comment.user.login]
            });

            await github.issues.createComment({
                owner:  event.payload.repository.owner.login,
                repo:   event.payload.repository.name,
                number: event.payload.issue.number,
                body:   "Assigned issue to user @" + event.payload.comment.user.login
            });
        }
        catch (error) {
            console.error(error);
        }
        
    }

});

app.use(handler);

app.listen(process.env.PORT || 50000, () => {

    console.log("Server listening on port " + (process.env.PORT || 50000));

});
