const express = require('express');
const bodyParser = require('body-parser');
const files = require('./utils/encodeDecode');
const dialog = require('node-file-dialog');
const fs = require('node:fs');
const axios = require('axios');

const app = express();
const port = 9998;

// unless using body-parser,
// json data is shown as undefined in terminal
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('<h1>Hello Arif, How are you</h1>');
});

app.get('/open-file', (req, res) => {
  const config = { type: 'open-file' };
  dialog(config)
    .then((dir) => {
      file_path = dir[0];
      console.log(file_path);
      // fs.readFile(file_path, 'utf8', (err, data) => {
      //   if (err) console.log(err);
      //   console.log(data);
      // });
      const fileBuffur = fs.readFileSync(file_path);
      const base64string = fileBuffur.toString('base64');
      console.log(base64string);
    })
    .catch((err) => console.log(err));
  res.send('<h2>Select file</h2>');
});

app.get('/send-files', function (req, res) {
  // Your code here
  const config = { type: 'open-file' };

  dialog(config)
    .then((dir) => {
      file_path = dir[0];
      console.log(file_path);
      const fileBuffur = fs.readFileSync(file_path);
      const base64string = fileBuffur.toString('base64');
      console.log(base64string);

      const data = {
        content: base64string,
      };

      axios
        .post(
          'http://localhost:8021/connections/f606278b-5a0c-4842-94c8-9545899588fa/send-message',
          data
        )
        .then((resp) => {
          try {
            console.log('query successful');
            console.log(JSON.stringify(resp.data, null, 2));
          } catch (error) {
            console.log(error);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((err) => console.log(err));

  res.send('See connections');
});

app.all('/webhooks/*', async (req, res) => {
  console.log(req.body);
  res.send('Hey how are you?');
});

app.listen(port, () => {
  console.log(`Server up at ${port}`);
});
