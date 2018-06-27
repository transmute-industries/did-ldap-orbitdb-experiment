const path = require('path');
const ldap = require('ldapjs');
const server = require('../server');
const openpgp = require('openpgp');
const Promise = require('bluebird');
const utils = require('ethereumjs-util');
const Wallet = require('ethereumjs-wallet');
const fs = Promise.promisifyAll(require('fs'));

const _sodium = require('libsodium-wrappers');

const port = 1389;

const EMAIL = 'joe.bob@example.com';
const PASSPHRASE = 'its a good day to die.';
const DID_DOC = require(`../../__fixtures__/did/${EMAIL}/did_document.json`);

let sodium;

const { waitForIPFS } = require('../dbi/orbitdb');
describe('did-directory-example', () => {
  let client;

  beforeAll(async done => {
    await _sodium.ready;
    sodium = _sodium;
    await waitForIPFS();
    server.listen(port, () => {
      console.log('LDAP server up at: %s', server.url);
      done();
    });
  });

  it('bind', async () => {
    client = ldap.createClient({
      url: 'ldap://127.0.0.1:' + port
    });

    const armoredPrivateKey = (await fs.readFileAsync(
      path.join(__dirname, `../../__fixtures__/did/${EMAIL}/sec_private.key`)
    )).toString();

    const secPrivKey = openpgp.key.readArmored(armoredPrivateKey).keys[0];
    await secPrivKey.decrypt(PASSPHRASE);
    const secPrivKeyPrimaryKey = secPrivKey.primaryKey;
    const privateKeyHex = sodium.to_hex(secPrivKeyPrimaryKey.params[2].data);
    const wallet = Wallet.fromPrivateKey(new Buffer(privateKeyHex, 'hex'));
    const wallet_address = '0x' + wallet.getAddress().toString('hex');

    const msg = 'hello'; // this should be sha3(of latest block + 'spicy salt')
    const msg_hash = utils.sha3(msg);

    const { v, r, s } = utils.ecsign(msg_hash, wallet._privKey);

    const credentials = JSON.stringify({
      msg_hash: msg_hash.toString('hex'),
      v: v.toString(),
      r: r.toString('hex'),
      s: s.toString('hex')
    });

    return new Promise((resolve, reject) => {
      client.bind(`uid=${DID_DOC.id}, dc=example, dc=com`, credentials, err => {
        if (err) {
          reject(err);
        }
        resolve(true);
      });
    });
  });

  afterAll(done => {
    server.close();
  });
});
