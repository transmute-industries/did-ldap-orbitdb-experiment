const baseDN = process.env.LDAP_BASEDN || 'dc=example, dc=com';
const root_did_doc = require('../../__fixtures__/did/joe.bob@example.com/did_document.json');
const root_dn = `uid=${root_did_doc.id}, dc=example, dc=com`;

console.log('\nRoot DN: ', root_dn);

let db;
const getDB = async () => {
  if (!db) {
    db = {
      [root_dn]: {
        objectclass: ['top'],
        did: root_did_doc.id
      }
    };
  }

  // const all_dn = await getKeys(db);
  // console.log(all_dn);
  return db;
};

const getKey = async (db, k) => {
  let value = db[k];
  // console.log('getKey ', value);
  return value;
};

const getKeys = async db => {
  return Object.keys(db);
};

module.exports = {
  baseDN,
  getDB,
  getKey,
  getKeys
};

// const IPFS = require('ipfs');
// const OrbitDB = require('orbit-db');

// const ipfsOptions = {
//   EXPERIMENTAL: {
//     pubsub: true
//   }
// };

// const ipfs = new IPFS(ipfsOptions);

// const root_did_doc = require('../__fixtures__/did/joe.bob@example.com/did_document.json');
// const root_dn = `uid=${root_did_doc.id}, dc=example, dc=com`;

// const db = {
//   [root_dn]: {
//     objectclass: ['top'],
//     did: root_did_doc.id
//   }
// };

// const getDB = async () => {
//   return new Promise((resolve, reject) => {
//     ipfs.on('ready', async () => {
//       const orbitdb = new OrbitDB(ipfs);
//       const access = {
//         // Give write access to ourselves
//         write: [orbitdb.key.getPublic('hex')]
//       };
//       const db = await orbitdb.keyvalue('directory.' + root_did_doc.id, access);
//       const maybe_root_dn = await db.get(root_dn);
//       if (!maybe_root_dn) {
//         console.log('no root_dn... creating..');
//         await db.set(root_dn, {
//           objectclass: ['top'],
//           did: root_did_doc.id
//         });
//       } else {
//         console.log('root_dn.. exists');
//       }
//       resolve(db);
//     });

//     ipfs.on('error', e => {
//       reject(e);
//     });
//   });
// };

// const getDN = async dn => {
//   const db = await getDB();
//   return await db.get(dn);
// };
