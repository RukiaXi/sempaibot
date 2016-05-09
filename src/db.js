"use strict";

var config = require("../config");
var connect = require('camo').connect;
var Document = require('camo').Document;
var Q = require("q");

class OsuUser extends Document
{
    constructor()
    {
        super();

        this.user_id = String;
        this.username = String;
        this.pp = Number;
        this.rank = Number;
        this.last_updated = Number;
        this.servers = [String];
    }
}

class ConfigKeyValue extends Document
{
    constructor()
    {
        super();

        this.key = String;
        this.value = Object;
    }
}

class Role extends Document
{
    constructor()
    {
        super();

        this.name = String;
        this.permissions = Object;
    }
}

var data = {
    db: null,
    OsuUser: OsuUser,
    ConfigKeyValue: ConfigKeyValue,
    Role: Role,
    load: function(){
        var defer = Q.defer();

		connect("mongodb://" + config.db_username + ":" + config.db_password + "@" + config.db_host + ":" + config.db_port + "/").then(function(db) {
            console.log("Using MongoDB as DB system.");
            data.db = db;

            defer.resolve("mongodb");
		}).catch(function(err){
            console.log(err);

            connect("nedb://data").then(function(db){
                console.log("Using NeDB as DB system.");
                data.db = db;

                defer.resolve("nedb");
            }).catch(function(err){
                defer.reject(err);
            })
		});

        return defer.promise;
    }
};

module.exports = data;
