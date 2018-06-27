const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');

const did_document = require('./src/__fixtures__/did/joe.bob@example.com/did_document.json');

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
};

const ipfs = new IPFS(ipfsOptions);

const waitForIPFS = () => {
  return new Promise((resolve, reject) => {
    ipfs.on('ready', () => {
      resolve(true);
    });
    // ipfs.on('error', e => console.error(e));
  });
};

const getDB = async did => {
  const orbitdb = new OrbitDB(ipfs);
  const access = {
    // Give write access to ourselves
    write: [orbitdb.key.getPublic('hex')]
  };
  // BEWARE...
  // const privateKey = orbitdb.key.getPrivate('hex');
  // console.log('privateKeyUsedByDB', privateKey);
  return await orbitdb.docs(`orbit.users.${did}.directory`, access);
};

const getKey = async (db, k) => {
  return (await db.get(k))[0];
};

const getKeys = async db => {
  return db.query(doc => doc._id).map(doc => {
    return `uid=${doc._id}, dc=example, dc=com`;
  });
};

(async () => {

  await waitForIPFS();

  const db = await getDB(did_document.id);

  const root_dn = `uid=${did_document.id}, dc=example, dc=com`

  const hash = await db.put({
    ...did_document,
    _id: root_dn
  });

  const retrieved_did_document = await getKey(db, root_dn);
  const all_dn = await getKeys(db);

  console.log(retrieved_did_document);
  console.log(all_dn);
})();
