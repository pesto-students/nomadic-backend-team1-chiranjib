const { createLogger, format, transports } = require('winston');

const ServiceLogger = createLogger({
  transports: [
    new transports.File({
      filename: 'systemLog.log',
      level: 'info',
      format: format.combine(format.timestamp(), format.json()),
    }),
    new transports.File({
      filename: 'systemLog.log',
      level: 'warn',
      format: format.combine(format.timestamp(), format.json()),
    }),
    new transports.File({
      filename: 'systemLog.log',
      level: 'error',
      format: format.combine(format.timestamp(), format.json()),
    }),
    new transports.Console({
      filename: 'systemLog.log',
      level: 'info',
      format: format.combine(format.timestamp(), format.json()),
    }),
    new transports.Console({
      filename: 'systemLog.log',
      level: 'warn',
      format: format.combine(format.timestamp(), format.json()),
    }),
    new transports.Console({
      filename: 'systemLog.log',
      level: 'error',
      format: format.combine(format.timestamp(), format.json()),
    }),
  ]
})

module.exports = {ServiceLogger}