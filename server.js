const express = require('express');
const bodyParser = require('body-parser');
const files = require('./utils/decodeFiles');
const sendFiles = require('./utils/sendFiles');
const fs = require('node:fs');
const axios = require('axios');

var app = express();
const port = 9999;

// unless using body-parser,
// json data is shown as undefined in terminal
// app.use(express.limit('20mb'));
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ extended: true, lilmit: '200mb' }));

app.get('/', (req, res) => {
  res.send('<h1>Hello Arif, How are you</h1>');
});

app.get('/faber/send-files', function (req, res) {
  sendFiles.selectAndSend('8021', '5158feb8-4679-4bd5-b8ef-cf4eebd94681');
  res.send('<h2>Select and send!</h2>');
});

app.get('/alice/send-files', function (req, res) {
  sendFiles.selectAndSend('8031', 'd4c21def-8ebc-49c6-be2d-58b49593af7a');
  res.send('<h2>Select and send!</h2>');
});

app.all('/webhooks/*', async (req, res) => {
  const jsonData = req.body;

  //====== Checking jsonData object or not ========
  if (
    typeof jsonData === 'object' &&
    'content' in jsonData &&
    jsonData.content.includes('::')
  ) {
    console.log('object found');
    //====== Decode data and save to file =========
    files.decodeFile(jsonData);
  } else {
    console.log('Json data doesnot contain any file');
  }

  // console.log(req.body);
  res.send('Webhook hit');
  res.send();
});

app.listen(port, () => {
  console.log(`Server up at ${port}`);
});
