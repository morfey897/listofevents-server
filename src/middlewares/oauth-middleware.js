const jwt = require("jsonwebtoken");
const { ROLES } = require("../config");
const basicAuth = Buffer.from(process.env.BASIC_AUTH, 'utf-8').toString('base64');

function authenticateBasicMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [type, token] = authHeader.split(' ');
  if ((type === "Basic" || type === "basic") && token === basicAuth) {
    req.user = { id: 0, role: ROLES.guest };
    next();
  } else {
    res.sendStatus(401);
  }
}

function authenticateBearerMiddleware(req, res, next) {

  const authHeader = req.headers.authorization || "";
  const [type, token] = authHeader.split(' ');
  if (type === "Bearer" || type === "bearer") {
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }

}

function authenticateMiddleware(req, res, next) {

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [type, token] = authHeader.split(' ');
    if (type === "Basic" || type === "basic") {
      if (token === basicAuth) {
        req.user = { id: 0, role: ROLES.guest };
        next();
      } else {
        res.sendStatus(401);
      }
    } else if (type === "Bearer" || type === "bearer") {
      jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err) {
          return res.sendStatus(403);
        }
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401);
    }
  } else {
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
  }
}

module.exports = {
  authenticateBasicMiddleware,
  authenticateBearerMiddleware,
  authenticateMiddleware,
};