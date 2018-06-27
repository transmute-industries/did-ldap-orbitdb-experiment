const baseDN = process.env.LDAP_BASEDN || 'dc=example, dc=com';
const root_did_doc = require('../../__fixtures__/did/joe.bob@example.com/did_document.json');
const root_dn = `uid=${root_did_doc.id}, dc=example, dc=com`;

console.log('\nRoot DN: ', root_dn);

const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');
const ipfs = new IPFS({
  EXPERIMENTAL: {
    pubsub: true
  }
});

let orbitdb = new OrbitDB(ipfs);
let db;

let ipfsReady = false;

const waitForIPFS = () => {
  if (ipfsReady) {
    return true;
  }
  return new Promise((resolve, reject) => {
    ipfs.on('ready', () => {
      ipfsReady = true;
      resolve(ipfsReady);
    });
  });
};

const getDB = async () => {
  if (!db) {
    // await waitForIPFS();
    // console.log('initializing...');
    const access = {
      // Give write access to ourselves
      write: [orbitdb.key.getPublic('hex')]
    };
    // BEWARE...
    // const privateKey = orbitdb.key.getPrivate('hex');
    // console.log('privateKeyUsedByDB', privateKey);
    db = await orbitdb.docs(`orbit.users.${root_did_doc.id}.directory`, access);

    let maybe_root_dn = await getKey(db, root_dn);

    if (!maybe_root_dn) {
      await db.put({
        _id: root_dn,
        objectclass: ['top'],
        did: root_did_doc.id
      });
    }
  }

  // console.log('done.');

  // const all_dn = await getKeys(db);
  // console.log(all_dn);
  return db;
};

const getKey = async (db, k) => {
  let value = (await db.get(k))[0];
  // console.log('getKey ', value);
  return value;
};

const getKeys = async db => {
  return db.query(doc => doc._id).map(doc => {
    return doc._id;
  });
};

module.exports = {
  baseDN,
  waitForIPFS,
  getDB,
  getKey,
  getKeys
};

// (async () => {

//   await waitForIPFS();

//   const db = await getDB(did_document.id);

//   const root_dn = `uid=${did_document.id}, dc=example, dc=com`

//   const hash = await db.put({
//     ...did_document,
//     _id: root_dn
//   });

//   const retrieved_did_document = await getKey(db, root_dn);
//   const all_dn = await getKeys(db);

//   console.log(retrieved_did_document);
//   console.log(all_dn);
// })();
