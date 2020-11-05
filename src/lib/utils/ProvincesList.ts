// Regions Map
const regions = [
  {
    nome: 'Abruzzo',
    capoluoghi: [
      'Chieti',
      "L'Aquila",
      'Pescara',
      'Teramo'
    ]
  },
  {
    nome: 'Basilicata',
    capoluoghi: [
      'Matera',
      'Potenza'
    ]
  },
  {
    nome: 'Calabria',
    capoluoghi: [
      'Catanzaro',
      'Cosenza',
      'Crotone',
      'Reggio Calabria',
      'Vibo Valentia'
    ]
  },
  {
    nome: 'Campania',
    capoluoghi: [
      'Avellino',
      'Benevento',
      'Caserta',
      'Napoli',
      'Salerno'
    ]
  },
  {
    nome: 'Emilia-Romagna',
    capoluoghi: [
      'Bologna',
      'Ferrara',
      'Forlì-Cesena',
      'Modena',
      'Parma',
      'Piacenza',
      'Ravenna',
      'Reggio Emilia',
      'Rimini'
    ]
  },
  {
    nome: 'Friuli-Venezia Giulia',
    capoluoghi: [
      'Gorizia',
      'Pordenone',
      'Trieste',
      'Udine'
    ]
  },
  {
    nome: 'Lazio',
    capoluoghi: [
      'Frosinone',
      'Latina',
      'Rieti',
      'Roma',
      'Viterbo'
    ]
  },
  {
    nome: 'Liguria',
    capoluoghi: [
      'Genova',
      'Imperia',
      'La Spezia',
      'Savona'
    ]
  },
  {
    nome: 'Lombardia',
    capoluoghi: [
      'Bergamo',
      'Brescia',
      'Como',
      'Cremona',
      'Lecco',
      'Lodi',
      'Mantova',
      'Milano',
      'Monza e Brianza',
      'Pavia',
      'Sondrio',
      'Varese'
    ]
  },
  {
    nome: 'Marche',
    capoluoghi: [
      'Ancona',
      'Ascoli Piceno',
      'Fermo',
      'Macerata',
      'Pesaro e Urbino'
    ]
  },
  {
    nome: 'Molise',
    capoluoghi: [
      'Campobasso',
      'Isernia'
    ]
  },
  {
    nome: 'Piemonte',
    capoluoghi: [
      'Alessandria',
      'Asti',
      'Biella',
      'Cuneo',
      'Novara',
      'Torino',
      'Verbano Cusio Ossola',
      'Vercelli'
    ]
  },
  {
    nome: 'Puglia',
    capoluoghi: [
      'Bari',
      'Barletta-Andria-Trani',
      'Brindisi',
      'Lecce',
      'Foggia',
      'Taranto'
    ]
  },
  {
    nome: 'Sardegna',
    capoluoghi: [
      'Cagliari',
      'Carbonia-Iglesias',
      'Medio Campidano',
      'Nuoro',
      'Ogliastra',
      'Olbia-Tempio',
      'Oristano',
      'Sassari'
    ]
  },
  {
    nome: 'Sicilia',
    capoluoghi: [
      'Agrigento',
      'Caltanissetta',
      'Catania',
      'Enna',
      'Messina',
      'Palermo',
      'Ragusa',
      'Siracusa',
      'Trapani'
    ]
  },
  {
    nome: 'Toscana',
    capoluoghi: [
      'Arezzo',
      'Firenze',
      'Grosseto',
      'Livorno',
      'Lucca',
      'Massa-Carrara',
      'Pisa',
      'Pistoia',
      'Prato',
      'Siena'
    ]
  },
  {
    nome: 'Trentino-Alto Adige',
    capoluoghi: [
      'Bolzano',
      'Trento'
    ]
  },
  {
    nome: 'Umbria',
    capoluoghi: [
      'Perugia',
      'Terni'
    ]
  },
  {
    nome: "Valle d'Aosta",
    capoluoghi: [
      'Aosta'
    ]
  },
  {
    nome: 'Veneto',
    capoluoghi: [
      'Belluno',
      'Padova',
      'Rovigo',
      'Treviso',
      'Venezia',
      'Verona',
      'Vicenza'
    ]
  }
]

export const provinces = []

// Map every province to a region
export const provincesToRegion = regions.reduce((obj, region) => {
  for (const province of region.capoluoghi) {
    provinces.push(province)
    obj[province] = region.nome
  }
  return obj
}, {})
