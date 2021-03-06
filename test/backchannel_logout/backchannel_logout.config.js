'use strict';

const _ = require('lodash');
const cert = require('../default.sig.key');
const config = _.clone(require('../default.config'));

config.features = { sessionManagement: true, backchannelLogout: true };

module.exports = {
  config,
  client: {
    client_id: 'client',
    client_secret: 'secret',
    response_types: ['id_token'],
    grant_types: ['implicit'],
    redirect_uris: ['https://client.example.com/cb'],
    backchannel_logout_uri: 'https://client.example.com/backchannel_logout'
  },
  certs: [cert],
};
