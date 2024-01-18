const http = require('http');

const hostname = process.env.ACME_AGENT_HOST || 'localhost';
const port = 8021;

console.log('Agent is running on: ' + `http://${hostname}:${port}`);

function httpAsync(options, body) {
  return new Promise(function (resolve, reject) {
    const req = http
      .request(options, (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];

        let e;
        if (statusCode !== 200) {
          e = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
          e = new Error(
            'Invalid content-type.\n' +
              `Expected application/json but received ${contentType}`
          );
        }
        if (e) {
          // Consume response data to free up memory
          res.resume();
          return reject(e);
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            return resolve(parsedData);
          } catch (e) {
            return reject(e);
          }
        });
      })
      .on('error', (e) => {
        return reject(e);
      });

    if (body) {
      req.write(body || '');
    }

    req.end();
  });
}

class AgentService {
  async getStatus() {
    try {
      const response = await httpAsync({
        hostname: hostname,
        port: port,
        path: '/status',
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getConnections() {
    try {
      const response = await httpAsync({
        hostname: hostname,
        port: port,
        path: '/connections',
        method: 'GET',
      });
      return response.results;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async issueCredential() {
    const data =
      "{'connection_id': '6425ea0e-ba18-43fe-aff8-95bf8848ea0a', 'cred_def_id': 'FXd9ZjZrzGQbn2Gt2EyRLw:3:CL:113974:faber.agent.degree_schema', 'comment': 'Offer on cred def id FXd9ZjZrzGQbn2Gt2EyRLw:3:CL:113974:faber.agent.degree_schema', 'auto_remove': False, 'credential_preview': {'@type': 'https://didcomm.org/issue-credential/2.0/credential-preview', 'attributes': [{'name': 'name', 'value': 'Alice Smith'}, {'name': 'date', 'value': '2018-05-28'}, {'name': 'degree', 'value': 'Maths'}, {'name': 'birthdate_dateint', 'value': '19980204'}, {'name': 'timestamp', 'value': '1643979980'}]}, 'trace': False}";
    // console.log("At Issue Credential:", JSON.stringify(cred))
    try {
      const response = await httpAsync(
        {
          hostname: hostname,
          port: port,
          path: '/issue-credential/send-offer',
          method: 'POST',
        },
        JSON.stringify(data)
      );
      return response;
    } catch (error) {
      console.error(error);
      return {};
    }
  }
  async createInvitation(data) {
    console.log(data.my_label);
    try {
      var response = await httpAsync({
        hostname: hostname,
        port: port,
        path:
          '/connections/create-invitation?alias=' +
          encodeURIComponent(JSON.stringify(data)),
        method: 'POST',
      });
      return response;
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  async receiveInvitation(invitation) {
    try {
      const response = await httpAsync(
        {
          hostname: hostname,
          port: port,
          path: '/connections/receive-invitation',
          method: 'POST',
        },
        invitation
      );
      return response;
    } catch (error) {
      console.error(error);
      return;
    }
  }

  async removeConnection(connectionId) {
    try {
      await httpAsync({
        hostname: hostname,
        port: port,
        path: `/connections/${connectionId}/remove`,
        method: 'POST',
      });
    } catch (error) {
      console.error(error);
    } finally {
      return;
    }
  }

  async getProofRequests() {
    try {
      const response = await httpAsync({
        hostname: hostname,
        port: port,
        path: '/present-proof/records',
        method: 'GET',
      });
      return response.results;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async sendProofRequest(proofRequest) {
    try {
      await httpAsync(
        {
          hostname: hostname,
          port: port,
          path: '/present-proof/send-request',
          method: 'POST',
        },
        proofRequest
      );
    } catch (error) {
      console.error(error);
    } finally {
      return;
    }
  }
}

module.exports = new AgentService();
