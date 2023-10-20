require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const validUrl = require('valid-url');
const dns = require('dns');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
let currentShortId = 1;

const Schema = mongoose.Schema;
const shortURLSchema = new Schema({
  original_url: String,
  short_url: Number
});
const shortURL = mongoose.model('shortURL', shortURLSchema);


app.post('/api/shorturl', (req, res) => {
  let original_url = req.body.url;
  if (!validUrl.isWebUri(original_url)) {
    return res.json({ error: 'invalid url' });
  }

  let urlExists = shortURL.find({ original_url: original_url });
  if (urlExists.length > 0) {
    const url = urlExists[0];
    res.json({
      original_url: url.original_url,
      short_url: url.short_url
    });
  } else {
    const newUrlPair = new shortURL({
      original_url: original_url,
      short_url: currentShortId
    });
    currentShortId++;
    newUrlPair.save().then((err, data) => {
      if (err) return console.error(err);
      done(null, data);
    });
    res.json({
      original_url: newUrlPair.original_url,
      short_url: newUrlPair.short_url
    });
  }
})


app.get('/api/shorturl/:shorturl', (req, res) => {
  let short_url = req.params.shorturl;
  shortURL.find({ short_url: short_url }).exec()
    .then((documents) => {
      if (documents.length === 0) {
        res.json({ error: 'invalid url' });
      } else {
        res.redirect(documents[0].original_url);
      }
    })
    .catch(err => {
      console.error(err);
      res.json({ error: 'invalid url' })
    })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
