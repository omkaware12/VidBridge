 // const ExpressError = require("./expressError")
const Joi = require("joi");

const signupValidation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("creator", "editor").required(),
    avatar: Joi.string().uri().optional().allow("", null),
   // isActive: Joi.boolean().optional()
  });
  const { error } = schema.validate(req.body);
  if (error) {
  return res.status(400).json({
    message:"bad reequest ", error
  })
  }
  next();
};


const loginValidation = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required()
  });
  const { error } = schema.validate(req.body);
 if (error) {
  return res.status(400).json({
    message:"bad reequest ", error
  })
  }
  next();
};


module.exports = {
    signupValidation,
    loginValidation
}




