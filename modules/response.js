var responses = require("../responses.js");
var util = require("../util.js");
var gd = require('node-gd');
var fs = require('fs');

module.exports = {
    moduleName: "Response",
    load: function(Bot) {
      Bot.addCommand({
        name: "RESPONSE_FUCKYOU",
        command: /fuck you/,
        sample: "sempai fuck you",
        description: "Scold sempai",
        action: function(message){
            //todo
            Bot.discord.reply(message, responses.get("SEMPAI_FUCKYOU").format({author: message.author.id}));
        }
      });
      Bot.addCommand({
          name: "RESPONSE_LOVE",
          command: /i love you/,
          sample: "sempai i love you",
          description: "Show sempai some love",
          action: function(m) {
              console.log(__dirname);
              console.log(__dirname + '/../assets/chitoge_love.png');
              if (!fs.existsSync('../assets/chitoge_love.png')) {
              // Do something
              console.log("Nope");
              return;
              }
              gd.openFile('/../assets/chitoge_love.png', function(err, img) {
                if (err) {
                  console.log("Something went wrong opening file");
                  return;
                }
                if (typeof img === "null") {
                    console.log("Image is null");
                    return;
                }
                var txtColor = img.colorAllocate(255, 255, 255);
                var fontPath = __dirname + '/../assets/wildwordsbold.ttf';
                img.stringFT(txtColor, fontPath, 24, 0, 35, 400, m.author.username);
                img.saveFile(__dirname + '/../saved/' + m.author.username + ".png", function(err) {
                    if (err) {
                      console.log("Something went wrong saving file");
                  return;
                    }
                    
                    Bot.discord.sendFile(m.channel, __dirname + "/../saved/" + m.author.username + ".png", "love.png", function(err, message) {
                        if (err) {
                            console.log("Something went wrong sending file");
                            return;
                        }
                    });
                }.bind(m));
            }.bind(m));
          }
      });
    }
}
