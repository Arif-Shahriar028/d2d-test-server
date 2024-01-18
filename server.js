const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const files = require('./utils/decodeFiles');
const sendFiles = require('./utils/sendFiles');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const exphbs = require('express-handlebars');
const helpers = require('handlebars-helpers');
const agentService = require('./services/AgentService');
const qr = require('qrcode');
const fs = require('node:fs');
const axios = require('axios');

global.connectionStatus = null;
global.credDef = null;
global.credStatus = null;
global.proofStatus = null;
global.retrievedAttribute = null;

var app = express();
const port = 9999;

const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: 'thisismysecrctekeyfhrgfgrfrty84fwir767',
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

app.set('view engine', 'hbs');

app.engine(
  'hbs',
  exphbs.engine({
    extname: 'hbs',
    defaultView: 'default',
    layoutsDir: path.join(__dirname, '/views/layouts/'),
    partialsDir: [
      path.join(__dirname, '/views/partials'),
      path.join(__dirname, '/views/partials/connection'),
      path.join(__dirname, '/views/partials/home'),
      path.join(__dirname, '/views/partials/proof'),
    ],
    helpers: helpers(['array', 'comparison']),
  })
);

// unless using body-parser,
// json data is shown as undefined in terminal
// app.use(express.limit('20mb'));
app.set('view engine', 'ejs');
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ extended: true, lilmit: '200mb' }));
app.use(cookieParser());

app.get('/', (req, res) => {
  // res.send('<h1>Hello Arif, How are you</h1>');
  res.render('ssi');
});

app.get('/ssi', (req, res) => {
  res.render('ssi');
});

app.get('/create-invitation', (req, res) => {
  res.sendFile(__dirname + '/views/create-invitation.html');
});

app.get('/newCon', async function (req, res) {
  console.log('At newConn!');
  console.log(req.body.inputData);
  const data = {
    my_label: 'Web.Agent',
    // service_endpoint: req.body.inputData,
  };
  // ('https://1a33-157-119-48-40.ngrok-free.app');
  const invitation = await agentService.createInvitation(data);
  const id = invitation['connection_id'];
  const invitationData = invitation['invitation'];
  console.log('Returned id:', id);
  if (invitation) {
    // invitation.invitation = JSON.stringify(invitation.invitation, null, 4);
    const inviteURL = JSON.stringify(invitation['invitation_url'], null, 4);
    console.log('Body: ', inviteURL);
    qr.toDataURL(inviteURL, (err, src) => {
      //if (err) res.send("Error occured");
      res.render('invitation', { src, id, invitationData });
    });
  }
});

app.get('/newConData', (req, res) => {
  res.render('invitationData');
});

app.get('/receive-invitation', (req, res) => {
  res.sendFile(__dirname + '/views/receive-invitation.html');
});

app.get('/activeCon', async (req, res) => {
  console.log('Now at active Connection...');
  const response = await agentService.getConnections();

  if (response) {
    const activeConnections = response.filter(
      (connection) => connection.state === 'active'
    );
    console.log(
      'response: \n' +
        JSON.stringify(
          activeConnections[activeConnections.length - 1].connection_id
        )
    );
  }
  res.render('activeCon');
});

app.post('/handle-invitation-data', async (req, res) => {
  const invitation = req.body.inputData;
  const response = await agentService.receiveInvitation(invitation);
  if (response) {
    console.log(`agent accept: \n` + JSON.stringify(response));
    res.redirect('http://localhost:9999/send-files');
  } else {
    res.status(500).send('Internal Server Error');
  }
});

app.get('/send-files', async function (req, res) {
  res.sendFile(__dirname + '/views/send-files.html');
});

app.get('/agent/send-files', async function (req, res) {
  const response = await agentService.getConnections();
  const activeConnections = response.filter(
    (connection) => connection.state === 'active'
  );
  sendFiles.selectAndSend(
    '8021',
    activeConnections[activeConnections.length - 1].connection_id
  );
  res.send('<h2>Select and send!</h2>');
});

app.get('/alice/send-files', async function (req, res) {
  const response = await agentService.getConnections();
  sendFiles.selectAndSend('8031', response[0].connectionID);
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
