const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageEmbed } = require("discord.js")
const { QueryType } = require("discord-player")

module.exports = {
	data: new SlashCommandBuilder().setName("lofi").setDescription("Plays lofi radio - ends current song queue"),
    run: async ({ client, interaction }) => {
        if (!interaction.member.voice.channel)
            return interaction.editReply("Go in a voice channel to use this command.")
        const queue2 = await client.player.createQueue(interaction.guild)
        if (!queue2.connection) await queue2.connect(interaction.member.voice.channel)

        let embed = new MessageEmbed()

        let url = "https://www.youtube.com/watch?v=5qap5aO4i9A"
        const result = await client.player.search(url, {
            requestedBy: interaction.user,
            searchEngine: QueryType.YOUTUBE_VIDEO
        })
        if (result.tracks.length === 0){
            return interaction.editReply("Invalid URL")
        }
        const song = result.tracks[0]

        await queue2.addTrack(song)
        embed   
            .setDescription(`**[${song.title}](${song.url})** has been added to the Queue`)
            .setThumbnail(song.thumbnail)
            .setFooter({ text: `Duration: ${song.duration}`})
            

        let trackNum = queue2.tracks.length;
        queue2.skipTo(trackNum - 1)
        comingFromLofi = true;

        if (!queue2.playing) await queue2.play()
        await interaction.editReply("Playing Lofi radio")
	}
}