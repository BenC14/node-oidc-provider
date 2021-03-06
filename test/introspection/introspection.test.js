'use strict';

const { agent, provider } = require('../test_helper')(__dirname);
const sinon = require('sinon');
const { expect } = require('chai');
const { encode: base64url } = require('base64url');

const route = '/token/introspection';
const AccessToken = provider.get('AccessToken');
const j = JSON.stringify;

provider.setupClient();
provider.setupClient({
  client_id: 'client-pairwise',
  client_secret: 'secret',
  subject_type: 'pairwise',
  redirect_uris: ['https://client.example.com/cb']
});
provider.setupClient({
  client_id: 'client-introspection',
  client_secret: 'secret',
  redirect_uris: [],
  response_types: [],
  grant_types: [],
});
provider.setupCerts();

describe('introspection features', function () {
  describe('enriched discovery', function () {
    it('shows the url now', function () {
      return agent.get('/.well-known/openid-configuration')
      .expect(200)
      .expect(function (response) {
        expect(response.body).to.have.property('token_introspection_endpoint').and.matches(/token\/introspect/);
      });
    });
  });

  describe('/token/introspection', function () {
    it('returns the properties for access token', function (done) {
      const at = new AccessToken({
        accountId: 'accountId',
        clientId: 'client',
        scope: 'scope',
      });

      at.save().then(function (token) {
        agent.post(route)
        .auth('client', 'secret')
        .send({
          token
        })
        .type('form')
        .expect(200)
        .expect(function (response) {
          expect(response.body).to.contain.keys('client_id', 'scope', 'sub');
          expect(response.body.sub).to.equal('accountId');
        })
        .end(done);
      });
    });

    it('returns the properties for refresh token', function (done) {
      const rt = new (provider.get('RefreshToken'))({
        accountId: 'accountId',
        clientId: 'client',
        scope: 'scope',
      });

      rt.save().then(function (token) {
        agent.post(route)
        .auth('client', 'secret')
        .send({ token })
        .type('form')
        .expect(200)
        .expect(function (response) {
          expect(response.body).to.contain.keys('client_id', 'scope', 'sub');
        })
        .end(done);
      });
    });

    it('returns the properties for client credentials token', function (done) {
      const rt = new (provider.get('ClientCredentials'))({
        clientId: 'client'
      });

      rt.save().then(function (token) {
        agent.post(route)
        .auth('client', 'secret')
        .send({ token })
        .type('form')
        .expect(200)
        .expect(function (response) {
          expect(response.body).to.contain.keys('client_id');
        })
        .end(done);
      });
    });

    it('can be called by RS clients and uses the original subject_type', function (done) {
      const rt = new (provider.get('RefreshToken'))({
        accountId: 'accountId',
        clientId: 'client-pairwise',
        scope: 'scope',
      });

      rt.save().then(function (token) {
        agent.post(route)
        .auth('client-introspection', 'secret')
        .send({ token })
        .type('form')
        .expect(200)
        .expect(function (response) {
          expect(response.body).to.contain.keys('client_id', 'scope', 'sub');
          expect(response.body.sub).not.to.equal('accountId');
        })
        .end(done);
      });
    });

    it('returns token-endpoint-like cache headers', function () {
      return agent.post(route)
      .auth('client', 'secret')
      .send({})
      .type('form')
      .expect('pragma', 'no-cache')
      .expect('cache-control', 'no-cache, no-store');
    });

    it('validates token param presence', function () {
      return agent.post(route)
      .auth('client', 'secret')
      .send({})
      .type('form')
      .expect(400)
      .expect(function (response) {
        expect(response.body).to.have.property('error', 'invalid_request');
        expect(response.body).to.have.property('error_description').and.matches(/missing required parameter.+\(token\)/);
      });
    });

    it('responds with active=false for total bs', function () {
      return agent.post(route)
      .auth('client', 'secret')
      .send({
        token: 'this is not even a token'
      })
      .type('form')
      .expect(200)
      .expect(function (response) {
        expect(response.body).to.have.property('active', false);
        expect(response.body).to.have.keys('active');
      });
    });

    it('responds with atleast what it can decode', function () {
      const fields = {
        kind: 'whateveratthisstage',
        exp: 1,
        iat: 2,
        iss: 'me',
        jti: 'id',
        scope: 'openid'
      };
      return agent.post(route)
      .auth('client', 'secret')
      .send({
        token: `${base64url(j(fields))}.`
      })
      .type('form')
      .expect(200)
      .expect(function (response) {
        delete fields.kind;
        expect(response.body).to.contain.all.keys(Object.keys(fields));
      });
    });

    it('emits on (i.e. auth) error', function () {
      const spy = sinon.spy();
      provider.once('introspection.error', spy);

      return agent.post(route)
      .auth('invalid', 'auth')
      .send({})
      .type('form')
      .expect(400)
      .expect(function () {
        expect(spy.calledOnce).to.be.true;
      });
    });
  });
});
