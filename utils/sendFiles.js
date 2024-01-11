const dialog = require('node-file-dialog');
const fs = require('node:fs');
const axios = require('axios');

function selectAndSend(port, connId) {
  // define dialog open type
  const config = { type: 'open-file' };

  //===== file opening window =========
  dialog(config)
    .then((dir) => {
      //===== extracting file path ==========
      file_path = dir[0];
      console.log(file_path);
      const file_name = file_path.split('/').pop();
      //===== File data to binary data =========
      const fileBuffur = fs.readFileSync(file_path);
      //===== Base64 conversion of binary data =========
      const base64string = fileBuffur.toString('base64');
      // console.log(base64string);

      const data = {
        content: file_name + '::' + base64string,
      };

      //========= call Agent's administritive api ==============
      axios
        .post(
          `http://localhost:${port}/connections/${connId}/send-message`,
          data
        )
        .then((resp) => {
          try {
            console.log('query successful');
            // console.log(JSON.stringify(resp.data, null, 2));
          } catch (error) {
            console.log(error);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((err) => console.log(err));
}

module.exports = { selectAndSend };
