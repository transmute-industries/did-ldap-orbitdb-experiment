#!/usr/bin/perl
use strict;
use warnings;
use Net::LDAP::Util qw/canonical_dn/;
foreach my $dn (@ARGV) {
   if (!defined(canonical_dn($dn))) { print "not well formed: $dn\n"; }
   else                             { print "well formed: $dn\n"; }
}