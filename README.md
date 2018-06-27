# DID LDAP IPFS / OrbitDB

This is an experiment combining decentralized identity (did-spec), decentralized database technology (orbitdb/ipfs), ldap and OpenPGP.

In this demo, we show how to create a DID Document, how to use digital signature to authenticate that identity with an ldap server, and how to store the data used by ldap in ipfs, via orbitdb.

[Austin Ethereum Meetup Deck](https://docs.google.com/presentation/d/1TKb11-qIIKL_7eHTfm875KmoVA1xyV7LuEEBfMjkczs)

### Getting Started

```
# for IPFS
docker-compose up

# for the LDAP Server
npm i
npm run test
node ./orbit-example.js
node ./src/ldap-server/run.js 
```

## Learning

- http://directory.apache.org/studio/
- https://github.com/phaus/shadow-ldap
- http://ldapjs.org/guide.html
- http://www.zytrax.com/books/ldap/
- https://www.youtube.com/watch?v=5hMTi8NZyaI
- https://w3c-ccg.github.io/did-spec/


### Some Sample Output

```
Root DN:  uid=did:eth_eoa:0x18c8733ce5ddce05674888c970f659ab88a01ff9, dc=example, dc=com
Using the following db:
LDAP server up at: ldap://0.0.0.0:1389
{ objectclass: [ 'top' ],
  did: 'did:eth_eoa:0x18c8733ce5ddce05674888c970f659ab88a01ff9' }
[ 'uid=did:eth_eoa:0x18c8733ce5ddce05674888c970f659ab88a01ff9, dc=example, dc=com' ]
{ objectclass: [ 'top' ],
  did: 'did:eth_eoa:0x18c8733ce5ddce05674888c970f659ab88a01ff9' }
{ objectclass: [ 'top' ],
  did: 'did:eth_eoa:0x18c8733ce5ddce05674888c970f659ab88a01ff9' }
```