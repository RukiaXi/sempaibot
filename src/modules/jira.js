"use strict";

const ModuleBase = require("../modulebase.js"),
      permissions = require("../permissions.js"),
      responses = require("../responses.js"),
      users = require("../users.js"),
      util = require("../util.js"),
      stats = require("../stats.js"),
      JiraApi = require("jira").JiraApi;


class JiraModule extends ModuleBase {
    constructor() {
        super();

        this.jira = new JiraApi(
            "http", 
            config.jira.host, 
            config.jira.port, 
            config.jira.user, 
            config.jira.password, 
            config.jira.version
        );

        this.name = "Jira";
        this.description = "Integrates Jira into the Discord Bot";

        this.add_command({
            match: message => {
                if(!message.content.startsWith("jira set"))
                    return null;
                
                let username = message.content.substr("jira set".length + 1);

                return [username];
            },
            sample: "set __*username*__",
            description: "Set a Jira Username to yourself.",
            permission: "MANAGE_JIRA",
            global: false,

            execute: this.handle_jira_username
        });

        this.add_command({
            match: message => {
                if(!message.content.startsWith("jira show"))
                    return null;
                
                let ticket = message.content.substr("jira show".length + 1);

                return [ticket];
            },
            sample: "set __*username*__",
            description: "Show data of ticket",
            permission: "SHOW_JIRA",
            global: false,

            execute: this.handle_jira_ticket
        });
    }

    handle_jira_username(message, username) {
        this.jira.searchUsers(username, 0, 1, true, false, function(err, data) {
            if (err)
                return console.log(err);

            console.log(data);
        });
    }

    handle_jira_ticket(message) {
        console.log(message);
    }
}