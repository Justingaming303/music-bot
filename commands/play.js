
const Discord = require('discord.js')

const client = new Discord.Client({ intents: 'GUILD_VOICE_STATES' })

const ytdl = require('ytdl-core')
const ytSearch = require('yt-search');

const queue = new Map();

var { DJ, permissionsToFs, prefix } = require('../config.json');
const { Console, log } = require('console');










module.exports = (client) => {



    let song = {};
    client.on("message", async message => {

        let messageArray = message.content.split(" ");
        let command = messageArray[0];
        let args = messageArray.slice(1);


        const server_queue = queue.get(message.guild.id);


        if (command === `${prefix}play` || command === `${prefix}p`) {

            var voice_channel = message.member.voice.channel;
            if (!voice_channel) return message.channel.send('<a:no:837213347518611467> Something went wrong! ou need to be in a voice channel!');
            const permissions = voice_channel.permissionsFor(message.client.user);
            if (!permissions.has('CONNECT')) return message.channel.send('<a:no:837213347518611467> Something went wrong! I dont have the correct permissions');
            if (!permissions.has('SPEAK')) return message.channel.send('<a:no:837213347518611467> Something went wrong! I  dont have the correct permissions');



            if (!args.length) return message.channel.send('<a:no:837213347518611467> Something went wrong! You need to provide a song.');




            if (ytdl.validateURL(args[0])) {
                const song_info = await ytdl.getInfo(args[0]);
                song = { title: song_info.videoDetails.title, url: song_info.videoDetails.video_url }
            } else {

                const video_finder = async (query) => {
                    const video_result = await ytSearch(query);
                    return (video_result.videos.length > 1) ? video_result.videos[0] : null;
                }

                const video = await video_finder(args.join(' '));
                if (video) {
                    song = { title: video.title, url: video.url }
                } else {
                    message.channel.send('<a:no:837213347518611467> Something went wrong! Song not found, try to double check your song provided, ensure there are no typos..');
                }
            }


            if (!server_queue) {

                const queue_constructor = {
                    voice_channel: voice_channel,
                    text_channel: message.channel,
                    connection: null,
                    songs: [],
                    skipVotes: []
                }


                queue.set(message.guild.id, queue_constructor);
                queue_constructor.songs.push(song);


                try {
                    const connection = await voice_channel.join();
                    queue_constructor.connection = connection;
                    video_player(message.guild, queue_constructor.songs[0]);
                } catch (err) {
                    queue.delete(message.guild.id);
                    message.channel.send('<a:no:837213347518611467> Something went wrong! I cant join the voice channel.');
                    throw err;
                }
            } else {
                server_queue.songs.push(song);
                return message.channel.send(`<a:yes:837213346402271262> **${song.title}** added to queue!`);
            }
        }


        else if (command === `!stop ` || command === `!st`) stop_song(message, server_queue);
        else if (command === `!q` || command === `!queue`) show_queue(message, server_queue);
        else if (command === `!skip` || command === `!sk`) skip_song(message, server_queue);
     
     
     
     
     
     
     
     
        else if (command === `!forceskip` || command === `!fs`) force_skip(message, server_queue);





    })




    const video_player = async (guild, song) => {
        var song_queue = queue.get(guild.id);

        if (!song) {
            song_queue.voice_channel.leave();
            queue.delete(guild.id);
            return;
        }
        const stream = ytdl(song.url, { filter: 'audioonly' });
        song_queue.connection.play(stream, { seek: 0, volume: 0.5 })
            .on('finish', () => {
                song_queue.songs.shift();
                video_player(guild, song_queue.songs[0]);
            });
        await song_queue.text_channel.send(`🎶 Now playing **${song.title}**`)
    }


    const skip_song = (message, server_queue) => {
        let messageArray = message.content.split(" ");
        let command = messageArray[0];
        let args = messageArray.slice(1);


        console.log('skip resnponded');
     
            if (!message.member.voice.channel) return message.channel.send('<a:no:837213347518611467> Something went wrong! Please join a voice channel to stop the music.');
            if (!server_queue) {
                return message.channel.send('<a:no:837213347518611467> Something went wrong! There are no songs in queue, please play more songs first - ``!play [song name/URL]``');
            }



            var userSize = message.member.voice.channel.members.size;

            var requiredSize = Math.ceil(userSize / 2)

            if (server_queue.skipVotes.includes(message.member.id)) {
                message.channel.send('<a:no:837213347518611467> Something went wrong! Seems like you have already voted to skip')

               
            } else {
                server_queue.skipVotes.push(message.member.id);

                message.channel.send(`<a:yes:837213346402271262> You voted to skip the song ${server_queue.skipVotes.length}/${requiredSize} votes left!`)
            }
            if (server_queue.skipVotes.length >= requiredSize) {
                server_queue.connection.dispatcher.end();
                server_queue.skipVotes = [];
                message.channel.send('<a:yes:837213346402271262> Song has been skipped!')
            }

        



    }


    const force_skip = (message, server_queue) => {


        let messageArray = message.content.split(" ");
        let command = messageArray[0];
        let args = messageArray.slice(1);
        if (!message.member.voice.channel) return message.channel.send('<a:no:837213347518611467> Something went wrong! Please join a voice channel to stop the music.' + message.member.voice.channel);
        if (!server_queue) {
            return message.channel.send('<a:no:837213347518611467> Something went wrong! There are no songs in queue, please play more songs first - ``!play [song name/URL]``');
        }

        let Dj = message.guild.roles.cache.find(role => role.id == DJ)
        let permissions = message.member.hasPermission(permissionsToFs)
        if (command === `${prefix}fskip` || command === `${prefix}forceskip`) {
            server_queue.connection.dispatcher.end();
            message.channel.send('<a:yes:837213346402271262>  Song skipped!')
            if (!permissions && !Dj) {
                message.channel.send('<a:no:837213347518611467> Something went wrong! You dont have the permission to perform this action.')

            }
        }



    }



    const stop_song = (message, server_queue) => {
        if (!message.member.voice.channel) return message.channel.send('<a:no:837213347518611467> Something went wrong! Please join a voice channel to stop the music!');
        if (!server_queue) {
            return message.channel.send('<a:no:837213347518611467> Something went wrong! There is no song...');
        }
        server_queue.songs = [];
        song = {}

        server_queue.connection.dispatcher.end();
        message.channel.send('<a:yes:837213346402271262>  Song stopped and queue cleared!')



    }


    const show_queue = (message, server_queue) => {

        var songs = []

        server_queue.songs.forEach(function (songinqueue, index, arr) {

            songs.push(`(${index + 1}) - ${songinqueue.title}\n`)



        })






        const embed = new Discord.MessageEmbed()
            .setTitle('Songs In Queue')
            .setDescription(`
            \n
            Current Queue(${songs.length - 1}):
            **Currently playing: ${songs.shift()}** 
            ${songs.join('')}
            
        `)
            .setTimestamp();
        message.channel.send(embed)
    }


}




