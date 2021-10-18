const Discord = require('discord.js');

const client = new Discord.Client();

const {prefix, token} = require('./config.json')


const ping = require('./commands/ping')


const play = require('./commands/play');

client.once('ready', () => {

    console.log(`Property of Justin W.`);


    client.user.setActivity(`for !help `, { type: 'WATCHING' }).catch(console.error);

});

client.on('message', message => {

    let messageArray = message.content.split(" ");
    let command = messageArray[0];
    let args = messageArray.slice(1);

    if (command === `!help`) {
        const embed = new Discord.MessageEmbed()
            .setTitle('**Help Page**')
            .addFields([
                { name: "Play", value: "!play/p -  ``!play [title/URL]`` - Plays music from Youtube" },
                { name: "Stop", value: "!stop - ``!stop`` - Stops playing music and clears the queue" },
                { name: "Skip", value: "!skip - ``!skip`` - Skips current music and plays the next in queue" },
                { name: "View Queue", value: "!queue/!q - Displays the queue" },
                { name: "Ping", value: "!ping - ``!ping`` - Displays the API latency of the bot " }
            ])

            .setTimestamp()
        message.channel.send(embed)
    }

    if (command === `!die`) {
        client.destroy();
        console.log('die command used')
    }


})

play(client)
ping(client)
client.login(token)