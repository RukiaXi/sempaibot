var request = require("request");
var fs = require('fs');
var https = require("https");
var Discord = require("discord.js");

var bijbel = [
    "In den beginne schiep God den hemel en de aarde.",
    "De aarde nu was woest en ledig, en duisternis was op den afgrond; en de Geest Gods zweefde op de wateren.",
    "En God zeide: Daar zij licht! en daar werd licht.",
    "En God zag het licht, dat het goed was; en God maakte scheiding tussen het licht en tussen de duisternis.",
    "En God noemde het licht dag, en de duisternis noemde Hij nacht. Toen was het avond geweest, en het was morgen geweest, de eerste dag.",
    "En God zeide: Daar zij een uitspansel in het midden der wateren; en dat make scheiding tussen wateren en wateren!",
    "En God maakte dat uitspansel, en maakte scheiding tussen de wateren, die onder het uitspansel zijn, en tussen de wateren, die boven het uitspansel zijn. En het was alzo.",
    "En God noemde het uitspansel hemel. Toen was het avond geweest, en het was morgen geweest, de tweede dag.",
    "En God zeide: Dat de wateren van onder den hemel in een plaats vergaderd worden, en dat het droge gezien worde! En het was alzo.",
    "En God noemde het droge aarde, en de vergadering der wateren noemde Hij zee�n; en God zag, dat het goed was.",
    "En God zeide: Dat de aarde uitschiete grasscheutjes, kruid zaadzaaiende, vruchtbaar geboomte, dragende vrucht naar zijn aard, welks zaad daarin zij op de aarde! En het was alzo.",
    "En de aarde bracht voort grasscheutjes, kruid zaadzaaiende naar zijn aard, en vruchtdragend geboomte, welks zaad daarin was, naar zijn aard. En God zag, dat het goed was.",
    "Toen was het avond geweest, en het was morgen geweest, de derde dag.",
    "En God zeide: Dat er lichten zijn in het uitspansel des hemels, om scheiding te maken tussen den dag en tussen den nacht; en dat zij zijn tot tekenen en tot gezette tijden, en tot dagen en jaren!",
    "En dat zij zijn tot lichten in het uitspansel des hemels, om licht te geven op de aarde! En het was alzo.",
    "God dan maakte die twee grote lichten; dat grote licht tot heerschappij des daags, en dat kleine licht tot heerschappij des nachts; ook de sterren.",
    "En God stelde ze in het uitspansel des hemels, om licht te geven op de aarde.",
    "En om te heersen op den dag, en in den nacht, en om scheiding te maken tussen het licht en tussen de duisternis. En God zag, dat het goed was.",
    "Toen was het avond geweest, en het was morgen geweest, de vierde dag.",
    "En God zeide: Dat de wateren overvloediglijk voortbrengen een gewemel van levende zielen; en het gevogelte vliege boven de aarde, in het uitspansel des hemels!",
    "En God schiep de grote walvissen, en alle levende wremelende ziel, welke de wateren overvloediglijk voortbrachten, naar haar aard; en alle gevleugeld gevogelte naar zijn aard. En God zag, dat het goed was.",
    "En God zegende ze, zeggende: Zijt vruchtbaar, en vermenigvuldigt, en vervult de wateren in de zee�n; en het gevogelte vermenigvuldige op de aarde!",
    "Toen was het avond geweest, en het was morgen geweest, de vijfde dag.",
    "En God zeide: De aarde brenge levende zielen voort, naar haar aard, vee, en kruipend, en wild gedierte der aarde, naar zijn aard! En het was alzo.",
    "En God maakte het wild gedierte der aarde naar zijn aard, en het vee naar zijn aard, en al het kruipend gedierte des aardbodems naar zijn aard. En God zag, dat het goed was.",
    "En God zeide: Laat Ons mensen maken, naar Ons beeld, naar Onze gelijkenis; en dat zij heerschappij hebben over de vissen der zee, en over het gevogelte des hemels, en over het vee, en over de gehele aarde, en over al het kruipend gedierte, dat op de aarde kruipt.",
    "En God schiep den mens naar Zijn beeld; naar het beeld van God schiep Hij hem; man en vrouw schiep Hij ze.",
    "En God zegende hen, en God zeide tot hen: Weest vruchtbaar, en vermenigvuldigt, en vervult de aarde, en onderwerpt haar, en hebt heerschappij over de vissen der zee, en over het gevogelte des hemels, en over al het gedierte, dat op de aarde kruipt!",
    "En God zeide: Ziet, Ik heb ulieden al het zaadzaaiende kruid gegeven, dat op de ganse aarde is, en alle geboomte, in hetwelk zaadzaaiende boomvrucht is; het zij u tot spijze!",
    "Maar aan al het gedierte der aarde, en aan al het gevogelte des hemels, en aan al het kruipende gedierte op de aarde, waarin een levende ziel is, heb Ik al het groene kruid tot spijze gegeven. En het was alzo.",
    "En God zag al wat Hij gemaakt had, en ziet, het was zeer goed. Toen was het avond geweest, en het was morgen geweest, de zesde dag."
];

var mapping = {
    "chezus": "Kevin",
    "camieleon": "Camiel",
    "vieze versa": "Daniel",
    "ophion": "Dolf",
    "thylix": "Mark",
    "pazazu": "Robby",
    "sempaisc2": "Sem",
    "guusjuhdegekstuh": "Guus",
    "epikfaal": "Huub"
};

var profanity = [
    {nl: "Krijg de tering {name}"},
    {nl: "{name} je moet je bek houden, je bent elluf"},
    {nl: "{name}, je kan beter gewoon je mond houden"},
    {nl: "{name} je bent een neger"}
];

var map_name = function(name){
    if(mapping[name.toLowerCase()] !== undefined)
        return mapping[name.toLowerCase()];
    
    return name;
};

var random_profanity = function(user){
    var rnd = Math.floor(Math.random() * profanity.length);
    return profanity[rnd];
};

var tts = function(query, language){
    var lang = language || "en";
    var cM = function(a) {
        return function() {
            return a
        }
    };
    
    var of = "=";
    var dM = function(a, b) {
        for (var c = 0; c < b.length - 2; c += 3) {
            var d = b.charAt(c + 2),
                d = d >= t ? d.charCodeAt(0) - 87 : Number(d),
                d = b.charAt(c + 1) == Tb ? a >>> d : a << d;
            a = b.charAt(c) == Tb ? a + d & 4294967295 : a ^ d
        }
        return a
    };

    var eM = null;
    var cb = 0;
    var k = "";
    var Vb = "+-a^+6";
    var Ub = "+-3^+b+-f";
    var t = "a";
    var Tb = "+";
    var dd = ".";
    var hoursBetween = Math.floor(Date.now() / 3600000);
    var TKK = hoursBetween.toString();

    fM = function(a) {
        var b;
        if (null === eM) {
            var c = cM(String.fromCharCode(84)); // char 84 is T
            b = cM(String.fromCharCode(75)); // char 75 is K
            c = [c(), c()];
            c[1] = b();
            // So basically we're getting window.TKK
            eM = Number(TKK) || 0
        }
        b = eM;

        // This piece of code is used to convert d into the utf-8 encoding of a
        var d = cM(String.fromCharCode(116)),
            c = cM(String.fromCharCode(107)),
            d = [d(), d()];
        d[1] = c();
        for (var c = cb + d.join(k) +
                of, d = [], e = 0, f = 0; f < a.length; f++) {
            var g = a.charCodeAt(f);

            128 > g ? d[e++] = g : (2048 > g ? d[e++] = g >> 6 | 192 : (55296 == (g & 64512) && f + 1 < a.length && 56320 == (a.charCodeAt(f + 1) & 64512) ? (g = 65536 + ((g & 1023) << 10) + (a.charCodeAt(++f) & 1023), d[e++] = g >> 18 | 240, d[e++] = g >> 12 & 63 | 128) : d[e++] = g >> 12 | 224, d[e++] = g >> 6 & 63 | 128), d[e++] = g & 63 | 128)
        }


        a = b || 0;
        for (e = 0; e < d.length; e++) a += d[e], a = dM(a, Vb);
        a = dM(a, Ub);
        0 > a && (a = (a & 2147483647) + 2147483648);
        a %= 1E6;
        return a.toString() + dd + (a ^ b)
    };

    var token = fM(query);
    var url = "https://translate.google.com/translate_tts?ie=UTF-8&q="  + encodeURI(query) + "&tl=" + lang + "&tk=" + token + "&client=t";
    
    return url;
};

var getVoiceChannel = function(client, m){
    for (var channel of m.channel.server.channels)
    {
        if (channel instanceof Discord.VoiceChannel)
        {
            if(channel.members.has("id", m.author.id))
            {
                return channel;
            }
        }
    }
    
    return m.author.voiceChannel;
};

var isPlaying = false;
var queue = [];
var play = function(Bot, arr, m, lang){
    var channel = getVoiceChannel(Bot.discord, m);
    if(channel == null)
    {
        //console.log("channel = null", m.author);
        return; //todo: error message
    }
    
    var language = lang || "nl";
    if(isPlaying)
    {
        queue.push({
            msg: arr,
            m: m,
            language: language,
            channel: channel
        });
        
        return;
    }
    
    isPlaying = true;
    Bot.discord.joinVoiceChannel(channel, function(err, connection){
        if(err)
            return console.log("Error joining voice channel: " + err);
        
        try{
            var send = function(i){
                if(!isPlaying)
                {
                    queue = [];
                    
                    Bot.discord.leaveVoiceChannel();
                    return;
                }
                
                if(i >= arr.length)
                {
                    if(queue.length == 0)
                    {
                        Bot.discord.leaveVoiceChannel();
                        isPlaying = false;
                        
                        return;
                    }
                    else
                    {
                        var item = queue[0];
                        queue.splice(0, 1);
                        
                        language = item.language;
                        arr = item.msg;
                        m = item.m;
                        return send(0);
                    }
                }
                
                var url = tts(arr[i], language);
                connection.playFile(url, {volume: 0.5}, function(err, intent){
                    intent.on("end", function(){
                        if(i == arr.length - 1 && queue.length == 0)
                        {
                            send(i + 1);
                        }
                        
                        setTimeout(function(){
                            send(i + 1);
                        }, 250);
                    });

                    intent.on("time", function(t){
                    });

                    intent.on("error", function(e){
                    });
                }).catch(function(err){
                    console.log(err);
                });
            };
            
            send(0);
        }catch(err)
        {
            console.log(err);
        }
    });
};

module.exports = {
    moduleName: "Text-To-Speech",
    load: function(Bot){
        Bot.addCommand({
            name: "TTS_BIJBEL",
            command: /bijbel/i,
            sample: "sempai read me the bijbel",
            description: "Uses TTS to read Genesis 1 of the Old Testament in Dutch",
            action: function(m){
                play(Bot, bijbel, m);
            }
        });
        
        Bot.addCommand({
            name: "TTS_INSULT",
            command: /insult ?(.*)?/i,
            sample: "sempai insult __*user*__",
            description: "Uses TTS to insult someone (user is optional, when user is not specified the author of the message is used)",
            action: function(m, target){
                var n = target || m.author.name;
                n = map_name(n);
                
                var profanity = random_profanity();
                for(var key in profanity)
                {
                    if(Array.isArray(profanity[key]))
                        play(Bot, profanity[key], m, key);
                    else
                        play(Bot, [profanity[key].format({name: n})], m, key);
                    
                    break;
                }
            }
        });
        
        Bot.addCommand({
            name: "TTS_FUCKYOU",
            command: /fuck you/i,
            hidden: true,
            action: function(m){
                var name = map_name(m.author.name);
                //todo: play(Bot, "No, fuck you {name}".format({name: name}));
            }
        });
        
        Bot.addCommand({
            name: "TTS_INTERRUPT",
            command: /interrupt tts/i,
            sample: "sempai interrupt tts",
            description: "Interrupts the TTS queue",
            action: function(m, target){
                isPlaying = false;
            }
        });
    }
};