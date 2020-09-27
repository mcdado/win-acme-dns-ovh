const dns = require('dns').promises
const parseDomain = require('parse-domain').parseDomain
const getNameservers = require('./get-nameservers')

const DNS_RETRY_IN_SEC = 5
const DNS_TIMEOUT_IN_SEC = 120

const ovh = require('ovh')({
  endpoint: process.env.OVH_ENDPOINT || 'ovh-eu',
  consumerKey: process.env.OVH_CUSTOMER_KEY,
  appKey: process.env.OVH_APP_KEY,
  appSecret: process.env.OVH_APP_SECRET
})

module.exports = async function createChallenge (domainToCleanup, fullRecord, challengeToken) {
  const dom = parseDomain(domainToCleanup)
  const secondLevelDomain = dom && dom.domain && dom.topLevelDomains.length ? `${dom.domain}.${dom.topLevelDomains.join('.')}` : ''
  const acmeRecord = fullRecord.substring(0, fullRecord.indexOf(secondLevelDomain) - 1)

  const options = {
    fieldType: 'TXT',
    subDomain: acmeRecord,
    target: challengeToken,
    ttl: 1
  }

  const servers = await getNameservers(secondLevelDomain)
  dns.setServers(servers)

  try {
    await ovh.requestPromised('POST', `/domain/zone/${secondLevelDomain}/record`, options)
    await ovh.requestPromised('POST', `/domain/zone/${secondLevelDomain}/refresh`)

    const timer = setInterval(async () => {
      const records = await dns.resolveTxt(fullRecord)
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
