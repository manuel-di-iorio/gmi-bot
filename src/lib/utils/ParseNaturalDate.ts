import * as chrono from 'chrono-node'

export const parseNaturalDate = (text: string): Date | null => {
  const italianTime = text
    .trim()
    .toLowerCase()
    .replace(/\s+e\s+/g, ' and ')
    .replace(/quarto d'ora/g, '15 minuti')
    .replace(/quartod'ora/g, '15 minuti')
    .replace(/tra/g, 'in')
    .replace(/il/g, 'on')
    .replace(/domani/g, 'tomorrow')
    .replace(/stasera/g, 'tonight')
    .replace(/sera/g, 'tonight')
    .replace(/adesso/g, 'now')
    .replace(/ieri/g, 'yesterday')
    .replace(/oggi/g, 'today')
    .replace(/pomeriggio/g, 'afternoon')
    .replace(/mattina/g, 'morning')
    .replace(/mezzanotte/g, 'midnight')
    .replace(/prossimo/g, 'next')
    .replace(/prossima/g, 'next')
    .replace(/secondo/g, 'second')
    .replace(/secondi/g, 'seconds')
    .replace(/minuto/g, 'minute')
    .replace(/minuti/g, 'minutes')
    .replace(/ora/g, 'hour')
    .replace(/ore/g, 'hours')
    .replace(/giorno/g, 'day')
    .replace(/giorni/g, 'days')
    .replace(/settimana/g, 'week')
    .replace(/settimane/g, 'weeks')
    .replace(/mese/g, 'month')
    .replace(/mesi/g, 'months')
    .replace(/anno/g, 'year')
    .replace(/anni/g, 'years')
    .replace(/alle/g, 'at')
    .replace(/per/g, 'for')
    .replace(/questa/g, 'this')
    .replace(/questo/g, 'this')
    .replace(/fine settimana/g, 'weekend')
    .replace(/mezzo/g, 'half')
    .replace(/mezza/g, 'half')
    .replace(/mezz'/g, 'half ')
    .replace(/quarto/g, 'quarter')
    .replace(/uno/g, '1')
    .replace(/una/g, '1')
    .replace(/un'/g, '1 ')
    .replace(/un/g, '1')
    .replace(/due/g, '2')
    .replace(/tre/g, '3')
    .replace(/quattro/g, '4')
    .replace(/cinque/g, '5')
    .replace(/sei/g, '6')
    .replace(/sette/g, '7')
    .replace(/otto/g, '8')
    .replace(/nove/g, '9')
    .replace(/dieci/g, '10')
    .replace(/undici/g, '11')
    .replace(/dodici/g, '12')
    .replace(/tredici/g, '13')
    .replace(/quattordici/g, '14')
    .replace(/quindici/g, '15')
    .replace(/sedici/g, '16')
    .replace(/diciassette/g, '17')
    .replace(/diciotto/g, '18')
    .replace(/diciannove/g, '19')
    .replace(/venti/g, '20')
    .replace(/ventuno/g, '21')
    .replace(/ventidue/g, '22')
    .replace(/ventitre/g, '23')
    .replace(/ventiquattro/g, '24')
    .replace(/venticinque/g, '25')
    .replace(/ventisei/g, '26')
    .replace(/ventisette/g, '27')
    .replace(/ventotto/g, '28')
    .replace(/ventinove/g, '29')
    .replace(/trenta/g, '30')
    .replace(/trentacinque/g, '35')
    .replace(/quaranta/g, '40')
    .replace(/quarantacinque/g, '45')
    .replace(/cinquanta/g, '50')
    .replace(/cinquantacinque/g, '55')
    .replace(/sessanta/g, '60')
    .replace(/gennaio/g, '01')
    .replace(/febbraio/g, '02')
    .replace(/marzo/g, '03')
    .replace(/aprile/g, '04')
    .replace(/maggio/g, '05')
    .replace(/giugno/g, '06')
    .replace(/luglio/g, '07')
    .replace(/agosto/g, '08')
    .replace(/settembre/g, '09')
    .replace(/ottobre/g, '10')
    .replace(/novembre/g, '11')
    .replace(/dicembre/g, '12')
    .replace(/di/g, 'of')
    .replace(/d'/g, 'of ')

  return chrono.parseDate(italianTime)
}
