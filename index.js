const Discord = require("discord.js")
const { MessageEmbed } = require("discord.js")
const dotenv = require("dotenv")
const axios = require('axios')
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const fs = require("fs")
const { Player } = require("discord-player")

dotenv.config()
const TOKEN = process.env.TOKEN
const weatherAPI = process.env.weatherAPI
const command = process.env.command

const LOAD_SLASH = process.argv[2] == "load"

const CLIENT_ID = "980982534965981244"
const GUILD_ID = "459787057749950485"

comingFromLofi = false

var express = require('express');
var app     = express();

app.set('port', (process.env.PORT || 5000));

// testing
//For avoiding Heroku $PORT error
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

const client = new Discord.Client({
    intents: [
        "GUILDS",
        "GUILD_VOICE_STATES",
        "GUILD_MESSAGES"
    ]
})

client.slashcommands = new Discord.Collection()
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25
    }
})

let commands = []

const slashFiles = fs.readdirSync("./slash").filter(file => file.endsWith(".js"))
for (const file of slashFiles){
    const slashcmd = require(`./slash/${file}`)
    client.slashcommands.set(slashcmd.data.name, slashcmd)
    if (LOAD_SLASH) commands.push(slashcmd.data.toJSON())
}

if (LOAD_SLASH) {
    const rest = new REST({ version: "9" }).setToken(TOKEN)
    console.log("Deploying slash commands")
    rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {body: commands})
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
}
else {
    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}`)
        client.user.setActivity("Among Us", { type: "PLAYING" });
    })
    client.on("messageCreate", (message) => {
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
        }
        else{
            return;
        }
    })
    client.on("interactionCreate", (interaction) => {
        async function handleCommand() {
            if (!interaction.isCommand()) return

            const slashcmd = client.slashcommands.get(interaction.commandName)
            if (!slashcmd) interaction.reply("Not a valid slash command")

            await interaction.deferReply()
            await slashcmd.run({ client, interaction })
        }
        handleCommand()
    })
    client.login(TOKEN)
    
}