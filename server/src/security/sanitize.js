const sanitize = require("sanitize-html");
const mongoSanitize = require("express-mongo-sanitize");

const sanitizeInput = (req, res, next) => {
  for (let key in req.body) {
    if (typeof req.body[key] === "string") {
      req.body[key] = sanitize(req.body[key], {
        allowedTags: [],
        allowedAttributes: {},
      });
    }
  }
  next();
};

// Sanitize MongoDB operator in request
const sanitizeMongo = mongoSanitize({
  replaceWith: "_", // Replace prohibited characters with `_`
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized MongoDB operator in request: ${key}`);
  },
});

module.exports = { sanitizeInput, sanitizeMongo };
