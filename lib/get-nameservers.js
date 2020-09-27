const dns = require('dns').promises

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
