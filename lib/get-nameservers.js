const dns = require('dns').promises

// Set a third-party (Cloudflare) as authority in resolving NS records.
// This avoids a local DNS taking over resolving NS records.
dns.setServers([
  '1.1.1.1',
  '[2606:4700:4700::1111]',
  '1.0.0.1',
  '[2606:4700:4700::1001]'
])

module.exports = async function getNameservers (domain) {
  let ipList = []

  try {
    const nsRecords = await dns.resolveNs(domain)

    ipList = await Promise.all(nsRecords.map(async (nsHostname) => {
      let ip = null

      try {
        ip = await dns.resolve(nsHostname)
      } catch (err) {
        console.warn(err)
      }

      return ip.length ? ip[0] : null
    }))
  } catch (err) {
    console.error(err)
  }

  return ipList
}
