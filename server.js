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
  sendFiles.selectAndSend('8021', '45cc36b3-14cc-4a01-821b-be80b01943ea');
  res.send('<h2>Select and send!</h2>');
});

app.get('/alice/send-files', function (req, res) {
  sendFiles.selectAndSend('8031', 'ef4c42d7-4118-4fa2-a033-80de7e480547');
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
