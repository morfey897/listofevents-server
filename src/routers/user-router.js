const jwt = require("jsonwebtoken");
const axios = require('axios').default;
const { transliterate } = require('inflected');
const shortid = require('shortid');
const { OAuth2Client } = require('google-auth-library');
const Users = require("../models/user-model");
const AuthCodes = require("../models/authcode-model");
const { jsTrim, inlineArgs } = require('../utils/validation-utill');
const { ROLES, SIGNIN, APPS, LANGS } = require("../config");
const ms = require("ms");
const { ERRORCODES, getError } = require("../errors");
const { sendEmail } = require("../services/email-service");
const { sendSMS } = require("../services/sms-service");
const i18n = require("../services/i18n-service");
const { facebookSignedRequest } = require("../services/parse-signed-request");

// eslint-disable-next-line no-useless-escape
const EMAIL_REG_EXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PHONE_REG_EXP = /^\+?\d{10,}$/;

const SOCIAL_PROMISES = {};

const googleClient = new OAuth2Client(APPS.google.appId);

function getRole(signup) {
  return ROLES.user + ROLES.editor;
}

function getUsernameType(username) {
  if (EMAIL_REG_EXP.test((username || "").trim())) {
    return SIGNIN.email;
  } else if (PHONE_REG_EXP.test((username || "").replace(/\D/g, ""))) {
    return SIGNIN.phone;
  }
  return undefined;
}

function prepareUsername(username, type) {
  type = type || getUsernameType(username);
  if (type === SIGNIN.email) return username.toLowerCase().trim();
  if (type === SIGNIN.phone) return "+" + username.replace(/\D/g, "");
  return "";
}

function generate(user, login) {
  const signin = Object.keys(SIGNIN).map(v => ({ [v]: "" }));

  if (!user) return { token: { accessToken: "", expiresIn: 0 }, user: { _id: 0, role: 0, name: "", surname: "", ...signin } };
  const accessToken = jwt.sign({ _id: user._id, role: user.role, login }, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_LIFETIME });
  const decoded = jwt.decode(accessToken);

  for (let n in signin) {
    signin[n] = n == SIGNIN.email || n == SIGNIN.phone ? user[n] : user[n].id;
  }

  return {
    token: { accessToken, expiresIn: decoded.exp }, user: {
      _id: user._id,
      name: user.name,
      surname: user.surname,
      role: user.role,
      ...signin,
    }
  };
}

function outhCodeRouter(req, res) {
  const { username } = req.body;
  let { locale } = req.query;
  if (!LANGS.includes(locale)) {
    locale = LANGS[0];
  }

  const type = getUsernameType(username);
  if (type !== SIGNIN.email && type !== SIGNIN.phone) {
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
        if (type === SIGNIN.email) {
          sendEmail({
            from: i18n.__({ phrase: "auth_code_from", locale }),
            to: readyUsername,
            subject: i18n.__({ phrase: "auth_code_subject", locale }),
            text: i18n.__({ phrase: "auth_code_text", locale }, { code: authcode.code }),
            html: i18n.__({ phrase: "auth_code_html", locale }, { code: authcode.code }),
          }, "no_reply");
          console.log("You code in email: ", authcode.code);
        } else {
          sendSMS({
            to: readyUsername,
            message: transliterate(i18n.__({ phrase: "auth_code_text", locale }, { code: authcode.code }))
          });
          console.log("You code in phone: ", authcode.code);
        }
      })
      .catch((e) => {
        console.log("ERROR", e);
        res.json({ success: false, ...getError(ERRORCODES.ERROR_WRONG) });
      })
  }
}

function signUpRouter(req, res) {
  const { type } = req.body;

  if (type == SIGNIN.facebook || type == SIGNIN.instagram || type == SIGNIN.google) {
    const { state } = req.body;
    if (!state) {
      res.json({ success: false, ...getError(ERRORCODES.ERROR_CAN_NOT_CONNECT_SOCIAL) });
    } else {
      if (type == SIGNIN.google) {
        const { token } = req.body;
        SOCIAL_PROMISES[state] = googleClient.verifyIdToken({
          idToken: token,
          audience: APPS.google.appId
        }).then((tiket) => {
          const { sub, email, given_name, family_name } = tiket.getPayload();
          return {
            success: true,
            user: {
              id: sub,
              access_token: token,
              link: "https://www.google.com/",

              email,
              first_name: given_name,
              last_name: family_name
            }
          };
        })
      }
      const callBackFunction = ({ success, user: userData }) => {
        if (!success) {
          res.json({ success: false, ...getError(ERRORCODES.ERROR_CAN_NOT_CONNECT_SOCIAL) });
        } else {
          const email = prepareUsername(userData.email);
          const conditions = [];
          conditions.push({ [`${type}.id`]: userData.id });
          if (email) {
            conditions.push({ email });
          }
          Users.find({ $or: conditions }).exec()
            .then(users => {
              const user = users.find(user => user[type].id === userData.id);
              const emailUser = email && users.find(user => user.email === email);
              if (!user && !emailUser) {
                return (new Users({
                  [type]: { id: userData.id, link: userData.link, access_token: userData.access_token },
                  name: userData.first_name || "", surname: userData.last_name || "",
                  role: getRole(type),
                  email: email || "",
                  phone: "",
                  password: ""
                })).save();
              } else if (emailUser && !emailUser[type].id) {
                const args = inlineArgs({ [type]: { id: userData.id, link: userData.link, access_token: userData.access_token } });
                return Users.findOneAndUpdate({ _id: emailUser._id }, { $set: args }, { new: true }).exec();
              }
              return user;
            })
            .then(user => {
              res.json({ success: true, data: generate(user, type) });
            })
            .catch(() => {
              res.json({ success: false, ...getError(ERRORCODES.ERROR_CAN_NOT_CONNECT_SOCIAL) });
            })
        }
      }
      if (SOCIAL_PROMISES[state] instanceof Promise) {
        SOCIAL_PROMISES[state]
          .then(callBackFunction)
          .then(() => {
            delete SOCIAL_PROMISES[state];
          }).catch(() => {
            res.json({ success: false, ...getError(ERRORCODES.ERROR_CAN_NOT_CONNECT_SOCIAL) });
          })
      } else {
        SOCIAL_PROMISES[state] = callBackFunction;
      }
    }
  } else {
    const { password, code, username, name } = req.body;
    const names = (name || "").trim().split(/\s+/);
    const type = getUsernameType(username);
    if (type != SIGNIN.email && type != SIGNIN.phone) {
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
            res.json({ success: false, ...getError(type == SIGNIN.email ? ERRORCODES.ERROR_EXIST_EMAIL : ERRORCODES.ERROR_EXIST_PHONE) });
          } else {
            (new Users({
              name: names[0] || "", surname: names[1] || "",
              email: type === SIGNIN.email ? readyUsername : "",
              phone: type === SIGNIN.phone ? readyUsername : "",
              password, role: getRole(type)
            })).save()
              .then(user => {
                res.json({ success: true, data: generate(user, type) });
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
  const type = getUsernameType(req.body.username);
  if (type == SIGNIN.email || type == SIGNIN.phone) {
    // Filter user from the users array by username and password
    console.log("REQ", { password: password, [type]: prepareUsername(req.body.username, type) });
    Users.findOne({ password: password, [type]: prepareUsername(req.body.username, type) }).exec()
      .then(user => {
        if (!user) throw new Error("Not exist");
        res.json({ success: true, data: generate(user, type) });
      })
      .catch(() => {
        res.json({ success: false, ...getError(ERRORCODES.ERROR_USER_NOT_EXIST) });
      });
  } else {
    res.json({ success: false, ...getError(ERRORCODES.ERROR_USER_NOT_EXIST) });
  }
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
    if (type != SIGNIN.email && type != SIGNIN.phone) {
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
            res.json({ success: false, ...getError(type == SIGNIN.email ? ERRORCODES.ERROR_EXIST_EMAIL : ERRORCODES.ERROR_EXIST_PHONE) });
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
        args = inlineArgs({ [SIGNIN.facebook]: { id, link, access_token } });
      } else if (instagram) {
        args = inlineArgs({ [SIGNIN.instagram]: { id, link, access_token } });
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
  //TODO need destroy JWT_TOKEN
  res.json({ success: true, data: generate() });
}

function signInFacebook(req, res) {
  const { code, state } = req.query;

  const promise = new Promise((res) => {
    axios({
      url: 'https://graph.facebook.com/v9.0/oauth/access_token',
      method: 'get',
      params: {
        client_id: APPS.facebook.appId,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: `${process.env.HOST}/oauth/signin-facebook`,
        code,
      },
    }).then(({ data }) => Promise.allSettled([
      axios({
        url: 'https://graph.facebook.com/me',
        method: 'get',
        params: {
          fields: ['id', 'email', 'first_name', 'last_name'].concat(APPS.facebook.state === "production" ? "user_link" : "").filter(a => !!a).join(","),
          access_token: data.access_token,
        },
      }),
      Promise.resolve({ access_token: data.access_token })
    ])).then(([{ value: fb }, { value: token }]) => {
      const data = fb.data;
      res({ success: true, user: { id: data.id, access_token: token.access_token, email: data.email, first_name: data.first_name, last_name: data.last_name, link: data.user_link || "https://www.facebook.com" } });
    }).catch(() => {
      res({ success: false });
    });
  });

  if (typeof SOCIAL_PROMISES[state] === "function") {
    promise.then(SOCIAL_PROMISES[state])
  } else {
    SOCIAL_PROMISES[state] = promise;
  }

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

function signInInstagram(req, res) {
  const { code, state } = req.query;
  const params = new URLSearchParams()
  params.append("client_id", APPS.instagram.appId);
  params.append("client_secret", process.env.INSTAGRAM_APP_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", `${process.env.HOST}/oauth/signin-instagram`);
  params.append("code", code);

  const promise = new Promise((res) => {
    axios({
      url: 'https://api.instagram.com/oauth/access_token',
      method: 'post',
      data: params,
      headers: {
        "Content-Type": 'application/x-www-form-urlencoded'
      },
    }).then(({ data }) => Promise.allSettled([
      axios({
        url: `https://graph.instagram.com/me`,
        method: 'get',
        params: {
          fields: ['id', 'username'].filter(a => !!a).join(","),
          access_token: data.access_token,
        },
      }),
      Promise.resolve({ access_token: data.access_token })
    ])
    ).then(([{ value: insta }, { value: token }]) => {
      const data = insta.data;
      let username = data.username.replace(/\d/g, "");
      // eslint-disable-next-line no-useless-escape
      const [first_name, last_name] = username.split(/[\._]/).filter(a => !!a);
      res({ success: true, user: { id: data.id, access_token: token.access_token, first_name, last_name, link: `https://www.instagram.com/${username.username}` } });
    }).catch(() => {
      res({ success: false });
    });
  });

  if (typeof SOCIAL_PROMISES[state] === "function") {
    promise.then(SOCIAL_PROMISES[state])
  } else {
    SOCIAL_PROMISES[state] = promise;
  }

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

function deletionFacebook(req, res) {
  const signed_request = req.body["signed_request"];
  if (signed_request) {
    try {
      const { user_id } = facebookSignedRequest(signed_request, process.env.FACEBOOK_APP_SECRET);
      const confirmCode = shortid.generate();

      const conditions = { [`${SIGNIN.facebook}.id`]: user_id };
      Users.findOne(conditions).exec()
        .then(user => {
          if (!user) {
            res.sendStatus(400);
          } else if (!user[SIGNIN.instagram].id && !user[SIGNIN.google].id && !user.password) {
            Users.deleteMany({ _id: user._id })
              .then(({ deletedCount }) => {
                if (deletedCount > 0) {
                  res.json({ 'url': `${process.env.HOST}/oauth/deletion-facebook?confirmation_code=${confirmCode}`, 'confirmation_code': confirmCode });
                }
              });
          } else {
            Users.findOneAndUpdate({ _id: user._id }, { $set: inlineArgs({ [SIGNIN.facebook]: { id: "", link: "", access_token: "" } }) });
          }
        });
    } catch (e) {
      res.sendStatus(400);
    }
  } else {
    const { confirmation_code } = req.query;
    if (confirmation_code) {
      res.send(`<!DOCTYPE html>
      <html>
      <head>
          <title>Pdevents.com.ua</title>
          <meta charset="utf-8" />
      </head>
      <body>
          <h1>Your account was deleted</h1>
      </body>
      <html>`);
    } else {
      res.sendStatus(400);
    }
  }
}

module.exports = {
  signInRouter,
  signOutRouter,
  signUpRouter,
  renameRouter,
  outhCodeRouter,

  // signInFacebook,
  // deletionFacebook,
  // signInInstagram
};