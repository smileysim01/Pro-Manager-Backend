const {check, validationResult} = require('express-validator');

const validateRegistration = async (req,res,next) => {
    try {
        await check('name')
        .trim().notEmpty().withMessage('Name is required.')
        .isLength({min: 3, max: 50}).withMessage('Name must be between 3 and 50 characters long.')
        .run(req);
    
        await check('email')
        .isEmail().withMessage('Please provide a valid email.')
        .run(req);
    
        await check('password')
        .isLength({min: 8}).withMessage('Password must be at least 8 characters long.')
        .run(req);

        const errors = validationResult(req);
        if(!errors.isEmpty()){
            const errorMessages = errors.array().reduce((acc, error) => {
                acc[error.path] = acc[error.path] ? `${acc[error.path]} ${error.msg}` : error.msg; // Add error message to the respective field
                return acc;
            }, {});
            return res.status(400).json({message: errorMessages});
        }
        next();
    } catch (err) {
        return res.status(500).json({message: "Internal server error encountered during validation. Please try again."});
    }
}

module.exports = validateRegistration;