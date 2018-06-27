const server = require('./server');
const port = process.env.LDAP_PORT || 1389;
// ///--- Fire it up
server.listen(port, function() {
  console.log('Using the following db:');
//   console.log(JSON.stringify(db, null, 2));
  console.log('LDAP server up at: %s', server.url);
});
