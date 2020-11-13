const basicAuth = Buffer.from(process.env.BASIC_AUTH, 'utf-8').toString('base64');

function loggingMiddleware(req, res, next) {
  
  const authHeader = req.headers.authorization;
  if (authHeader) {
      const [type, token] = authHeader.split(' ');
      console.log("TOKEN", authHeader);
      if (type === "Basic" || type === "basic") {
        if (token === basicAuth) {
          next();
          return;
        }
      } else if (type === "Bearer" || type === "bearer") {
        next();
        return;
      }
      // jwt.verify(token, accessTokenSecret, (err, user) => {
      //     if (err) {
      //         return res.sendStatus(403);
      //     }
      //     req.user = user;
      //     next();
      // });
  }
  res.sendStatus(401);
}

module.exports = {
  loggingMiddleware,
};