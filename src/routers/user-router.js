const jwt = require("jsonwebtoken");
const Users = require("../models/user-model");
const AuthCodes = require("../models/authcode-model");
const { ROLES } = require("../config");
const ms = require("ms");

const EMAIL_REG_EXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PHONE_REG_EXP = /^\+?\d{10,}$/;

const TYPE_EMAIL = "email";
const TYPE_PHONE = "phone";
const TYPE_UNDEFINED = "_undefined";

const ERROR_WRONG = 101;
const ERROR_INCORRECT_CODE = 102;
const ERROR_EXIST = 103;
const ERROR_NOT_EXIST = 104;
const ERROR_INCORRECT_USERNAME = 105;

function getUsernameType(username) {
  if (EMAIL_REG_EXP.test(username)) {
    return TYPE_EMAIL;
  } else if (PHONE_REG_EXP.test(username)) {
    return TYPE_PHONE;
  }
  return TYPE_UNDEFINED;
}

function prepareUsername(username, type) {
  type = type || getUsernameType(username);
  if (type === TYPE_EMAIL) return username.toLowerCase().trim();
  if (type === TYPE_PHONE) return "+" + username.replace(/\D/g, "");
  return "";
}

function generate(user) {
  if (!user) return { token: { accessToken: "", expiresIn: 0 }, user: { id: 0, name: "", surname: "", role: 0, phone: "", email: "" } };
  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_LIFETIME });
  const decoded = jwt.decode(accessToken);
  return { token: { accessToken, expiresIn: decoded.exp }, user: { id: user._id, name: user.name, surname: user.surname, role: user.role, phone: user.phone, email: user.email } };
}

function outhCodeRouter(req, res) {
  const { username, isNew = false } = req.body;
  const type = getUsernameType(username);
  if (type === TYPE_UNDEFINED) {
    res.json({ success: false, error: 'Username is incorrect', errorCode: ERROR_INCORRECT_USERNAME });
  } else {
    const lifetime = ms(process.env.AUTH_CODE_LIFETIME);
    const codeLen = parseInt(process.env.AUTH_CODE_LEN);
    const usernameNew = prepareUsername(username, type);
    Users.findOne({ $or: [{ phone: usernameNew }, { email: usernameNew }] }).exec()
      .then(user => {
        if (user && isNew) {
          res.json({ success: false, error: 'Username is exist', errorCode: ERROR_EXIST });
        } else if (!user && !isNew) {
          res.json({ success: false, error: "Username isn't exist", errorCode: ERROR_NOT_EXIST });
        } else {

          const code = (new Array(codeLen).fill("0").join("") + parseInt(Math.random() * Math.pow(10, codeLen)).toString()).slice(-1 * codeLen);
          const estimate = Date.now() + lifetime;
          return (new AuthCodes({ username: usernameNew, type, code, estimate })).save();
        }
      })
      .then((authcode) => {
        res.json({ success: true, data: { type, lifetime: parseInt(lifetime / 1000), username: usernameNew, codeLen } });
        if (type === TYPE_EMAIL) {
          console.log("You code in email: ", authcode.code);
        } else {
          console.log("You code in phone: ", authcode.code);
        }
      })
      .catch(() => {
        res.json({ success: false, error: 'Something went wrong', errorCode: ERROR_WRONG });
      })
  }
}

function signUpRouter(req, res) {
  const { username, name, password, code } = req.body;
  const type = getUsernameType(username);
  if (type === TYPE_UNDEFINED || !password) {
    res.json({ success: false, error: 'Username or password incorrect', errorCode: ERROR_INCORRECT_USERNAME });
  } else {
    const usernameNew = prepareUsername(username, type);
    AuthCodes.findOne({ username: usernameNew, code }).exec()
      .then(authcode => {
        if (!authcode || Date.now() > authcode.estimate) throw new Error("Not exist");
        return Users.findOne({ $or: [{ phone: usernameNew }, { email: usernameNew }] }).exec();
      })
      .then(user => {
        if (user) {
          res.json({ success: false, error: 'Username is exist', errorCode: ERROR_EXIST });
        } else {
          return (new Users({ name: (name || "").trim(), surname: "", email: type === TYPE_EMAIL ? usernameNew : "", phone: type === TYPE_PHONE ? usernameNew : "", password, role: ROLES.user })).save();
        }
      })
      .then(user => {
        res.json({ success: true, data: generate(user) });
        AuthCodes.remove({ estimate: { $gt: Date.now() } });
      })
      .catch(() => {
        res.json({ success: false, erro: "Code is incorrect", errorCode: ERROR_INCORRECT_CODE });
      })
  }
}

function signInRouter(req, res) {
  const { username, password } = req.body;

  // Filter user from the users array by username and password
  const usernameNew = prepareUsername(username);
  Users.findOne({ password: password, $or: [{ phone: usernameNew }, { email: usernameNew }] }).exec()
    .then(user => {
      if (!user) throw new Error("Not exist");
      res.json({ success: true, data: generate(user) });
    })
    .catch(() => {
      res.json({ success: false, error: 'Username or password incorrect', errorCode: ERROR_NOT_EXIST });
    });
}

function signOutRouter(req, res) {
  res.json({ success: true, data: generate() });
}

module.exports = {
  signInRouter,
  signOutRouter,
  signUpRouter,
  outhCodeRouter,
};