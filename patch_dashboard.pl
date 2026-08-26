#!/usr/bin/perl
use strict;
use warnings;

my $file = "src/Dashboard.tsx";
open my $in, '<', $file or die "Cannot open $file: $!";
my $content = do { local $/; <$in> };
close $in;

# Table 1
$content =~ s/(<th className="p-4 font-bold text-slate-600 text-sm">Prix \(DA\)<\/th>\s*<\/tr>)/<th className="p-4 font-bold text-slate-600 text-sm">Prix (DA)<\/th>\n                          <th className="p-4 font-bold text-slate-600 text-sm">Source<\/th>\n                        <\/tr>/;
$content =~ s/(<td className="p-4 font-black text-emerald-600">\{order\.price\}<\/td>\s*<\/tr>)/<td className="p-4 font-black text-emerald-600">{order.price}<\/td>\n                            <td className="p-4 text-xs font-bold text-slate-500">{order.source || 'Direct \/ Libre'}<\/td>\n                          <\/tr>/;

# Table 2 (It will match the second one now)
$content =~ s/(<th className="p-4 font-bold text-slate-600 text-sm">Prix \(DA\)<\/th>\s*<\/tr>)/<th className="p-4 font-bold text-slate-600 text-sm">Prix (DA)<\/th>\n                            <th className="p-4 font-bold text-slate-600 text-sm">Source<\/th>\n                          <\/tr>/;
$content =~ s/(<td className="p-4 font-black text-emerald-600">\{order\.price\}<\/td>\s*<\/tr>)/<td className="p-4 font-black text-emerald-600">{order.price}<\/td>\n                              <td className="p-4 text-xs font-bold text-slate-500">{order.source || 'Direct \/ Libre'}<\/td>\n                            <\/tr>/;

# Table 3 (DHD)
$content =~ s/(<th className="p-4 font-bold text-slate-600 text-sm">Lieu & Prix<\/th>)/<th className="p-4 font-bold text-slate-600 text-sm">Lieu & Prix<\/th>\n                          <th className="p-4 font-bold text-slate-600 text-sm">Source<\/th>/;

$content =~ s/(className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 w-full"\s*\/>\s*<\/div>\s*<\/td>)/$1\n\n                              <td className="p-4 text-xs font-bold text-slate-500 whitespace-nowrap">\n                                {order.source || 'Direct \/ Libre'}\n                              <\/td>/;

open my $out, '>', $file or die "Cannot write $file: $!";
print $out $content;
close $out;
print "Patched $file\n";
