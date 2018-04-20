"use strict";

const express = require('express');
const githubHandler = require('github-webhook-handler');

var app = express();

// Middleware for handling Github Webhooks
var handler = githubHandler({
    path: '/',
    secret: process.env.WEBHOOK_SECRET
});

handler.on('issue_comment', event => {

    console.log("Got issue_comment");
    console.log(event)

});

app.use(handler);

app.listen(process.env.PORT || 50000, () => {

    console.log("Server listening on port " + (process.env.PORT || 50000));

})
