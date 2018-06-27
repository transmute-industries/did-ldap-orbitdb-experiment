const ldap = require('ldapjs');
const fs = require('fs');
const path = require('path');
const utils = require('ethereumjs-util');

const server = ldap.createServer();

const { baseDN, getDB, getKey, getKeys } = require('./dbi/orbitdb');

server.search('', (req, res, next) => {
  var baseObject = {
    dn: '',
    structuralObjectClass: 'OpenLDAProotDSE',
    configContext: 'cn=config',
    attributes: {
      objectclass: ['top', 'OpenLDAProotDS'],
      namingContexts: [baseDN],
      supportedLDAPVersion: ['3'],
      subschemaSubentry: ['cn=Subschema']
    }
  };
  // For Debugging.
  // console.log(
  //   'scope ' +
  //     req.scope +
  //     ' filter ' +
  //     req.filter +
  //     ' baseObject ' +
  //     req.baseObject
  // );
  //log.info('scope: ' + req.scope);
  //log.info('filter: ' + req.filter.toString());
  //log.info('attributes: ' + req.attributes);
  if (
    'base' == req.scope &&
    '(objectclass=*)' == req.filter.toString() &&
    req.baseObject == ''
  ) {
    res.send(baseObject);
  }

  res.end();
  return next();
});

server.search('cn=Subschema', (req, res, next) => {
  var schema = {
    dn: 'cn=Subschema',
    attributes: {
      objectclass: ['top', 'subentry', 'subschema', 'extensibleObject'],
      cn: ['Subschema']
    }
  };
  res.send(schema);
  res.end();
  return next();
});

server.bind(baseDN, async (req, res, next) => {
  var dn = req.dn.toString();
  const db = await getDB();
  if (!(await getKey(db, dn))) return next(new ldap.NoSuchObjectError(dn));
  // we require did to authenticate
  if (!(await getKey(db, dn)).did) {
    return next(new ldap.NoSuchAttributeError('did'));
  }

  let { msg_hash, v, r, s } = JSON.parse(req.credentials);

  const pubKey = utils.ecrecover(
    Buffer.from(msg_hash, 'hex'),
    parseInt(v),
    Buffer.from(r, 'hex'),
    Buffer.from(s, 'hex')
  );

  const addr = '0x' + utils.pubToAddress(pubKey).toString('hex');
  const did_address = (await getKey(db, dn)).did.split(':')[2];

  if (did_address !== addr) {
    return next(new ldap.InvalidCredentialsError());
  }

  res.end();
  return next();
});

server.search(baseDN, async (req, res, next) => {
  var dn = req.dn.toString();
  const db = await getDB();

  if (!(await getKey(db, dn))) return next(new ldap.NoSuchObjectError(dn));

  var scopeCheck;

  switch (req.scope) {
    case 'base':
      const value = await getKey(db, dn);
      // console.log(value)
      if (req.filter.matches(value)) {
        res.send({
          dn: dn,
          attributes: value
        });
      }

      res.end();
      return next();

    case 'one':
      scopeCheck = function(k) {
        if (req.dn.equals(k)) return true;
        var parent = ldap.parseDN(k).parent();
        return parent ? parent.equals(req.dn) : false;
      };
      break;

    case 'sub':
      scopeCheck = function(k) {
        return req.dn.equals(k) || req.dn.parentOf(k);
      };

      break;
  }

  const keys = await getKeys(db);
  // console.log(keys)
  await Promise.all(
    keys.map(async key => {
      if (!scopeCheck(key)) return;
      const value = await getKey(db, key);
      // console.log(value)
      if (req.filter.matches(value)) {
        res.send({
          dn: key,
          attributes: value
        });
      }
    })
  );

  res.end();
  return next();
});

module.exports = server;

// Handle delete...
// ldapdelete -x -H ldap://localhost:1389 'cn=John Doe, dc=example, dc=com'
// server.del('cn=John Doe, dc=example, dc=com', function(req, res, next) {
//   console.log('DN: ' + req.dn.toString());
//   res.end();
// });

// // Handle add...
// //
// server.add('dc=example, dc=com', function(req, res, next) {
//   console.log('DN: ' + req.dn.toString());
//   res.end();
// });

// setTimeout(() => {
//   var client = ldap.createClient({
//     url: 'ldap://127.0.0.1:1389'
//   });

//   var entry = {
//     cn: 'foo',
//     sn: 'bar',
//     email: ['foo@example.com', 'foo1@bar.com'],
//     objectclass: 'fooPerson'
//   };

//   client.add('dc=example, dc=com', entry, function(err) {
//     console.log('CREATED');
//     console.log(err);
//   });

//   client.del('cn=John Doe, dc=example, dc=com', function(err) {
//     console.log('DELETED');
//     console.log(err);
//   });

//   var opts = {
//     filter: '(&(email=*@example.com))',
//     scope: 'sub',
//     paged: true,
//     sizeLimit: 200
//   };

//   client.search(baseDN, opts, function(err, res) {

//     res.on('searchEntry', function(entry) {
//       // do per-entry processing
//     });

//     res.on('page', function(result) {
//       console.log('page end');
//     });
//     res.on('error', function(resErr) {
//       console.log(resErr)
//       // assert.ifError(resErr);
//     });
//     res.on('end', function(result) {
//       console.log('done ');
//     });
//   });
// }, 500);
