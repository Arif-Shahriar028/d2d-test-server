const fs = require('node:fs');

function decodeFile(jsonData) {
  //====== Splitting data to identify content =========
  const dataArr = jsonData.content.split('::');
  const file_name = dataArr[0];
  const base64 = dataArr[1];
  // console.log(base64);

  //====== Decode base64 data =========
  const decodedData = atob(base64);
  // console.log(decodedData);
  console.log(typeof decodedData);

  //====== Create file and write on it ========
  var writeStream = fs.createWriteStream(`received-files/${file_name}`);
  writeStream.write(decodedData);
  writeStream.end();
}

module.exports = { decodeFile };
