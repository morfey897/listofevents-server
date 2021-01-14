const jwt = require("jsonwebtoken");
const axios = require('axios').default;
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
const { APPS } = require('../config');


// eslint-disable-next-line no-useless-escape
const EMAIL_REG_EXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PHONE_REG_EXP = /^\+?\d{10,}$/;

const TYPE_EMAIL = "email";
const TYPE_PHONE = "phone";
const TYPE_FACEBOOK = "facebook";
const TYPE_INSTAGRAM = "instagram";

function getUsernameType(username) {
  if (EMAIL_REG_EXP.test((username || "").trim())) {
    return TYPE_EMAIL;
  } else if (PHONE_REG_EXP.test((username || "").replace(/\D/g, ""))) {
    return TYPE_PHONE;
  }
  return undefined;
}

function prepareUsername(username, type) {
  type = type || getUsernameType(username);
  if (type === TYPE_EMAIL) return username.toLowerCase().trim();
  if (type === TYPE_PHONE) return "+" + username.replace(/\D/g, "");
  return "";
}

function generate(user) {
  if (!user) return { token: { accessToken: "", expiresIn: 0 }, user: { _id: 0, role: 0, name: "", surname: "", email: "", phone: "", facebook: {}, instagram: {} } };
  const accessToken = jwt.sign({ _id: user._id, role: user.role }, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_LIFETIME });
  const decoded = jwt.decode(accessToken);
  return { token: { accessToken, expiresIn: decoded.exp }, user: { _id: user._id, name: user.name, surname: user.surname, role: user.role, email: user.email, phone: user.phone, facebook: user.facebook, instagram: user.instagram } };
}

function outhCodeRouter(req, res) {
  const { username } = req.body;

  const type = getUsernameType(username);
  if (type !== TYPE_EMAIL && type !== TYPE_PHONE) {
    res.json({ success: false, ...getError(ERRORCODES.ERROR_INCORRECT_USERNAME) });
  } else {
    const lifetime = ms(process.env.AUTH_CODE_LIFETIME);
    const codeLen = parseInt(process.env.AUTH_CODE_LEN);
    const readyUsername = prepareUsername(username, type);
    const code = (new Array(codeLen).fill("0").join("") + parseInt(Math.random() * Math.pow(10, codeLen)).toString()).slice(-1 * codeLen);
    const estimate = Date.now() + lifetime;
    (new AuthCodes({ username: readyUsername, type, code, estimate })).save()
      .then((authcode) => {
        if (authcode === undefined) return;
        res.json({ success: true, data: { type, lifetime: parseInt(lifetime / 1000), username: readyUsername, codeLen } });
        if (type === TYPE_EMAIL) {
          sendEmail({
            from: i18n.__("auth_code_from"),
            to: readyUsername,
            subject: i18n.__("auth_code_subject"),
            text: i18n.__("auth_code_text", { code: authcode.code }),
            html: i18n.__("auth_code_html", { code: authcode.code }),
          }, "no_reply");
          console.log("You code in email: ", authcode.code);
        } else {
          sendSMS({
            to: readyUsername,
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
  const { type, name } = req.body;
  const names = (name || "").trim().split(/\s+/);

  if (type == TYPE_FACEBOOK || type == TYPE_INSTAGRAM) {
    const { id, link, access_token } = req.body;
    if (!id || !link || !access_token) {
      res.json({ success: false, ...getError(ERRORCODES.ERROR_CAN_NOT_CONNECT_SOCIAL) });
    } else {
      const email = prepareUsername(req.body.email);
      const phone = prepareUsername(req.body.phone);
      const conditions = [];
      conditions.push({ [`${type}.id`]: id });
      if (email) {
        conditions.push({ email });
      }
      if (phone) {
        conditions.push({ phone });
      }
      Users.findOne({ $or: conditions }).exec()
        .then(user => {
          if (!user) {
            return (new Users({
              facebook: { id, link, access_token },
              name: names[0] || "", surname: names[1] || "",
              role: ROLES.user,
              email, phone,
              password: ""
            })).save();
          }
          if (user[type].id != id) {
            throw new Error("Not exist");
          }
          return user;
        })
        .then(user => {
          res.json({ success: true, data: generate(user) });
        })
        .catch(() => {
          res.json({ success: false, ...getError(email ? ERRORCODES.ERROR_EXIST_EMAIL : (phone ? ERRORCODES.ERROR_EXIST_PHONE : ERRORCODES.ERROR_USER_EXIST)) });
        })
    }
  } else {
    const { password, code, username } = req.body;
    const type = getUsernameType(username);
    if (type != TYPE_EMAIL && type != TYPE_PHONE) {
      res.json({ success: false, ...getError(ERRORCODES.ERROR_INCORRECT_USERNAME) });
    } else {
      const readyUsername = prepareUsername(username, type);
      AuthCodes.findOne({ username: readyUsername, code }).exec()
        .then(authcode => {
          if (!authcode || Date.now() > authcode.estimate) throw new Error("Not exist");
          return Users.findOne({ [type]: readyUsername }).exec();
        })
        .then(user => {
          if (user) {
            res.json({ success: false, ...getError(type == TYPE_EMAIL ? ERRORCODES.ERROR_EXIST_EMAIL : ERRORCODES.ERROR_EXIST_PHONE) });
          } else {
            (new Users({
              name: names[0] || "", surname: names[1] || "",
              email: type === TYPE_EMAIL ? readyUsername : "",
              phone: type === TYPE_PHONE ? readyUsername : "",
              password, role: ROLES.user
            })).save()
              .then(user => {
                res.json({ success: true, data: generate(user) });
                AuthCodes.deleteMany({ estimate: { $lt: Date.now() } }).exec();
              })
          }
        })
        .catch(() => {
          res.json({ success: false, ...getError(ERRORCODES.ERROR_INCORRECT_CODE) });
        })
    }
  }
}

function signInRouter(req, res) {
  const { password } = req.body;
  const username = prepareUsername(req.body.username);

  // Filter user from the users array by username and password
  Users.findOne({ password: password || Math.random(), $or: [{ phone: username }, { email: username }] }).exec()
    .then(user => {
      if (!user) throw new Error("Not exist");
      res.json({ success: true, data: generate(user) });
    })
    .catch(() => {
      res.json({ success: false, ...getError(ERRORCODES.ERROR_USER_NOT_EXIST) });
    });
}

function renameRouter(req, res) {
  const currentUserId = req.user._id;
  const { name, surname, new_pass, old_pass, phone, email, code, instagram, facebook } = req.body;

  if (name || surname) {
    Users.findOneAndUpdate({ _id: currentUserId }, { $set: inlineArgs(jsTrim({ name, surname })) }, { new: true }).exec()
      .then(user => {
        res.json({ success: true, data: generate(user) });
      })
  } else if (new_pass) {
    Users.findOneAndUpdate({ _id: currentUserId, password: old_pass }, { $set: { password: new_pass } }, { new: true }).exec()
      .then(user => {
        res.json({ success: true, data: generate(user) });
      })
  } else if (email || phone) {
    const type = getUsernameType(email || phone);
    if (type != TYPE_EMAIL && type != TYPE_PHONE) {
      res.json({ success: false, ...getError(ERRORCODES.ERROR_INCORRECT_USERNAME) });
    } else {
      const username = prepareUsername(email || phone);
      AuthCodes.findOne({ username, code }).exec()
        .then(authcode => {
          if (!authcode || Date.now() > authcode.estimate) throw new Error("Not exist");
          return Users.find({ [type]: username }).exec();
        })
        .then(users => {
          const user = users && users.length && users.find(({ _id }) => currentUserId != _id);
          if (user) {
            res.json({ success: false, ...getError(type == TYPE_EMAIL ? ERRORCODES.ERROR_EXIST_EMAIL : ERRORCODES.ERROR_EXIST_PHONE) });
          } else {
            Users.findOneAndUpdate({ _id: currentUserId }, { $set: { [type]: username } }, { new: true })
              .exec()
              .then(user => {
                if (user !== undefined) {
                  res.json({ success: true, data: generate(user) });
                }
                AuthCodes.deleteMany({ estimate: { $lt: Date.now() } }).exec();
              })
          }
        })
        .catch(() => {
          res.json({ success: false, ...getError(ERRORCODES.ERROR_INCORRECT_CODE) });
        })
    }
  } else if (facebook || instagram) {
    const { id, link, access_token } = (facebook || instagram);
    if (id && link && access_token) {
      let args = {};
      if (facebook) {
        args = inlineArgs({ facebook: { id, link, access_token } });
      } else if (instagram) {
        args = inlineArgs({ instagram: { id, link, access_token } });
      }
      Users.findOneAndUpdate({ _id: currentUserId }, { $set: args }, { new: true }).exec()
        .then(user => {
          res.json({ success: true, data: generate(user) });
        })
    } else {
      res.json({ success: false, ...getError(ERRORCODES.ERROR_CAN_NOT_CONNECT_SOCIAL) });
    }
  }

}

function signOutRouter(req, res) {
  res.json({ success: true, data: generate() });
}

function signInFacebook(req, res) {
  console.log("REQ_BODY:", req.body);
  console.log("REQ_QUERY:", req.query);

  const { code, state } = req.query;
  axios({
    url: 'https://graph.facebook.com/v9.0/oauth/access_token',
    method: 'get',
    params: {
      client_id: APPS.facebook.appId,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: `${process.env.HOST}/oauth/signin-facebook`,
      code,
    },
  }).then(({ data }) => {
    console.log("ACCESS_TOKEN", data.access_token);
  });

  res.send(`<!DOCTYPE html>
  <html>
  <head>
      <title>Pdevents</title>
      <meta charset="utf-8" />
      <script>
          window.close();
      </script>
  </head>
  <body>
      <h1>SUCCESS</h1>
  </body>
  <html>`);
}

module.exports = {
  signInRouter,
  signOutRouter,
  signUpRouter,
  renameRouter,
  outhCodeRouter,

  signInFacebook
};