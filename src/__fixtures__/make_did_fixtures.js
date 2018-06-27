const path = require('path');
const mkdirp = require('mkdirp-promise');
const openpgp = require('openpgp');
const utils = require('ethereumjs-util');
const Wallet = require('ethereumjs-wallet');
const _sodium = require('libsodium-wrappers');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
let sodium;

const make_did = async (name, email, passphrase) => {
  const DID_OUTPUT_DIR = path.join(__dirname, '../__fixtures__/did/' + email);
  await mkdirp(DID_OUTPUT_DIR);

  await _sodium.ready;
  sodium = _sodium;

  // Generate and decrypt a new secp256k1 pgp key
  const secOptions = {
    userIds: [
      {
        name: name,
        email: email
      }
    ],
    curve: 'secp256k1',
    passphrase: passphrase
  };

  const secKeyPair = await openpgp.generateKey(secOptions);
  const secPrivKey = openpgp.key.readArmored(secKeyPair.privateKeyArmored)
    .keys[0];
  await secPrivKey.decrypt(passphrase);
  const secPrivKeyPrimaryKey = secPrivKey.primaryKey;
  const privateKeyHex = sodium.to_hex(secPrivKeyPrimaryKey.params[2].data);
  const wallet = Wallet.fromPrivateKey(new Buffer(privateKeyHex, 'hex'));
  const wallet_address = '0x' + wallet.getAddress().toString('hex');

  const secRecoveryKeyPair = await openpgp.generateKey(secOptions);
  const secRecoveryPrivKey = openpgp.key.readArmored(secRecoveryKeyPair.privateKeyArmored)
    .keys[0];
  await secRecoveryPrivKey.decrypt(passphrase);



  // edPrivKey trusts secPrivKey
  const trustedSec = await secPrivKey.toPublic().signPrimaryUser([secRecoveryPrivKey]);

  // edPrivKey trusts edPrivKey
  const trustedRecoverySec = await secRecoveryPrivKey.toPublic().signPrimaryUser([secPrivKey]);

  // make sure to lock the private keys before exporting them!
  await secPrivKey.encrypt(passphrase);
  await secRecoveryPrivKey.encrypt(passphrase);

  // Exporting armored public keys
  await fs.writeFileAsync(
    path.join(DID_OUTPUT_DIR, 'sec_public_key.asc'),
    secPrivKey.toPublic().armor()
  );
  await fs.writeFileAsync(
    path.join(DID_OUTPUT_DIR, 'sec_recovery_public_key.asc'),
    secRecoveryPrivKey.toPublic().armor()
  );

  // Exporting private keys
  await fs.writeFileAsync(
    path.join(DID_OUTPUT_DIR, 'sec_private.key'),
    secPrivKey.armor()
  );
  await fs.writeFileAsync(
    path.join(DID_OUTPUT_DIR, 'sec_recovery_private.key'),
    secRecoveryPrivKey.armor()
  );

  const did = 'did:eth:' + wallet_address;

  await fs.writeFileAsync(
    path.join(DID_OUTPUT_DIR, 'did_document.json'),
    JSON.stringify(
      {
        '@context': 'https://w3id.org/did/v1',
        id: did,
        publicKey: [
          {
            id: `${did}#keys-1`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            publicKeyPem: secPrivKey.toPublic().armor()
          }
        ],
        authentication: [
          {
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: `${did}#keys-1`
          }
        ]
      },
      null,
      2
    )
  );
};

(async () => {
  await make_did('Test User', 'test@example.com', 'it is a good day to die.');
})();
