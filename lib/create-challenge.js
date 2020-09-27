const dns = require('dns').promises
const util = require('util')
const parseDomain = require('parse-domain')
const getNameservers = require('./get-nameservers')

const DNS_RETRY_IN_SEC = 5
const DNS_TIMEOUT_IN_SEC = 120

const ovh = require('ovh')({
  endpoint: process.env.OVH_ENDPOINT || 'ovh-eu',
  consumerKey: process.env.OVH_CUSTOMER_KEY,
  appKey: process.env.OVH_APP_KEY,
  appSecret: process.env.OVH_APP_SECRET
})

module.exports = async function createChallenge (fullRecord, challengeToken) {
  const domain = parseDomain(fullRecord)
  const secondLevelDomain = domain && domain.domain && domain.tld ? `${domain.domain}.${domain.tld}` : ''
  const acmeRecord = domain && domain.subdomain ? domain.subdomain : '_acme-challenge'

  const options = {
    fieldType: 'TXT',
    subDomain: `${acmeRecord}`,
    target: challengeToken,
    ttl: 1
  }

  const servers = await getNameservers(secondLevelDomain)
  dns.setServers(servers)

  const ovhRequest = util.promisify(ovh.request)

  try {
    await ovhRequest('POST', `/domain/zone/${secondLevelDomain}/record`, options)
    await ovhRequest('POST', `/domain/zone/${secondLevelDomain}/refresh`)

    const timer = setInterval(() => {
      const records = dns.resolveTxt(`${acmeRecord}.${secondLevelDomain}`)
      if (records && records.length > 0) {
        clearInterval(timer)
        process.exit(0)
      }
    }, DNS_RETRY_IN_SEC)

    setTimeout(() => {
      clearInterval(timer)
      process.exit(0)
    }, Number(DNS_TIMEOUT_IN_SEC * 1000))
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
