import axios from 'axios'
import { CommandInteraction, MessageEmbed } from 'discord.js'
import moment from 'moment'
import { BOT_COLOR, OPEN_WEATHER_MAP_APIKEY, OPEN_WEATHER_MAP_HOST } from '../../lib/Config'
import { InteractionConfig } from '../types'

const extractWeatherData = (data, response = undefined) => {
  const name = data.name ? data.name : response.city.name
  const { weather: weatherData, main, pop } = data
  const { description, icon: iconCode } = weatherData[0]

  return {
    city: name[0].toUpperCase() + name.slice(1),
    weather: description[0].toUpperCase() + description.slice(1),
    icon: `http://openweathermap.org/img/wn/${iconCode}@2x.png`,
    temp: Math.round(main.temp),
    humidity: main.humidity,
    rainProb: Math.round(pop * 100)
  }
}

export const weatherInteraction: InteractionConfig = {
  interaction: {
    name: 'weather',
    description: 'Mostra il meteo della tua città',
    options: [{
      name: 'city',
      type: 'STRING',
      description: 'Città',
      required: true
    }]
  },

  handler: async (message: CommandInteraction) => {
    const input = encodeURIComponent(message.options.data[0].value as string) + ',IT'
    await message.defer()

    // Get the weather data
    try {
      const [{ data: weather }, { data: forecast }] = await Promise.all([
        axios(`${OPEN_WEATHER_MAP_HOST}/weather?appid=${OPEN_WEATHER_MAP_APIKEY}&lang=it&units=metric&q=${input}`),
        axios(`${OPEN_WEATHER_MAP_HOST}/forecast?appid=${OPEN_WEATHER_MAP_APIKEY}&lang=it&units=metric&cnt=18&q=${input}`)
      ])

      // Extract the weather data
      const weatherCurrent = extractWeatherData(weather)

      const { list } = forecast
      const now = new Date()
      const timeToday = moment(now).date()
      const timeTomorrowDate = moment(now).add(1, 'd').date()
      const timeDayAfterTomorrowDate = moment(now).add(2, 'd').date()

      let weatherToday
      let weatherTomorrow
      let weatherDayAfterTomorrow

      for (const step of list) {
        const dt = step.dt * 1000
        const stepDate = moment(dt).date()

        if (!weatherToday && stepDate === timeToday) {
          weatherToday = extractWeatherData(step, forecast)
        } else if (!weatherTomorrow && stepDate === timeTomorrowDate) {
          weatherTomorrow = extractWeatherData(step, forecast)
        } else if (!weatherDayAfterTomorrow && stepDate === timeDayAfterTomorrowDate) {
          weatherDayAfterTomorrow = extractWeatherData(step, forecast)
          break
        }
      }

      // Send the embed
      const embed = new MessageEmbed()
      embed.setColor(BOT_COLOR)
      embed.setTitle('Meteo di ' + weatherCurrent.city + ' | GameMaker Italia')
      embed.setThumbnail(weatherCurrent.icon)
      embed.setFooter('Dati di OpenWeatherMap', 'https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/icons/logo_32x32.png')

      embed.addField('Adesso', `${weatherCurrent.weather}, ${weatherCurrent.temp}°, ${weatherCurrent.humidity}% umidità, ${weatherToday.rainProb}% pioggia`)

      embed.addField('Domani', `${weatherTomorrow.weather}, ${weatherTomorrow.temp}°, ${weatherTomorrow.humidity}% umidità, ${weatherTomorrow.rainProb}% pioggia`)

      embed.addField('Dopo domani', `${weatherDayAfterTomorrow.weather}, ${weatherDayAfterTomorrow.temp}°, ${weatherDayAfterTomorrow.humidity}% umidità, ${weatherDayAfterTomorrow.rainProb}% pioggia`)

      await message.editReply({ embeds: [embed] })
    } catch (err) {
      await message.editReply('Non ho trovato questa città oppure è avvenuto un errore')
    }
  }
}
