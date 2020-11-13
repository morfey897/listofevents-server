const basicAuth = Buffer.from(process.env.BASIC_AUTH, 'utf-8').toString('base64');

function loggingMiddleware(req, res, next) {
  
  const authHeader = req.headers.authorization;
  if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === "Basic" || type === "basic") {
        if (token === basicAuth) {
          next();
        } else {
          res.sendStatus(401);
        }
      } else if (type === "Bearer" || type === "bearer") {
        next();
        return;
      } else {
        res.sendStatus(401);
      }
      // jwt.verify(token, accessTokenSecret, (err, user) => {
      //     if (err) {
      //         return res.sendStatus(403);
      //     }
      //     req.user = user;
      //     next();
      // });
  } else {
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
  }
}

module.exports = {
  loggingMiddleware,
};