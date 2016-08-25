const fetch = require('isomorphic-fetch');
'use strict';

const store = new Map();
const logins = new Map();
const uuid = require('uuid');

class Account {
  constructor(id) {
    this.accountId = id || uuid.v4();
    store.set(this.accountId, this);
  }

  claims() {
    return {
      address: {
        country: '000',
        formatted: '000',
        locality: '000',
        postal_code: '000',
        region: '000',
        street_address: '000',
      },
      birthdate: '1987-10-16',
      email: 'johndoe@example.com',
      email_verified: false,
      family_name: 'Doe',
      gender: 'male',
      given_name: 'John',
      locale: 'en-US',
      middle_name: 'Middle',
      name: 'John Doe',
      nickname: 'Johny',
      phone_number: '+49 000 000000',
      phone_number_verified: false,
      picture: 'http://lorempixel.com/400/200/',
      preferred_username: 'Jdawg',
      profile: 'https://johnswebsite.com',
      sub: this.accountId,
      updated_at: 1454704946,
      website: 'http://example.com',
      zoneinfo: 'Europe/Berlin',
    };
  }

  static findByAtkLogin(loginBody) {
    const myToken = `+z7IaZOGGSacErDBdgsQejfg2QDdbZb32O1FlVBimw/JchSz+mOaVQany7L9YoFL0+D2r/VeNWAEYR5e9yaPDA==`;
    var myInit = {
      method: 'POST',
      headers: {
	//'X-Auth-Token': myToken,
	'Authorization': `Token token="${myToken}", client="atk"`,
        'Content-Type': 'application/json'
      },
      body: `{
	"email": "${loginBody.login}",
	"password": "${loginBody.password}"
    }`
    };

    const url = 'http://www-test.americastestkitchen.com:3000/api/v4/sign_in?site_key=atk';
  return (
    fetch(url, myInit)
      .then(function(response) {
	return response.json();
      })
      .catch(function(error) {
        console.error(error);
      })
    );
  }


  static findByLogin(login) {
    if (!logins.get(login)) {
      logins.set(login, new Account());
    }

    return Promise.resolve(logins.get(login));
  }

  static findById(id) {
    if (!store.get(id)) new Account(id); // eslint-disable-line no-new
    return Promise.resolve(store.get(id));
  }
}

module.exports = Account;
