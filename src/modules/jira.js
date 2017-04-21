"use strict";

const ModuleBase = require("../modulebase.js"),
      permissions = require("../permissions.js"),
      responses = require("../responses.js"),
      Document = require("camo").Document,
      users = require("../users.js"),
      util = require("../util.js"),
      stats = require("../stats.js"),
      Discord = require("discord.js"),
      config = require("../../config.js"),
      request = require('request'),
      JiraApi = require("jira").JiraApi;

const Ticket_Types = {
    "yellow": "#ffd351",
    "green": "#14892c",
    "blue-gray": "#4a6785"
};

const MAX_ISSUES = 5;

class JiraUser extends Document {
    constructor() {
        super();

        this.user_id = String;
        this.jira_key = String;
    }
}


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

        this.jirausers = [];

        this.name = "Jira";
        this.description = "Integrates Jira into the Discord Bot";

        permissions.register("MANAGE_JIRA", "admin");
        permissions.register("SHOW_JIRA", "admin");

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
                
                let args = message.content.substr("jira show".length + 1).trim();
                let who = "";
                let type = false;

                if (args.indexOf(" ") !== -1) {
                    args = args.split(" ");
                    if (args[1].startsWith("<@!")) {
                        who = util.parse_id(args[1]).id;
                        type = args[0];
                    } else {
                        who = args[1];
                        type = args[0];
                    }
                } else {
                    if (args.startsWith("<@!"))
                        who = util.parse_id(args).id;
                    else
                        who = args;
                }

                return [who, type];
            },
            sample: "show __*person*__",
            description: "Show tickets of person",
            permission: "SHOW_JIRA",
            global: false,

            execute: this.handle_jira_show
        })

        this.add_command({
            match: message => {
                if(!message.content.startsWith("jira ticket"))
                    return null;
                
                let ticket = message.content.substr("jira ticket".length + 1);

                return [ticket];
            },
            sample: "ticket __*ticketname*__",
            description: "Show data of ticket",
            permission: "SHOW_JIRA",
            global: false,

            execute: this.handle_jira_ticket
        });
    }

    handle_jira_username(message, username) {
        this.jira.searchUsers(username, 0, 1, true, false, (err, data) => {
            if (err)
                return this.bot.respond(message, `An error occurred! ${err.message}`);
            
            let id = util.parse_id(message.author.id).id;

            if (typeof this.jirausers[message.author.id] === "undefined") {
                let user = JiraUser.create({
                    user_id: id,
                    jira_key: data[0].key
                });

                user.save().then((l) => {
                    console.log(`Saved user`, l._id);
                });
            }

            this.jirausers[id] = data[0].key;

            this.bot.respond(message, `Successfully linked you with Jira!`);
        });
    }

    handle_jira_show(message, who, type) {
        if (who === "" || who === "me")
            who = util.parse_id(message.author.id).id;

        console.log(this.jirausers, who, this.jirausers[who]);

        if (typeof this.jirausers[who] === "undefined")
            return this.bot.respond(message, `This user is not yet linked. You can link him to a Jira user by using ${config.listen_to}jira set **__USERNAME__**`);
        
        if (false === type)
            type = "";
        else
            type = `AND status in (${type})`;

        let user = this.jirausers[who];
        if (user.indexOf("@") !== -1) 
            user = user.replace("@", '\\u0040');

        let options = {
            uri: this.jira.makeUri(`/search?maxResults=5&jql=assignee=${user} ${type}`),
            maxResults: 5,
            auth: {
                'user': this.jira.username,
                'pass': this.jira.password
            }
        }

        request(options, (error, response, result) => {
            if (error)
                return false;

            result = JSON.parse(result);

            if (typeof result.errorMessages !== "undefined") {
                for(let err of result.errorMessages)
                    this.bot.respond(message, `Error: ${err}`);

                return;
            }

            if (result.issues.length === 0)
                return this.bot.respond(message, `No issues found`);

            for(let issue of result.issues)
                this.bot.respond_embed(message, this._getTicketEmbed(issue));
        });
    }

    handle_jira_ticket(message, ticket) {
        this.jira.findIssue(ticket, (err, issue) => {
            if (err)
                return this.bot.respond(message, `Couldn't find issue with key: '${ticket}'. ${err.message}`);

            let embed = this._getTicketEmbed(issue);

            this.bot.respond_embed(message, embed);
        });
    }

    _getTicketEmbed(issue) {
        let embed = new Discord.RichEmbed();
        let description = issue.fields.description.replace(/{quote}/gi, "```");

        embed.setTitle(issue.key)
             .setDescription(`Assignee: ${issue.fields.assignee.displayName} | issue type: ${issue.fields.issuetype.name}`);

        embed.addField(`Description`, description.substr(0, 256).trim());

        embed.setColor(Ticket_Types[issue.fields.status.statusCategory.colorName]);

        let icon = issue.fields.priority.iconUrl.replace(".svg", ".png");
        embed.setFooter(`Status: ${issue.fields.status.name}`, icon);
        return embed;
    }

    on_setup(bot)
    {
        this.bot = bot;
        JiraUser.find({}).then(docs => {
            for(let doc of docs) {
                this.jirausers[doc.user_id] = doc.jira_key;
            }
        });
    }

    on_shutdown()
    {
    }
    
    on_load(server) {
        if (this.servers[server.id] !== undefined)
            return;

        this.servers[server.id] = server;
    }

    on_unload(server) {
        if (this.servers[server.id] === undefined)
            return;

        delete this.servers[server.id];
    }
}

module.exports = new JiraModule();