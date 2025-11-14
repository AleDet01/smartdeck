const { body, param, query, validationResult } = require('express-validator');

// Middleware per gestire errori di validazione
const handleValidationErrors = (req, res, next) => {
  console.log(`🔍 [VALIDATION] Checking ${req.method} ${req.path}, Body:`, JSON.stringify(req.body));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    console.warn(`⚠️ [VALIDATION] Error: ${firstError.msg} (field: ${firstError.path}) from IP: ${req.ip}`);
    return res.status(400).json({ 
      error: firstError.msg,
      field: firstError.path 
    });
  }
  
  console.log(`✓ [VALIDATION] Passed for ${req.method} ${req.path}`);
  next();
};

// Validazioni per autenticazione
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username deve essere tra 3 e 30 caratteri')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username può contenere solo lettere, numeri e underscore'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password richiesta'),
  handleValidationErrors
];

const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username deve essere tra 3 e 30 caratteri')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username può contenere solo lettere, numeri e underscore')
    .custom((value) => {
      const reserved = ['admin', 'root', 'system', 'api', 'test'];
      if (reserved.includes(value.toLowerCase())) {
        throw new Error('Username non disponibile');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password deve essere almeno 8 caratteri')
    .matches(/[A-Z]/)
    .withMessage('Password deve contenere almeno una lettera maiuscola')
    .matches(/[a-z]/)
    .withMessage('Password deve contenere almeno una lettera minuscola')
    .matches(/[0-9]/)
    .withMessage('Password deve contenere almeno un numero')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password deve contenere almeno un carattere speciale'),
  handleValidationErrors
];

// Validazioni per flashcard
const validateFlashcard = [
  body('question')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Domanda richiesta (max 500 caratteri)'),
  body('answer')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Risposta richiesta (max 1000 caratteri)'),
  body('thematicArea')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Area tematica richiesta (max 100 caratteri)'),
  handleValidationErrors
];

// Validazioni per AI
const validateAIPrompt = [
  body('prompt')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Prompt deve essere tra 5 e 1000 caratteri')
    .notEmpty()
    .withMessage('Prompt richiesto'),
  handleValidationErrors
];

// Validazioni per area tematica
const validateThematicArea = [
  param('area')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Area tematica non valida')
    .matches(/^[a-zA-Z0-9\sàèéìòù\-_:,.']+$/)
    .withMessage('Area tematica contiene caratteri non validi'),
  handleValidationErrors
];

// Validazioni per test session
const validateTestSession = [
  body('thematicArea')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Area tematica richiesta'),
  body('flashcardIds')
    .isArray({ min: 1 })
    .withMessage('Almeno una flashcard richiesta'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateRegister,
  validateFlashcard,
  validateAIPrompt,
  validateThematicArea,
  validateTestSession,
  handleValidationErrors
};
