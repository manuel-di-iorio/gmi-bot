import {
  ApplicationCommand, CommandInteraction, GuildMemberRoleManager, Message, MessageActionRow,
  MessageButton, MessageComponentInteraction, Snowflake, TextChannel
} from 'discord.js'
import { GMI_ADMIN_ROLES } from '../../lib/Config'
import { InteractionConfig } from '../types'

export const delInteraction: InteractionConfig = {
  interaction: {
    name: 'del',
    description: 'Cancella messaggi dal canale [solo mods]',
    defaultPermission: false,
    options: [{
      name: 'input',
      type: 'STRING',
      description: 'Numero di messaggi da cancellare oppure un testo contenuto in un messaggio fino a cui cancellare',
      required: true
    }]
  },

  onSetup: async (command: ApplicationCommand) => {
    await command.permissions.set({
      permissions: GMI_ADMIN_ROLES.map((adminRoleId: Snowflake) => ({
        id: adminRoleId,
        type: 'ROLE',
        permission: true
      }))
    })
  },

  handler: async (message: CommandInteraction) => {
    // Get a cloned copy of the latest channel messages
    const clonedMessages = Array.from((await message.channel.messages.fetch()).values())
    await message.deferReply({ ephemeral: true })

    // Get the input
    const input = message.options.data[0].value as string

    // Validate and get the messages to delete
    let count = parseInt(input)
    if (!isNaN(count)) {
      // Filter by count
      if (count < 1) {
        return message.editReply('Specifica un numero maggiore di 0')
      } else if (count > 50) {
        return message.editReply('Puoi cancellare max 50 messaggi')
      }
    } else {
      // Filter by text
      const messages: Message[] = []

      // Find the string into the channel messages
      clonedMessages.some((channelMsg: Message) => {
        if (channelMsg.id === message.id) return false
        if (channelMsg.deleted || !channelMsg.deletable) return false
        messages.push(channelMsg)
        return channelMsg.content.toLowerCase().includes(input)
      })

      // Delete the messages
      count = messages.length
      if (!count) {
        return message.editReply('Non ci sono messaggi da cancellare')
      }
    }

    // Send the confirm message
    const confirmBtn = new MessageButton()
      .setCustomId('confirm')
      .setLabel('Conferma')
      .setEmoji('✅')
      // eslint-disable-next-line no-undef
      .setStyle('PRIMARY')

    const cancelBtn = new MessageButton()
      .setCustomId('cancel')
      .setLabel('Annulla')
      .setEmoji('❌')
      // eslint-disable-next-line no-undef
      .setStyle('SECONDARY')

    const actionRow = new MessageActionRow().addComponents(confirmBtn, cancelBtn)

    const replyMsg = await message.editReply({
      content: `Sei sicuro di voler cancellare ${count} messaggi${count === 1 ? 'o' : ''}?`,
      components: [actionRow]
    }) as Message

    // Button filter: by customID and admin role
    const filter = (i: MessageComponentInteraction) => !!(i.member.roles as GuildMemberRoleManager)
      .cache
      .find(role => !!GMI_ADMIN_ROLES.find(adminRole => adminRole === role.id))

    const pressedBtn = await replyMsg.awaitMessageComponent({ filter, time: 15000 })

    if (pressedBtn.customId === 'confirm') {
      // Delete the messages
      await (message.channel as TextChannel).bulkDelete(clonedMessages.slice(0, count))

      await pressedBtn.reply({ ephemeral: true, content: 'Messaggi cancellati' })
    } else {
      await pressedBtn.reply({ ephemeral: true, content: 'Azione annullata' })
    }
  }
}
