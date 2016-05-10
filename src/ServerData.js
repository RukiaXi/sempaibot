"use strict";

const responses = require("./responses.js");
const db = require("./db.js");
const users = require("./users.js");
const Q = require("q");

class ServerData
{
    constructor(bot, server)
    {
        this.bot = bot;
        this.config = null;
        this.server = server;
        this.id = server.id;
        this.load_promise = Q.defer();
        
        var _this = this;

        for(var i = 0;i<server.members.length;i++)
        {
            var member = server.members[i];
            users.add_user(member.id, member.name, this);
        }

        db.ConfigKeyValue.findOne({key: this.server.id + "_config"}).then(function(doc){
            if(doc === null)
            {
                this.config = db.ConfigKeyValue.create({
                    _id: this.server.id + "_config", 
                    key: this.server.id + "_config", 
                    value: {
                        channel: "", 
                        modules: []
                    }
                });
                
                this.config.save().then(function(doc){
                    this.on_load();
                }.bind(this)).catch(function(err){
                    console.log(err);
                    this.on_load();
                }.bind(this));
            }
            else
            {
                this.config = doc;
                this.on_load();
            }
        }.bind(this)).catch(function(err){
            console.log(err);
        });
    }

    on_load()
    {
        if(this.channel.length !== 0)
        {
            if(this.server.channels.get("id", this.channel) === null)
            {
                //TODO: Check if the channel still exists and if not, display a "Oops, I forgot where I'm allowed to talk! Can you remind sempai?"
            }
            
            this.bot.message(responses.get("ONLINE"), this);
        }else{
            this.bot.message(responses.get("SETTING_UP"), this);
        }
        
        this.load_promise.resolve();
    }

    enable_module(name)
    {
        if(this.modules.indexOf(name) !== -1)
            return; //already enabled

        var module = this.bot.get_module(name);
        if(module === null)
            return; //no such module

        this.modules.push(name);
        module.on_load(this);

        this.config.value.modules = this.modules;
        this.config.save().catch(function(err){
            console.log(err);
        });
    }

    is_module_enabled(name)
    {
        return this.modules.indexOf(name) !== -1;
    }

    disable_module(name)
    {
        if(this.modules.indexOf(name) === -1)
            return; //already enabled

        var module = this.bot.get_module(name);
        if(module === null)
            return; //no such module

        this.modules.splice(this.modules.indexOf(name), 1);
        module.on_unload(this);

        this.config.value.modules = this.modules;
        this.config.save().catch(function(err){
            console.log(err);
        });
    }
    
    set channel(channel)
    {
        this.config.value.channel = channel;
        this.config.save().catch(function(err){
            console.log(err);
        });
    }
    
    get channel()
    {
        return this.config.value.channel;
    }
    
    get modules()
    {
        return this.config.value.modules;
    }
}

module.exports = ServerData;
