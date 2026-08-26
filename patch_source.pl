#!/usr/bin/perl
use strict;
use warnings;

for my $file (@ARGV) {
    open my $in, '<', $file or die "Cannot open $file: $!";
    my $content = do { local $/; <$in> };
    close $in;

    # Inject getOrderSource definition after eventId creation
    if ($content !~ /getOrderSource/) {
        $content =~ s/(const eventId = `ORDER_\$\{Date\.now\(\)\}_\$\{Math\.floor\(Math\.random\(\) \* 1000\)\}`;)/$1\n\n    const getOrderSource = () => {\n      const urlParams = new URLSearchParams(window.location.search);\n      if (urlParams.has('gclid')) return 'Google Ads';\n      if (urlParams.has('ttclid')) return 'TikTok Ads';\n      if (urlParams.has('fbclid')) return 'Facebook Ads';\n      const utmSource = urlParams.get('utm_source');\n      if (utmSource) return utmSource;\n      const ref = document.referrer.toLowerCase();\n      if (ref.includes('tiktok.com')) return 'TikTok Organic';\n      if (ref.includes('google.')) return 'Google Organic';\n      if (ref.includes('facebook.com') || ref.includes('instagram.com')) return 'Facebook\/Insta Organic';\n      return 'Direct \/ Libre';\n    };\n/g;
        
        $content =~ s/eventId\n\s*\}\)/eventId,\n          source: getOrderSource()\n        })/g;

        open my $out, '>', $file or die "Cannot write $file: $!";
        print $out $content;
        close $out;
        print "Patched $file\n";
    } else {
        print "Already patched $file\n";
    }
}
