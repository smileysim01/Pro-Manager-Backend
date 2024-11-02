const {check, validationResult} = require('express-validator');

const validateUpdate = async (req,res,next) => {
    try {
        if(req.body.name){
            await check('name')
            .trim().notEmpty().withMessage('Name is required.')
            .isLength({min: 3, max: 50}).withMessage('Name must be between 3 and 50 characters long.')
            .run(req);
        }

        if(req.body.email){
            await check('email')
            .isEmail().withMessage('Please provide a valid email.')
            .run(req);
        }

        if(req.body.newPassword){
            await check('oldPassword')
            .notEmpty().withMessage('Old password is required to change password.')
            .run(req);

            await check('newPassword')
            .isLength({min: 8}).withMessage('New password must be at least 8 characters long.')
            .run(req);
        }
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

module.exports = validateUpdate;