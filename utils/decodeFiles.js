const fs = require('fs');

async function decodeFile(jsonData) {
    const dataArr = jsonData.content.split('::');
    const file_name = dataArr[0];
    const base64 = dataArr[1];

    const chunkSize = 99999; // 1 Megabyte
    const decodedData = Buffer.from(base64, 'base64');

    for (let i = 0; i < decodedData.length; i += chunkSize) {
        const chunkEnd = i + chunkSize < decodedData.length ? i + chunkSize : decodedData.length;
        const chunk = Buffer.alloc(chunkEnd - i);
        decodedData.copy(chunk, 0, i, chunkEnd);

        try {
            // Use async/await with fs.promises.writeFile for asynchronous file writing
            await fs.writeFile(`received-files/${file_name}`, chunk, { flag: 'a' });
            console.log(`Chunk written successfully`);
        } catch (err) {
            console.error('Error writing chunk to file:', err);
        }
    }
}

module.exports = { decodeFile };
