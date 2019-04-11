const Discord = require('discord.js');
var request = require("request");
var fs = require("fs");

const client = new Discord.Client()
var tournament_channel;
var stream_state='';

client.on('ready', () => {
    console.log("Connected as " + client.user.tag)

    console.log("Servers:")
    client.guilds.forEach((guild) => {
        console.log(" - " + guild.name)

        //List all channels
        guild.channels.forEach((channel) => {
            console.log(` -- Name:${channel.name} (${channel.type}) - ID:${channel.id}`)
            if(channel.name === 'tournament'){
                tournament_channel = channel;
                channel_tournament_id = channel.id;
            }
        })
        console.log();
    })
    //var tournamentChannel = client.channels.get(channel_tournament_id)
    //tournamentChannel.send("Hello, world, I am the god bot!")
  


    console.log('Нахожусь в режиме прослушивания сообщений...')

})


client.on('message', (recievedMessage) => {
    
    //Prevent bot from responding to its own messages
    if(recievedMessage.author == client.user){
        return
    }

    if(recievedMessage.content.startsWith('!channel')) {
        if(recievedMessage.content.indexOf("--clear") >= 0){
            console.log('Зачистка канала '+recievedMessage.channel.name);
            recievedMessage.channel.fetchMessages().then(messages => {
                recievedMessage.channel.bulkDelete(messages);
                messagesDeleted = messages.array().length; // number of messages deleted
        
                // Logging the number of messages deleted on both the channel and console.
                recievedMessage.channel.send("Deletion of messages successful. Total messages deleted: "+messagesDeleted);
                console.log('Deletion of messages successful. Total messages deleted: '+messagesDeleted)
            }).catch(err => {
                recievedMessage.channel.send("something went wrong...");
                console.log('Error while doing Bulk Delete');
                console.log(err);
            });
        }else if(recievedMessage.content.indexOf("--ping") >= 0){
            recievedMessage.channel.send('pong');
        }
        return;
    }else if(recievedMessage.content.startsWith('!stream')) {
        if(recievedMessage.content.indexOf("--name") >= 0){

            setInterval(getStreamInfo, 10000, recievedMessage);

        }else {
            recievedMessage.channel.send('something went wrong.');
        }
    }else if(recievedMessage.channel.name ==='tournament'){
        if(recievedMessage.content.startsWith('!tournament')){
            recievedMessage.channel.send('Информация по поводу соревнований и призов находится на этапе разработки и будет оглашена в ближайшее время. Будь готов!')
            return
        }
    }


    console.log(`-- ${recievedMessage.author.username} -- ${recievedMessage.content}`)
})

// Get your bot's secret token from:
// https://discordapp.com/developers/applications/
// Click on your application -> Bot -> Token -> "Click to Reveal Token"
bot_secret_token = "NTYyMzY3NjYyMjQwMzAxMDgz.XKJybQ.iX5d_TM1Mnx7dJSKGWcFDmE1Pkg"
client.login(bot_secret_token)

function getStreamInfo(recievedMessage){
    //console.log('Cant stop me now! ' + recievedMessage.content);
    var streamer_name = recievedMessage.content.split(/[ ]+/).pop();
    console.log('request streamer: ' + streamer_name);
    //recievedMessage.channel.send('request streamer: ' + streamer_name);
    var options = {
        method: 'GET',
        url: 'https://api.twitch.tv/helix/streams',
        qs: { user_login: streamer_name },
        headers:{ 'Client-ID': 'qf8ciu6yyd4rbc32fyy9n7hwl1s6ai' } 
    };
    request(options, function (error, response, body) {
        fs.writeFile('./myfile.csv', body, { flag: 'w' }, function(err) {
            if (err)
            return console.error(err);
            fs.readFile('./myfile.csv', 'utf-8', function (err, data) {
                if (err)
                return console.error(err);
                //console.log(JSON.parse(data));
                //console.log("body: " + JSON.stringify(body));
                //console.log("data:" + JSON.stringify(JSON.parse(body).data));
                //console.log("type:" + JSON.stringify(JSON.parse(body).data.type));
                var myObj = JSON.parse(data);
                if(myObj.data === undefined || myObj.data.length == 0){
                    if( stream_state === 'live'){
                        recievedMessage.channel.send(streamer_name + ' went offline!');
                    } else if( stream_state === ''){
                        recievedMessage.channel.send(streamer_name + ' is offline!');
                    }
                    stream_state = 'offline';
                    console.log(stream_state);
                    return;
                }
                for (i in myObj.data) {
                    if(myObj.data[i].type == 'live' && (stream_state === 'offline' || stream_state === '')){
                        if(stream_state === ''){
                            recievedMessage.channel.send(streamer_name + ' is now streaming!\nViewer count ' + myObj.data[i].viewer_count + ".\nStarted at " + myObj.data[i].started_at + ".\nTitle "+myObj.data[i].title);
                        }else if (stream_state ==='offline'){
                            recievedMessage.channel.send(streamer_name + ' went online right now!\nViewer count ' + myObj.data[i].viewer_count + ".\nStarted at " + myObj.data[i].started_at + ".\nTitle "+myObj.data[i].title);
                        }
                    }
                    stream_state = 'live';
                }
                console.log(stream_state);
                return;
            });
        });
        
    });
    
}