const Joi = require("@hapi/joi");

const allProperties = {
    body: Joi.object().keys({
        skip: Joi.number().required(),
        limit: Joi.number().required(),
        destination: Joi.string().allow(null, ""),
        subDestination: Joi.string().allow(null, ""),
        sortBy: Joi.string().allow(null, ""),
        sortOrder: Joi.string().valid('asc','desc').allow(null, ""),
    }),
  };

module.exports = {
    allProperties
  };
  