const jwt = require("jsonwebtoken");
const Users = require("../models/user-model");
const { ROLES } = require("../config");

function generate(user) {
  if (!user) return {token: {accessToken: "", expiresIn: 0, user: {id: 0, name: "", surname: "", role: 0, phone: "", email: ""}}};
  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_LIFETIME });
  const decoded = jwt.decode(accessToken);
  return {token: { accessToken, expiresIn: decoded.exp}, user: {id: user._id, name: user.name, surname: user.surname, role: user.role, phone: user.phone, email: user.email}};
}

function signUpRouter(req, res) {
  const { name, surname, email, phone, password } = req.body;
  if ((!phone && !email) || !password) {
    res.json({ success: false, error: 'Username or password incorrect' });
  } else {
    Users.findOne({ $or: [{ phone }, { email }] }).exec()
      .then(user => {
        if (user) {
          res.json({ success: false, error: 'Username is exist' });
        } else {
          return (new Users({ name, surname, email, phone, password, role: ROLES.user })).save();
        }
      })
      .then(user => {
        res.json({ success: true, ...generate(user)});
      })
      .catch(() => {
        res.json({ success: false, error: 'Something went wrong' });
      })
  }
}

function signInRouter(req, res) {
  const { username, password } = req.body;

  // Filter user from the users array by username and password
  Users.findOne({ password: password, $or: [{ phone: username }, { email: username }] }).exec()
    .then(user => {
      if (!user) throw new Error("Not exist");
      res.json({ success: true, ...generate(user) });
    })
    .catch(() => {
      res.json({ success: false, error: 'Username or password incorrect' });
    });
}

function signOutRouter(req, res) {
  res.json({ success: true, ...generate() });
}

module.exports = {
  signInRouter,
  signOutRouter,
  signUpRouter,
};