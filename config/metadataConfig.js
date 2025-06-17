module.exports = {
    propertyTypes: ['apartment', 'flat', 'villa', 'house', 'plot', 'land', 'studio', 'penthouse', 'bungalow'],
    budgetUnits: ['lakh', 'lac', 'cr', 'crore', 'million'],
    timelineIndicators: ['immediately', 'urgent', 'asap', 'soon', 'month', 'year'],
    locationSynonyms: {
      'pune': ['pune', 'punecity', 'pcmc'],
      'mumbai': ['mumbai', 'bombay'],
      'bangalore': ['bangalore', 'bengaluru']
    },
    classificationCriteria: {
      hot: ['specific location', 'exact budget', 'urgent timeline', 'clear purpose'],
      cold: ['browsing', 'just looking', 'no urgency', 'uncertain'],
      invalid: ['gibberish', 'test', 'nonsense', 'spam']
    }
  };