const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const cors = require('cors');
const { graphqlHTTP } = require("express-graphql");
const mongoose = require("mongoose");
const AppSchema = require("./graphql");
const mongoUri = `${process.env.MONGO_URI}/${process.env.MONGO_DB}`
const mongoOptions = { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, }
const fetch = require('node-fetch');
const fs = require('fs');

const app = express();

app.use(cors());

app.use(
  "/graphql",
  graphqlHTTP({
    schema: AppSchema,
    // rootValue,
    graphiql: true,
  })
);

app.get('/parse', function (req, res) {
  const  { link, range } = req.query;

  let promises = [];
  let from = parseInt(range.split("-")[0]);
  let to = parseInt(range.split("-")[1]);
  if (isNaN(to)) {
    to = from;
  }
  for (let i = from; i <= to; i++) {
    let p = fetch(`${link}${i}`)
      .then(r => new Promise((res, rej) => {
        r.text()
          .then(text => res({ text, url: r.url }))
          .catch(() => rej());
      }))
      .then(({ text, url }) => {
        return new Promise((res, rej) => {
          let part = url.match(/p=(\d+)/);
          let matches = text.match(/<loc>[^<]+<\/loc>/g);
          let urls = (matches || []).map(part => part.replace(/<loc>|<\/loc>/g, ""));
          fs.writeFile(`./results/items_${part[1]}.tsv`, urls.join("\n"), function (err, data) {
            if (err) {
              rej(err);
              return console.log(err);
            }
            res();
          });
        });
      });
    promises.push(p);
  }
  Promise.all(promises)
    .then(() => res.send("DONE: " + promises.length));
});

app.get('/parse-content', function (req, res) {
  const  { range } = req.query;

  let from = parseInt(range.split("-")[0]);
  let to = parseInt(range.split("-")[1]);
  if (isNaN(to)) {
    to = from;
  }

  let files = [];
  for (let i = from; i <= to; i++) {
    let p = new Promise((res, rej) => {
      fs.readFile(`./results/items_${i}.tsv`, 'utf8', (err, data) => {
        if (err) {
          rej(err);
          return console.log(err);
        } 
        const content = data.split("\n")
                            .map(line => {
                              let parts = line.split("\t").map(a => a.trim());
                              return [parts[0], parts[1] || "", parts[2] || ""];
                            })
                            .filter(([url]) => url);
        res({index: i, content: content});
      });
    })
    .then(({index, content}) => new Promise((res, rej) => {
      Promise.all(content.map(([url, city, phone], index) => new Promise((res, rej) => {
        if (city && city.indexOf("Error:") !== 0) {
          res({url, city, phone});
        } else {
          setTimeout(() => {
            parseData(url)
              .then(({url, city, phone}) => {
                res({url, city, phone});
              })
          }, parseInt(Math.random()*100));
        }
      })))
        .then(content => {
          res({index, content})
        })
    }))
    .then(({index, content}) => new Promise((res, rej) => {
      fs.writeFile(`./results/items_${index}.tsv`, content.map(({url, phone, city}) => `${url}\t${city}\t${phone}`).join("\n"), function (err, data) {
        if (err) {
          rej(err);
          return console.log(err);
        }
        res();
      });
    }))
    files.push(p);
  }

  Promise.all(files)
    .then(() => {
      res.send("DONE: " + range);
    })
    .catch(() => {
      res.send("FAIL: " + range);
    })
});

// parseData("http://sobut.ru/timashevsk/kvartiry-obyavleniya/zapadnaya-ulitsa-6_3710221");

function parseData(url) {
  url = url.trim();
  return new Promise((globRes) => {
    fetch(url)
      .then(r => new Promise((res) => {
        if (r.ok) {
          r.text()
          .then((text) => {
            res({'cookie': r.headers.get('set-cookie'), text});
          })
        } else {
          res({error: "Error: " + r.statusText.replace(/\W+/, "")});
        }
      }))
      .then(({cookie, text, error}) => new Promise((res) => {
        if (error) {
          res({phone: "no", city: error});
          return;
        }
        const matchCity = text.match(/['"]top_a_location['"]>([^<]+)/);
        const city = ((matchCity && matchCity[1]) || "no_city").trim();
        
        const phoneMatch = text.match(/['"]get-phone['"]\s+lnk=['"]([^'"]+)/);
        if (phoneMatch && phoneMatch[1] && phoneMatch[1].indexOf("/get_phones/") != -1) {
          fetch(`${url}/get_phones/`, {
                method: 'POST',
                body: `csrfmiddlewaretoken=${prepareCookies(cookie)["csrftoken"]}`,
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'cookie': cookie,
                },
              })
            .then(r => r.ok ? r.text() : "error")
            .then(phone => {
              res({phone, city});
            })
        } else {
          res({phone: "no", city});
        } 
      }))
      .then(({phone, city}) => {
        // console.log("GlobRes", city);
        globRes({url, phone, city});
      });
  });
}

function prepareCookies(cookie) {
  const cookieData = {};
  cookie.split(";").forEach(value => {
    var d = value.split("=");
    cookieData[d[0].trim()] = d[1].trim();
  });
  return cookieData;
}

mongoose
  .connect(mongoUri, mongoOptions)
  .then(() => app.listen(process.env.SERVER_PORT, console.log("Server is running")))
  .catch(error => {
    console.log(error);
  })