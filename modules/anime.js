var http = require("http");
var https = require("https");
var parseString = require('xml2js').parseString;
var cloudscraper = require('cloudscraper');
var g = require('ger');
var esm = new g.MemESM();
var ger = new g.GER(esm);
var lodash = require("lodash");
var parseTorrent = require('parse-torrent');
var db = require("../db.js");
var responses = require("../responses.js");
const util = require('util');
const EventEmitter = require('events');
ger.initialize_namespace("anime");

var magnetLink = function(url, callback){
    cloudscraper.request({method: "GET", url: url, encoding: null}, function(error, response, body){
        try{
            var torrent = parseTorrent(body);
            callback(null, 'magnet://?xt=urn:btih:' + torrent.infoHash);
        }catch(e)
        {
            callback(e);
        }
    });
};

function Recommend()
{
    this.users = [];
    this.anime = {};
}

Recommend.prototype.addUser = function(user){
    this.users.push(user);
};

Recommend.prototype.removeUser = function(user){
    this.users.splice(this.users.indexOf(user));
};

Recommend.prototype.save = function(){
    //todo
};

Recommend.prototype.load = function(data){
    //todo
};

Recommend.prototype.update = function(callback){
    var _this = this;
    
    this.anime = {};
    var update = function(id){
        if(id >= _this.users.length)
            return (callback !== undefined) ? callback() : null;
        
        var options = {
            host: 'myanimelist.net',
            port: 80,
            path: "/malappinfo.php?status=all&type=anime&u=" + _this.users[id]
        };
        
        http.get(options, function(res){
            var data = "";
            res.on('data', function (chunk) {
                data += chunk;
            });
            
            res.on('end', function () {
                parseString(data, function(err, result){
                    for(var i = 0;i<result.myanimelist.anime.length;i++)
                    {
                        var anime = result.myanimelist.anime[i];
                        if(anime.my_score[0] == 0 || anime.series_type[0] != 1)
                            continue;
                        
                        if(_this.anime[anime.series_animedb_id[0]] === undefined)
                        {
                            _this.anime[anime.series_animedb_id[0]] = {
                                name: anime.series_title[0],
                                scores: {}
                            };
                        }
                        
                        var date = new Date(parseInt(anime.my_last_updated[0]) * 1000);
                        date.setFullYear(date.getFullYear() + 3);
                        
                        if(parseInt(anime.my_score[0]) >= 7)
                        {
                            ger.events([{
                                namespace: "anime",
                                person: id,
                                action: anime.my_score[0],
                                thing: parseInt(anime.series_animedb_id[0]),
                                expires_at: date.toString()
                            }]);
                        }
                        
                        _this.anime[anime.series_animedb_id[0]].scores[id] = anime.my_score[0];
                    }
                    
                    update(id + 1);
                });
            });
        });
    };
    
    if(this.users.length == 0)
        return (callback !== undefined) ? callback() : null;
    
    update(0);
};

Recommend.prototype.recommend = function(user){
    var id = this.users.indexOf(user);
    if(id == -1)
        return;
    
    ger.recommendations_for_person("anime", id, {
        actions: {
            "1": -6,
            "2": -5,
            "3": -4,
            "4": -3,
            "5": -2,
            "6": -1,
            "7": 1,
            "8": 2,
            "9": 3,
            "10": 4
        }
    }).then(function(recommendations){
        console.log(user + ":");
        for(var i = 0;i<recommendations.recommendations.length;i++)
        {
            var recommendation = recommendations.recommendations[i];
            
            if(this.anime[recommendation.thing].scores[id] === undefined)
                console.log(this.anime[recommendation.thing].name);
        }
        console.log("confidence: " + recommendations.confidence);
        console.log("");
    }.bind(this));
};

function Anime()
{
    this.regex = [
        /\[(.*)\]\s+(.+)\s+-\s+([^\)]*)\s+(?:\(([^\)]+)\))/i,
        /\[(.*)\]\s+(.+)\s+-\s+([^\]]*)\s+(?:\[([^\]]+)\])/i
    ];
    this.alternateNames = {};
    this.alternateUpdateInProgress = false;
    this.lastAlternateUpdate = -1;
    this.lastResults = [];
    this.tracking = {};
    this.changed = false;
    
    setInterval(function(){
        this.update();
    }.bind(this), 30000);
}

Anime.prototype.search = function(anime, callback){
    var _this = this;
    
    var retrieve = function(){
        http.get("http://skyhook.sonarr.tv/v1/tvdb/search/en/?term=" + anime, function(res){
            var data = "";
            res.on('data', function (chunk) {
                data += chunk;
            });
            
            res.on('end', function () {
                try{
                    var parsed = JSON.parse(data);
                    var shows = [];
                    for(var i = 0;i<parsed.length;i++)
                    {
                        var titles = [parsed[i].title];
                        if(_this.alternateNames[parsed[i].tvdbId] !== undefined)
                        {
                            titles = titles.concat(_this.alternateNames[parsed[i].tvdbId]);
                        }
                        
                        parsed[i].titles = titles;
                        parsed[i].id = parsed[i].tvdbId;
                        
                        shows.push({
                            titles: titles,
                            description: parsed[i].overview,
                            firstAired: parsed[i].firstAired,
                            network: parsed[i].network,
                            status: parsed[i].status,
                            id: parsed[i].tvdbId
                        });
                    }
                    
                    _this.lastResults = parsed;
                    callback(shows);
                }catch(err){
                    console.log("Error searching: " + err);
                    callback(null, err);
                }
            });
            
            res.on('error', function(exception){
                console.log("PANIC, Can't search for the anime '" + anime + "' because: '" + exception + "'.");
            });
        });
    };
    
    if(!this.alternateFilled)
    {
        this.updateAlternateNames(retrieve);
    }else{
        retrieve();
    }
};

Anime.prototype.getName = function(id){
    if(id < 0 || id >= this.lastResults.length)
        return null; //invalid id
    
    return this.lastResults[id].titles[0];
};

Anime.prototype.track = function(id, name){
    if(id < 0 || id >= this.lastResults.length)
        return -1; //invalid id
    
    if(this.tracking[this.lastResults[id].id] !== undefined)
        return 0; //already tracking
    
    this.tracking[this.lastResults[id].id] = this.lastResults[id];
    this.tracking[this.lastResults[id].id].lastUpdated = -1;
    this.tracking[this.lastResults[id].id].magnets = {};
    this.tracking[this.lastResults[id].id].updateInProgress = false;
    this.tracking[this.lastResults[id].id]._internalName = name;
    this.updateAnime(this.lastResults[id].id);
    this.changed = true;
    
    return 1; //started tracking
};

Anime.prototype.stopTracking = function(id){
    if(this.tracking[id] === undefined)
        return 0; //not tracking
    
    delete this.tracking[id];
    this.changed = true;
    
    return 1;
};

function parseQuality(quality)
{
    if(quality.toLowerCase().indexOf("720p") != -1)
        return "720p";
    
    if(quality.toLowerCase().indexOf("1080p") != -1)
        return "1080p";
    
    if(quality.toLowerCase().indexOf("480p") != -1)
        return "480p";
    
    return "Unknown";
};

function parseDescription(description)
{
    var regex = /(.*) seeder\(s\), (.*) leecher\(s\), (.*) download\(s\) - ([^-]+)(?:- (.*))?/;
    var parsed = regex.exec(description);
    var trusted = parsed[5] !== undefined && parsed[5] == "Trusted";
    var remake = parsed[5] !== undefined && parsed[5] == "Remake";
    
    var ret = {
        seeders: parsed[1],
        leechers: parsed[2],
        downloads: parsed[3],
        size: parsed[4],
        trusted: trusted,
        remake: remake
    };
    
    return ret;
};

function qualityId(quality)
{
    if(quality == "Unknown")
        return 0;
    
    if(quality == "480p")
        return 1;
    
    if(quality == "720p")
        return 2;
    
    if(quality == "1080p")
        return 3;
    
    return 0;
};

Anime.prototype.onNewMagnetLink = function(id, ep, link){
    var magnetData = this.tracking[id].magnets[ep][link];
    var endTime = new Date(new Date().getTime() - (12 * 60 * 60 * 1000));
    
    for(var i = 0;i<this.tracking[id].episodes.length;i++)
    {
        var episode = this.tracking[id].episodes[i];
        if(episode.absoluteEpisodeNumber == ep)
        {
            var date = new Date(episode.airDateUtc);
            var delta = date.getTime() - endTime.getTime();
            
            if(delta < 0)
                break; //for a non-recent episode
            
            if(magnetData.qualityId > this.tracking[id].magnets[ep].lastSend)
            {
                this.tracking[id].magnets[ep].lastSend = magnetData.qualityId;
                this.emit("newDownload", this.tracking[id].titles[0], magnetData);
            }
            
            break;
        }
    }
};

Anime.prototype.match = function(title, description, date, link){
    var _this = this;
    
    link = decodeURI(link);
    for(var i = 0;i<this.regex.length;i++)
    {
        var m = this.regex[i].exec(title);
        if(m == null)
            continue;
        
        var name = m[2].trim();
        var quality = m[4].trim();
        var ep = parseInt(m[3].trim());
        var group = m[1].trim();
        
        for(var key in this.tracking)
        {
            if(this.tracking[key].updateInProgress || this.tracking[key].lastUpdated == -1)
                continue;
            
            if(this.tracking[key].titles.indexOf(name) != -1)
            {
                if(this.tracking[key].magnets[ep] === undefined)
                    this.tracking[key].magnets[ep] = {lastSend: -1};
                
                magnetLink(link, function(err, magnetLink){
                    if(_this.tracking[key].magnets[ep][magnetLink] !== undefined)
                        return; //already have this one
                    
                    var data = parseDescription(description);
                    if(!data.trusted)
                        return;
                    
                    _this.tracking[key].magnets[ep][magnetLink] = {
                        file: title,
                        group: group,
                        quality: parseQuality(quality),
                        qualityId: qualityId(parseQuality(quality)),
                        data: data,
                        date: date,
                        magnet: magnetLink
                    };
                    
                    _this.changed = true;
                    _this.onNewMagnetLink(key, ep, magnetLink);
                });
                
                break;
            }
        }
        
        break;
    }
};

Anime.prototype.updateAlternateNames = function(callback){
    var _this = this;
    
    var delta = Date.now() - this.lastAlternateUpdate;
    if(this.lastAlternateUpdate != -1 && delta <= (5 * 60 * 60 * 1000))
    {
        callback();
        return;
    }
    
    if(this.alternateUpdateInProgress)
    {
        callback();
        return;
    }
    
    this.alternateUpdateInProgress = true;
    http.get("http://thexem.de/map/allNames?origin=tvdb", function(res){
        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        
        res.on('end', function () {
            _this.alternateNames = JSON.parse(data).data;
            _this.lastAlternateUpdate = Date.now();
            _this.alternateUpdateInProgress = false;
            
            callback();
        });
        
        res.on('error', function(exception){
            console.log("PANIC, Can't update alternative names because: '" + exception + "'.");
        });
    });
};

Anime.prototype.updateAnime = function(id){
    var _this = this;
    
    var delta = Date.now() - _this.tracking[id].lastUpdated;
    if(delta <= (5 * 60 * 60 * 1000) && _this.tracking[id].lastUpdated != -1)
        return; //updated less then 5 hours ago
    
    if(_this.tracking[id].updateInProgress)
        return; //already being updated
    
    _this.tracking[id].updateInProgress = true;
    http.get("http://skyhook.sonarr.tv/v1/tvdb/shows/en/" + id, function(res){
        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        
        res.on('end', function () {
            data = JSON.parse(data);
            if(_this.tracking[id] === undefined)
                return;
            
            _this.tracking[id] = lodash.merge(_this.tracking[id], data);
            _this.tracking[id].lastUpdated = Date.now();
            _this.tracking[id].updateInProgress = false;
            
            _this.changed = true;
        });
        
        res.on('error', function(exception){
            console.log("PANIC, Can't update anime '" + _this.tracking[id]._internalName + "' because: '" + exception + "'.");
        });
    });
};

Anime.prototype.update = function(){
    var _this = this;
    
    for(var key in this.tracking)
    {
        this.updateAnime(key);
    }
    
    cloudscraper.get("https://www.nyaa.eu/?page=rss&cats=1_37&filter=1", function(error, response, body){
        parseString(body, function(err, result){
            if(err)
                return console.log("Can't retrieve nyaa rss feed: ", err);
            
            var results = result.rss.channel[0].item;
            for(var i = 0;i<results.length;i++)
            {
                var item = results[i];
                var title = item.title[0];
                var link = item.link[0];
                var description = item.description[0];
                var date = item.pubDate[0];
                
                _this.match(title, description, date, link);
            }
            
            if(_this.changed)
            {
                _this.emit("changed");
                _this.changed = false;
            }
        });
    });
};

Anime.prototype.setAllTracked = function(data){
    this.tracking = data;
};

Anime.prototype.getAllTracked = function(){
    return this.tracking;
};

Anime.prototype.mapNameToId = function(name){
    for(var key in this.tracking)
    {
        if(this.tracking[key]._internalName == name)
            return key;
    }
    
    return null;
};

util.inherits(Anime, EventEmitter);

module.exports = {
    load: function(Bot){
        var anime = new Anime();
        
        anime.on("newDownload", function(show, data){
            //todo: something with subscribers for a specific show instead of broadcasting it to everyone

            Bot.discord.sendMessage(Bot.discord.channels.get("name", "osu"), responses.get("ANIME_NEW_DOWNLOAD").format({
                show: show,
                seeders: data.data.seeders,
                leechers: data.data.leechers,
                downloads: data.data.downloads,
                is_trusted: data.data.trusted,
                magnet: data.magnet,
                file: data.file,
                group: data.group,
                quality: data.quality
            }));
        });

        anime.on("changed", function(){
            db.data.update({name: "anime_tracked"}, {value: anime.getAllTracked()}, {}, function(err, numUpdated){
                if(err)
                    return console.log("Update error: " + err);

                if(numUpdated == 0)
                {
                    db.data.insert({name: "anime_tracked", value: anime.getAllTracked()}, function(err, doc){
                        if(err)
                            console.log("Insert error: " + err);
                    });
                }
            });
        });
        
        Bot.commands.push({
            command: /track anime (.*) as (.*)/,
            sample: "sempai track anime (*id*) as (*name*)",
            description: "Tracks an Anime for new releases",
            action: function(m, id, trackName) {
                id = parseInt(id) - 1;

                var result = anime.track(id, trackName);
                if(result == -1)
                {
                    Bot.discord.sendMessage(m.channel, responses.get("ANIME_INVALID_ID").format({author: m.author.id, id: id}));
                }else if(result == 0)
                {
                    var name = anime.getName(id);
                    Bot.discord.sendMessage(m.channel, responses.get("ANIME_ALREADY_TRACKING").format({author: m.author.id, anime: name}));
                }else if(result == 1)
                {
                    var name = anime.getName(id);
                    Bot.discord.sendMessage(m.channel, responses.get("ANIME_NOW_TRACKING").format({author: m.author.id, anime: name}));
                }
            }
        });
        
        Bot.commands.push({
            command: /stop tracking anime (.*)/,
            sample: "sempai stop tracking anime (*name*)",
            description: "Stops tracking the anime for new releases",
            action: function(m, name){
                var data = "";
                var tracked = anime.getAllTracked();
                var id = anime.mapNameToId(name);
                
                if(tracked[id] === undefined)
                {
                    return Bot.discord.sendMessage(m.channel, responses.get("ANIME_NOT_TRACKING").format({author: m.author.id, name: name}));
                }
                
                var res = anime.stopTracking(id);
                if(!res)
                {
                    Bot.discord.sendMessage(m.channel, responses.get("ANIME_NOT_TRACKING").format({author: m.author.id, name: name}));
                }else{
                    Bot.discord.sendMessage(m.channel, responses.get("ANIME_STOPPED_TRACKING").format({author: m.author.id, name: name}));
                }
            }
        });
        
        Bot.commands.push({
            command: /list anime/,
            sample: "sempai list anime",
            description: "List all the anime currently being tracked",
            action: function(message){
                var tracked = anime.getAllTracked();
                var data = "";
                for(var key in tracked)
                {
                    data += "**" + tracked[key]._internalName + "**: " + tracked[key].titles[0] + "\r\n";
                }

                if(data.length == 0)
                    return Bot.discord.sendMessage(message.channel, responses.get("ANIME_TRACKING_LIST_EMPTY").format({author: message.author.id}));

                Bot.discord.sendMessage(message.channel, responses.get("ANIME_TRACKING_LIST").format({author: message.author.id, results: data}));
            }
        });
        
        Bot.commands.push({
            command: /get downloads for the anime (.*)/,
            sample: "sempai get downloads for the anime (*name*)",
            description: "Lists downloads for the anime specified by name.",
            action: function(message, name){
                var data = "";
                var tracked = anime.getAllTracked();
                var id = anime.mapNameToId(name);
                
                if(tracked[id] === undefined)
                {
                    return Bot.discord.sendMessage(message.channel, responses.get("ANIME_INVALID_ID").format({author: message.author.id, id: name}));
                }

                var results = [""];
                if(tracked[id].episodes !== undefined)
                {
                    tracked[id].episodes.sort(function(a, b){
                        if(a.absoluteEpisodeNumber !== undefined && b.absoluteEpisodeNumber === undefined)
                            return -1;

                        if(a.absoluteEpisodeNumber === undefined && b.absoluteEpisodeNumber !== undefined)
                            return 1;

                        if(a.absoluteEpisodeNumber === undefined && b.absoluteEpisodeNumber === undefined)
                            return 0;

                        return a.absoluteEpisodeNumber - b.absoluteEpisodeNumber;
                    });

                    for(var i = 0;i<tracked[id].episodes.length;i++)
                    {
                        var episode = tracked[id].episodes[i];
                        var add = "";

                        //we just skip the episodes without absolute episode number for now, later on we should probably parse thexem and map the tvdb season & episode number to absolute episode number.
                        if(episode.absoluteEpisodeNumber === undefined)
                            continue;

                        if(tracked[id].magnets[episode.absoluteEpisodeNumber] !== undefined)
                        {
                            var best = null;
                            for(var key in tracked[id].magnets[episode.absoluteEpisodeNumber])
                            {
                                if(key === "lastSend")
                                    continue;

                                if(best == null || tracked[id].magnets[episode.absoluteEpisodeNumber][key].qualityId > best.qualityId)
                                {
                                    best = tracked[id].magnets[episode.absoluteEpisodeNumber][key];
                                }
                            }

                            add = "**" + episode.absoluteEpisodeNumber + "**: " + best.quality + ". " + best.magnet + "\r\n";
                        }else{
                            var date = new Date(episode.airDateUtc);
                            var aired = date.getTime() <= (new Date()).getTime();
                            
                            if(!aired)
                                add = "**" + episode.absoluteEpisodeNumber + "**: Not yet aired.\r\n";
                            else
                                add = "**" + episode.absoluteEpisodeNumber + "**: No download found.\r\n";
                        }

                        if(results[results.length - 1].length + add.length >= 1600)
                        {
                            results.push(add);
                        }else{
                            results[results.length - 1] += add;
                        }
                    }
                }else{
                    results[0] = "No episodes found!";
                }

                var send = function(i){
                    if(i == results.length)
                        return;

                    Bot.discord.sendMessage(message.channel, results[i], {}, function(err, message){
                        setTimeout(function(){
                            send(i + 1);
                        }, 40);
                    });
                };

                Bot.discord.sendMessage(message.channel, responses.get("ANIME_TRACKING_LIST_DETAIL").format({author: message.author.id, anime: tracked[id].titles[0], results: results[0]}), {}, function(err, message){
                    setTimeout(function(){
                        send(1);
                    }, 40);
                });
            }
        });
        
        Bot.commands.push({
            command: /search for the anime (.*)/,
            sample: "sempai search for the anime (*anime*)",
            description: "Searches for the anime",
            action: function(m, name){
                anime.search(name, function(shows, err){
                    if(err !== undefined)
                    {
                        //todo: handle error
                        return;
                    }

                    var data = [""];
                    for(var i = 0;i<shows.length;i++)
                    {
                        var add = "{id}. **{name}**\r\n{description}\r\n**Airdate: {date}, Network: {network}, Status: {status}**\r\n\r\n".format({name: shows[i].titles[0], description: shows[i].description, date: shows[i].firstAired, network: shows[i].network, status: shows[i].status, id: i+1});
                        if((data[data.length - 1].length + add.length) >= 1600)
                        {
                            data.push(add);
                        }else{
                            data[data.length - 1] = data[data.length - 1] + add;
                        }
                    }

                    if(shows.length == 0)
                        Bot.discord.sendMessage(m.channel, responses.get("ANIME_SEARCH_NO_RESULTS").format({author: m.author.id, anime: name}));
                    else
                    {
                        var send = function(i){
                            if(i == data.length)
                                return;

                            Bot.discord.sendMessage(m.channel, data[i], {}, function(err, message){
                                setTimeout(function(){
                                    send(i + 1);
                                }, 40);
                            });
                        };

                        Bot.discord.sendMessage(m.channel, responses.get("ANIME_SEARCH_RESULTS").format({author: m.author.id, anime: name, results: data[0]}), {}, function(err, message){
                            setTimeout(function(){
                                send(1);
                            }, 40);
                        });
                    }
                });
            }
        });
        
        db.data.findOne({name: "anime_tracked"}, function(err, doc){
            if(doc != null)
            {
                anime.setAllTracked(doc.value);
            }
        });
    }
};