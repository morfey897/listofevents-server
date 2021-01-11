const jwt = require("jsonwebtoken");
const { transliterate } = require('inflected');
const Users = require("../models/user-model");
const AuthCodes = require("../models/authcode-model");
const { jsTrim, inlineArgs } = require('../utils/validation-utill');
const { ROLES } = require("../config");
const ms = require("ms");
const { ERRORCODES, getError } = require("../errors");
const { sendEmail } = require("../services/email-service");
const { sendSMS } = require("../services/sms-service");
const i18n = require("../services/i18n-service");

const EMAIL_REG_EXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PHONE_REG_EXP = /^\+?\d{10,}$/;

const TYPE_EMAIL = "email";
const TYPE_PHONE = "phone";
const TYPE_UNDEFINED = "_undefined";

function getUsernameType(username) {
  if (EMAIL_REG_EXP.test((username || "").trim())) {
    return TYPE_EMAIL;
  } else if (PHONE_REG_EXP.test((username || "").replace(/\D/g, ""))) {
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
  const { username } = req.body;

  const type = getUsernameType(username);
  if (type === TYPE_UNDEFINED) {
    res.json({ success: false, ...getError(ERRORCODES.ERROR_INCORRECT_USERNAME) });
  } else {
    const lifetime = ms(process.env.AUTH_CODE_LIFETIME);
    const codeLen = parseInt(process.env.AUTH_CODE_LEN);
    const usernameNew = prepareUsername(username, type);
    const code = (new Array(codeLen).fill("0").join("") + parseInt(Math.random() * Math.pow(10, codeLen)).toString()).slice(-1 * codeLen);
    const estimate = Date.now() + lifetime;
    (new AuthCodes({ username: usernameNew, type, code, estimate })).save()
      .then((authcode) => {
        if (authcode === undefined) return;
        res.json({ success: true, data: { type, lifetime: parseInt(lifetime / 1000), username: usernameNew, codeLen } });
        if (type === TYPE_EMAIL) {
          sendEmail({
            from: i18n.__("auth_code_from"),
            to: username,
            subject: i18n.__("auth_code_subject"),
            text: i18n.__("auth_code_text", { code: authcode.code }),
            html: i18n.__("auth_code_html", { code: authcode.code }),
          }, "no_reply");
          console.log("You code in email: ", authcode.code);
        } else {
          sendSMS({
            to: username,
            message: transliterate(i18n.__("auth_code_text", { code: authcode.code }))
          });
          console.log("You code in phone: ", authcode.code);
        }
      })
      .catch(() => {
        res.json({ success: false, ...getError(ERRORCODES.ERROR_WRONG) });
      })
  }
}

function signUpRouter(req, res) {
  const { username, name, password, code } = req.body;
  const type = getUsernameType(username);
  if (type === TYPE_UNDEFINED || !password) {
    res.json({ success: false, ...getError(ERRORCODES.ERROR_INCORRECT_USERNAME) });
  } else {
    const usernameNew = prepareUsername(username, type);
    AuthCodes.findOne({ username: usernameNew, code }).exec()
      .then(authcode => {
        if (!authcode || Date.now() > authcode.estimate) throw new Error("Not exist");
        return Users.findOne({ $or: [{ phone: usernameNew }, { email: usernameNew }] }).exec();
      })
      .then(user => {
        if (user) {
          res.json({ success: false, ...getError(ERRORCODES.ERROR_USER_EXIST) });
        } else {
          return (new Users({ name: (name || "").trim(), surname: "", email: type === TYPE_EMAIL ? usernameNew : "", phone: type === TYPE_PHONE ? usernameNew : "", password, role: ROLES.user })).save();
        }
      })
      .then(user => {
        res.json({ success: true, data: generate(user) });
        AuthCodes.deleteMany({ estimate: { $lt: Date.now() } }).exec();
      })
      .catch(() => {
        res.json({ success: false, ...getError(ERRORCODES.ERROR_INCORRECT_CODE) });
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
      res.json({ success: false, ...getError(ERRORCODES.ERROR_USER_NOT_EXIST) });
    });
}

function facebookRouter(req, res) {
  const body = req.body;
  console.log("SIGN_IN_FB", body);
  res.json({ success: true });
}

function renameRouter(req, res) {
  const { name, surname, phone, email, password, code } = req.body;
  const currentUser = req.user;

  const typePhone = getUsernameType(phone);
  const typeEmail = getUsernameType(email);

  let newPhone = "";
  let newEmail = "";
  if (typePhone === TYPE_PHONE) {
    newPhone = prepareUsername(phone, typePhone);
  } else if (typePhone === TYPE_EMAIL) {
    newEmail = prepareUsername(phone, typePhone);
  }

  if (typeEmail === TYPE_PHONE) {
    newPhone = prepareUsername(email, typeEmail);
  } else if (typeEmail === TYPE_EMAIL) {
    newEmail = prepareUsername(email, typeEmail);
  }

  AuthCodes.findOne({ $or: [{ username: newEmail, code }, { username: newPhone, code }] }).exec()
    .then(authcode => {
      if (!authcode || Date.now() > authcode.estimate) throw new Error("Not exist");
      let fields = [];
      if (newPhone) {
        fields.push({ phone: newPhone });
      }
      if (newEmail) {
        fields.push({ email: newEmail });
      }
      return Users.find({ $or: fields }).exec();
    })
    .then(users => {
      const user = users && users.length && users.find(({ _id }) => currentUser.id != _id);
      if (user) {
        res.json({ success: false, ...getError(newEmail && user.email == newEmail ? ERRORCODES.ERROR_EXIST_EMAIL : (newPhone && user.phone == newPhone ? ERRORCODES.ERROR_EXIST_PHONE : ERRORCODES.ERROR_USER_EXIST)) });
      } else {
        return Users.findOneAndUpdate({ _id: currentUser.id }, {
          $set: inlineArgs(jsTrim({
            email: newEmail,
            phone: newPhone,
            name, surname, password
          }, ["email", "phone", "name", "surname"]))
        }, { new: true }).exec();
      }
    })
    .then(user => {
      if (user !== undefined) {
        res.json({ success: true, data: generate(user) });
      }
      AuthCodes.deleteMany({ estimate: { $lt: Date.now() } }).exec();
    })
    .catch(() => {
      res.json({ success: false, ...getError(ERRORCODES.ERROR_INCORRECT_CODE) });
    })
}

function signOutRouter(req, res) {
  res.json({ success: true, data: generate() });
}

module.exports = {
  signInRouter,
  signOutRouter,
  signUpRouter,
  renameRouter,
  outhCodeRouter,

  facebookRouter
};