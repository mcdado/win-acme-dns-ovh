# win-acme-dns-ovh
Scripts for [win-acme](https://www.win-acme.com) to allow DNS validation on OVH.

# Instructions

First of all, obtain credentials from OVH: https://github.com/ovh/node-ovh#login-as-a-user

Then, copy `.env.example`, rename the copy to just `.env` and fill in the values, like in this:

```sh
# example values, get yours from OVH
OVH_ENDPOINT=ovh-eu
OVH_APP_KEY=383w8gb8DkVjP36L
OVH_APP_SECRET=bNDbrEg6z6w672EZjoKJvzninym37234
OVH_CUSTOMER_KEY=d7vA2PsGef6vkVvf7y4HfzYb987e32Mx
```

Now you can setup win-acme to use these scripts for DNS-01 challenge. Here is a rough step-by-step walkthrough of the prompts from win-acme:
1. Create certificate (full options)
1. Manual input
1. Common name: [your.domain]
1. Friendly name: [Enter]
1. Create verification records **with your own scripts**
1. Path to script to create: `C:\Program Files\nodejs\node.exe` (should be your Node.js executable)
1. Delete: Using the same script
1. Create parameters: `C:\src\win-acme-dns-ovh\index.js create {Identifier} {RecordName} {Token}` (for index.js specify the directory of you local checkout)
1. Delete parameters: `C:\src\win-acme-dns-ovh\index.js delete {Identifier} {RecordName} {Token}`
1. CSR: default
1. Certificate store: according to your needs
1. Path for .pem files (in case you chose PEM encoded files above): something like `C:\etc\letsencrypt\your.domain` should be fine
1. Additional store: according to your needs
1. Installation step: according to your needs

[win-acme](https://www.win-acme.com) will take care of creating the scheduled task to automatically renew the certificate.
