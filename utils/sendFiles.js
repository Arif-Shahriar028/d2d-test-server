// const dialog = require('node-file-dialog');
// const fs = require('fs');  // Using promises version of fs
// const axios = require('axios');
// const stream = require('stream');

// async function selectAndSend(port, connId) {
//     const config = { type: 'open-file' };

//     try {
//         const dir = await dialog(config);
//         const file_path = dir[0];
//         console.log(file_path);
//         const file_name = file_path.split('/').pop();

//         const chunkSize = 99999; // 1 Megabyte
//         const fileStream = fs.createReadStream(file_path, { highWaterMark: chunkSize });
//         let chunkNumber = 0;

//         const sendChunk = async (chunk) => {
//             const base64string = chunk.toString('base64');
//             const data = {
//                 content: `${file_name}::chunk${chunkNumber}::${base64string}`,
//             };

//             try {
//                 await axios.post(`http://localhost:${port}/connections/${connId}/send-message`, data);
//                 console.log(`Chunk ${chunkNumber} sent successfully`);
//                 chunkNumber++;
//             } catch (err) {
//                 console.error(err);
//             }
//         };

//         for await (const chunk of fileStream) {
//             await sendChunk(chunk);
//         }

//         console.log('File sent successfully');
//     } catch (err) {
//         console.error(err);
//     }
// }

// module.exports = { selectAndSend };

// --------------- BOTTLENECK MECHANISM -------------------

const dialog = require('node-file-dialog');
const fs = require('fs');
const axios = require('axios');
const Bottleneck = require('bottleneck');

async function selectAndSend(port, connId) {
  const config = { type: 'open-file' };

  try {
    const dir = await dialog(config);
    const file_path = dir[0];
    console.log(file_path);
    const file_name = file_path.split('/').pop();

    const chunkSize = 99999; // 1 Megabyte
    const fileStream = fs.createReadStream(file_path, {
      highWaterMark: chunkSize,
    });
    let chunkNumber = 0;

    // Create a limiter with, for example, 1 request per second
    const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 5000 });

    const sendChunk = async (chunk) => {
      // Use the throttled function
      await limiter.schedule(async () => {
        const base64string = chunk.toString('base64');
        const data = {
          content: `${file_name}::chunk${chunkNumber}::${base64string}`,
        };

        try {
          await axios.post(
            `http://localhost:${port}/connections/${connId}/send-message`,
            data
          );
          console.log(`Chunk ${chunkNumber} sent successfully`);
          chunkNumber++;
        } catch (err) {
          console.error(err);
        }
      });
    };

    // Iterate over the fileStream and send chunks
    for await (const chunk of fileStream) {
      await sendChunk(chunk);
    }

    console.log('File sent successfully');
  } catch (err) {
    console.error(err);
  }
}

module.exports = { selectAndSend };
