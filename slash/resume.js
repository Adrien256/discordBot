const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
	data: new SlashCommandBuilder().setName("resume").setDescription("Resume the music"),
	run: async ({ client, interaction }) => {
		const queue = client.player.getQueue(interaction.guildId)

		if (!queue) return await interaction.editReply("There are no songs in the queue.")

        if (queue.setPaused(false)){
            await interaction.editReply("Resuming music.")
        }
        else{
            queue.setPaused(false)
            await interaction.editReply("It's not paused?")
        }
	},
}