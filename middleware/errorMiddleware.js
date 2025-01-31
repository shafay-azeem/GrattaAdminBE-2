const notFound = (req, res, next) => {
  // console.log('jjee')
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};


const errorHandler = (error, req, res, next) => {
  // console.log(error)
  const status = error.statusCode || 500
  const message = error.message
  return res.status(status).json({ message: message })
};
module.exports = { notFound, errorHandler };
