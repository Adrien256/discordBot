const Discord = require("discord.js")
const { MessageEmbed } = require("discord.js")
const dotenv = require("dotenv")
const axios = require('axios')
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const fs = require("fs")
const voice = require('@discordjs/voice')
const discordTTS = require('discord-tts')
const { Player } = require("discord-player")
const {AudioPlayer, createAudioPlayer, createAudioResource, StreamType, entersState, VoiceConnectionStatus, joinVoiceChannel} = require("@discordjs/voice");
const { addSpeechEvent } = require("discord-speech-recognition")

dotenv.config()
const TOKEN = process.env.TOKEN
const weatherAPI = process.env.weatherAPI
const command = process.env.command

const LOAD_SLASH = process.argv[2] == "load"

const CLIENT_ID = "980982534965981244"
const guilds = ["459787057749950485" , "934294286403534870"]



comingFromLofi = false

const client = new Discord.Client({
    intents: [
        "GUILDS",
        "GUILD_VOICE_STATES",
        "GUILD_MESSAGES",
        "GUILD_MEMBERS",
        "DIRECT_MESSAGES", 
        "DIRECT_MESSAGE_REACTIONS", 
        "DIRECT_MESSAGE_TYPING"
    ],
    partials: [
        'CHANNEL'
    ]
})
addSpeechEvent(client)

client.slashcommands = new Discord.Collection()
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25
    }
})

let commands = []
var voiceConnection;
let audioPlayer=new AudioPlayer();
var firstCreate = true;
var timeoutID;

const slashFiles = fs.readdirSync("./slash").filter(file => file.endsWith(".js"))
for (const file of slashFiles){
    const slashcmd = require(`./slash/${file}`)
    client.slashcommands.set(slashcmd.data.name, slashcmd)
    if (LOAD_SLASH) commands.push(slashcmd.data.toJSON())
}

if (LOAD_SLASH) {
    guilds.forEach((ID) => {
        const rest = new REST({ version: "9" }).setToken(TOKEN)
        console.log("Deploying slash commands")
        rest.put(Routes.applicationGuildCommands(CLIENT_ID, ID), {body: commands})
        .then(() => {
            console.log("Successfully loaded")
            process.exit(0)
        })
        .catch((err) => {
            if (err){
                console.log(err)
                process.exit(1)
            }
        })
    })  
}
else {
    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}`)
        client.user.setActivity('Among Us', {
            type: "STREAMING",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        })
    })
    client.on("messageCreate", async (message) => {
        if (message.channel.type === "DM" && !message.author.bot) {
            try{
            clearTimeout(timeoutID);
            timeoutID = undefined;
            myServerID = "934294286403534870";
            myChannelID = "934294286403534876";

            const queue = await client.player.createQueue(client.guilds.cache.get(myServerID))
            queue.destroy();

            const stream=discordTTS.getVoiceStream(message.content);
            const audioResource=createAudioResource(stream, {inputType: StreamType.Arbitrary, inlineVolume:true});

            voiceConnection = joinVoiceChannel({
                channelId: myChannelID,
                guildId: myServerID,
                adapterCreator: (client.guilds.cache.get(myServerID)).voiceAdapterCreator,
            });

            if(voiceConnection.status===VoiceConnectionStatus.Connected){
                voiceConnection.subscribe(audioPlayer);
                audioPlayer.play(audioResource);
            } 
            // start timer to disconnect from channel
            timeoutID = setTimeout(() => {
                voiceConnection.destroy();
              }, 15 * 60 * 1000) // n * seconds * milliseconds.
        }
        catch(error){
            console.log(error);
        }
            

        }
        if (message.content.startsWith(command)) {
            var args = message.content.slice(command.length).split(' ');
            var pCommand = args.shift().toLowerCase();
            if (pCommand === "weather"){
                axios
                .get(
                    `https://api.openweathermap.org/data/2.5/weather?q=${args}&units=metric&appid=${weatherAPI}`
                )
                .then(response => {
                    let weatherEmbed = new MessageEmbed()
                    let current = Math.ceil(response.data.main.temp);
                    let min = response.data.main.temp_min;
                    let max = response.data.main.temp_max;
                    let humidity = response.data.main.humidity;
                    let weatherCon = response.data.weather[0].description;
                    let weatherIcon = response.data.weather[0].icon;
                    let country = response.data.sys.country;
                    let city = args;
                    weatherEmbed
                        .setColor('#0099ff')
                        .setTitle(`It is ${current}\u00B0 C in ${city}, ${country}`)
                        .setThumbnail(`http://openweathermap.org/img/w/${weatherIcon}.png`)
                        .addField('\u200B', '\u200B' )
                        .addField(`-- Today's high --`, `${max}`, true)
                        .addField(`-- Today's low --`, `${min}`, true)
                        .addField(`-- Humidity --`, `${humidity}`, true)
                        .addField('\u200B', '\u200B' )
                        .addField(` -- Overall condition -- `, weatherCon, true)
                        
                    message.channel.send({
                        embeds: [weatherEmbed]
                    });
                }).catch(err => {
                    message.reply("Invalid city name");
                    console.log(err);
                })
            }
            else if (pCommand === "tts"){
                {
                    message.channel.bulkDelete(1)
                    try{
                        clearTimeout(timeoutID);
                        timeoutID = undefined;
                        const queue = await client.player.createQueue(message.guild)
                        queue.destroy();

                        var voiceBot = message.content.slice(5);
                        if (voiceBot.length < 1){
                            console.log("tts attempted with empty imput");
                        }else{
                            const stream=discordTTS.getVoiceStream(voiceBot);
                            const audioResource=createAudioResource(stream, {inputType: StreamType.Arbitrary, inlineVolume:true});

                            if (firstCreate === true){
                                if(!voiceConnection || voiceConnection?.status===VoiceConnectionStatus.Disconnected || voiceConnection == null){
                                    voiceConnection = joinVoiceChannel({
                                        channelId: message.member.voice.channelId,
                                        guildId: message.guildId,
                                        adapterCreator: message.guild.voiceAdapterCreator,
                                    });
                                    firstCreate = false;
                                    voiceConnection=await entersState(voiceConnection, VoiceConnectionStatus.Connecting, 1_000);
                                }
                                }else{
                                    voiceConnection = joinVoiceChannel({
                                    channelId: message.member.voice.channelId,
                                    guildId: message.guildId,
                                    adapterCreator: message.guild.voiceAdapterCreator,
                                });
                                }
                                if(voiceConnection.status===VoiceConnectionStatus.Connected){
                                    voiceConnection.subscribe(audioPlayer);
                                    audioPlayer.play(audioResource);
                                } 
                                // start timer to disconnect from channel
                                timeoutID = setTimeout(() => {
                                    voiceConnection.destroy();
                                  }, 15 * 60 * 1000) // n * seconds * milliseconds.
                                
                        }
                    }catch (error){
                        console.log(error);
                    }
                }
            }
            else if (pCommand === "latency"){
                const latencyCheck = message.channel.send("Checking latency...") 
                message.channel.send(`Latency is ${(await latencyCheck).createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`)
            }
            else if (pCommand === "bulkdeletebig"){
                message.channel.bulkDelete(25)
                .then(messages => console.log(`Bulk deleted ${messages.size} messages`))
                .catch(console.error);
            }
            else if (pCommand === "bulkdeletesmall"){
                message.channel.bulkDelete(5)
                .then(messages => console.log(`Bulk deleted ${messages.size} messages`))
                .catch(console.error);
            }
            else if (pCommand === "join"){
                if (!message.member.voice.channel) return message.reply('Please join a voice channel first!');
                if ((message.member.voice.channel.members.filter((e) => client.user.id === e.user.id).size > 0)) return message.reply(`I'm already in your voice channel!`);

                voiceConnection = joinVoiceChannel({
                    channelId: message.member.voice.channelId,
                    guildId: message.guildId,
                    adapterCreator: message.guild.voiceAdapterCreator,
                })
                
                // start timer to disconnect from channel
                timeoutID = setTimeout(() => {
                    voiceConnection.destroy();
                  }, 15 * 60 * 1000) // n * seconds * milliseconds.

                
            }
        }
        else{
            return;
        }
    })
    client.on("speech", (message) => {
        console.log(message.content);
    })
    client.on("interactionCreate", (interaction) => {
        async function handleCommand() {
            if (!interaction.isCommand()) return

            try{
                // destroy tts voice connection
                // set disconnect timer to undefined
                voiceConnection.destroy();
                clearTimeout(timeoutID);
                timeoutID = undefined;
            }catch{}

            const slashcmd = client.slashcommands.get(interaction.commandName)
            if (!slashcmd) interaction.reply("Not a valid slash command")

            await interaction.deferReply()
            await slashcmd.run({ client, interaction })

        }
        try{
            handleCommand()
        }catch (error){
            console.log("handlecommand failure");
        }  
    })
    client.login(TOKEN)
}