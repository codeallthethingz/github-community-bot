"use strict";

const express       = require('express');
const githubApp     = require('github-app');
const githubHandler = require('github-webhook-handler');

var app = express();

var github = githubApp({
    id: process.env.APP_ID,
    cert: process.env.BOT_PK || require('fs').readFileSync('private-key.pem')
});

// Middleware for handling Github Webhooks
var handler = githubHandler({
    path: '/',
    secret: process.env.WEBHOOK_SECRET
});

handler.on('issue_comment', event => {

    console.log("Got issue_comment");
    console.log(event);

    // Only respond if comment was created or edited
    var action = event.payload.action;
    if (!(action == 'created' || action == 'edited')) {
        return;
    }

    // User requests issue assignment using the '/assign to me' command
    if (event.payload.comment.body == '/assign to me') {

        // TODO: issue must be triaged before assigning

        // TODO: user must be approved to work in the project

        var installId = event.payload.installation.id;
        githubApp.asInstallation(installId).then(github => {

            // TODO: assign issue

            // Comment on issue
            github.issues.createComment({
                owner:  event.payload.repository.owner.login,
                repo:   event.payload.repository.name,
                number: event.payload.issue.id,

                message: "Assigned issue to user @" + event.payload.comment.user.login
            });

        });

    }

});

app.use(handler);

app.listen(process.env.PORT || 50000, () => {

    console.log("Server listening on port " + (process.env.PORT || 50000));

});
