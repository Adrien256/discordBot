const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageEmbed } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder().setName("info").setDescription("Get info on current song"),
	run: async ({ client, interaction }) => {
		const queue = client.player.getQueue(interaction.guildId)

		if (!queue) return await interaction.editReply("No songs currently in the queue.")

		let bar = queue.createProgressBar({
			queue: false,
			length: 19,
		})

        const song = queue.current

		if (comingFromLofi === true){
			await interaction.editReply({
				embeds: [new MessageEmbed()
				.setThumbnail(song.thumbnail)
				.setDescription(`Lofi Radio`)
			]
			})
		}
		else{
			await interaction.editReply({
				embeds: [new MessageEmbed()
				.setThumbnail(song.thumbnail)
				.setDescription(`Currently Playing [${song.title}](${song.url})\n\n` + bar)
			]
			})
		}
	}
}