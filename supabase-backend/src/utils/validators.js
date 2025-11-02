const Joi = require('joi');

// User validation schemas
const userRegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  phone_number: Joi.string().pattern(/^\+91\d{10}$/).required(),
  full_name: Joi.string().min(2).max(255).required(),
  in_game_name: Joi.string().min(2).max(100).required(),
  primary_game: Joi.string().valid('BGMI', 'Valorant', 'Free Fire', 'COD Mobile').required(),
  password: Joi.string().min(8).required(),
  profile_picture: Joi.string().uri().optional(),
  referral_code: Joi.string().pattern(/^[A-Z0-9]{8,20}$/).optional(),
  init_token: Joi.string().length(64).required()
});

const userLoginSchema = Joi.object({
  email_or_phone: Joi.string().required(),
  password: Joi.string().required(),
  init_token: Joi.string().length(64).required()
});

const tournamentFilterSchema = Joi.object({
  game: Joi.string().valid('BGMI', 'Valorant', 'Free Fire', 'COD Mobile').optional(),
  entry_fee: Joi.string().valid('free', 'paid').optional(),
  type: Joi.string().valid('Solo', 'Duos', 'Squads', '5v5').optional(),
  status: Joi.string().valid('upcoming', 'registrationOpen', 'live', 'completed', 'cancelled').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort_by: Joi.string().valid('prize', 'entryFee', 'startDate', 'popularity').optional()
});

// Generic pagination
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details.map(d => d.message).join(', ')
        }
      });
    }
    
    req.validated = value;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details.map(d => d.message).join(', ')
        }
      });
    }
    
    req.query = { ...req.query, ...value };
    next();
  };
}

module.exports = {
  userRegisterSchema,
  userLoginSchema,
  tournamentFilterSchema,
  paginationSchema,
  validate,
  validateQuery
};

