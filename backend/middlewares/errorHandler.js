const errorHandler = async (err,req,res,next) => {
    if(err.status === 404){
        return res.status(404).json({message: "404 Page not found. Please check the URL and try again."});
    }
    res.status(500).json({message: "Something went wrong! Please try after some time.."});
}

module.exports = errorHandler;