const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageEmbed } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Displays the current song queue")
    .addNumberOption((option) => option.setName("page").setDescription("Page number of the queue").setMinValue(1)),

    run: async({ client, interaction }) => {
        const queue = client.player.getQueue(interaction.guildId)
        if (!queue || !queue.playing){
            return await interaction.editReply("There are no songs in the queue.")
        }

        const totalPages = Math.ceil(queue.tracks.length / 50) || 1
        const page = (interaction.options.getNumber("page") || 1) - 1

        if (page > totalPages){
            return await interaction.editReply(`Invalid page. There are only a total of ${totalPages} pages.`)
        }
        const queueString = queue.tracks.slice(page * 50, page * 50 + 50).map((song, i) => {
            return `**${page * 50 + i + 1}. \`[${song.duration}]\` ${song.title} -- <@${song.requestedBy.id}>\n`
        }).join('')

        const currentSong = queue.current

        if (comingFromLofi === true){
            await interaction.editReply({
				embeds: [new MessageEmbed()
				.setThumbnail(currentSong.thumbnail)
				.setDescription(`Lofi Radio`)
			]
			})
        }
        else{
            await interaction.editReply({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`**Currently Playing**\n` + 
                        (currentSong ? `\`[${currentSong.duration}]\` ${currentSong.title} -- <@${currentSong.requestedBy.id}>` : "None") +
                        `\n\n**Queue**\n${queueString}`
                        )
                        .setFooter({
                            text: `Page ${page + 1} of ${totalPages}`
                        })
                        .setThumbnail(currentSong.setThumbnail)
                ]
            })
        }
    }
}