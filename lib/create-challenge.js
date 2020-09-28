const dns = require('dns').promises
const parseDomain = require('parse-domain').parseDomain
const getNameservers = require('./get-nameservers')
const sleep = require('./sleep')

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

  function checkDns (record) {
    return dns.resolveTxt(record)
      .then((results) => results ? results.length : 0)
      .catch(async (reason) => {
        if (reason.code === 'ENOTFOUND') {
          await sleep(DNS_RETRY_IN_SEC * 1000)
          return 0
        }
        throw reason
      })
  }

  try {
    await ovh.requestPromised('POST', `/domain/zone/${secondLevelDomain}/record`, options)
    await ovh.requestPromised('POST', `/domain/zone/${secondLevelDomain}/refresh`)

    sleep(DNS_TIMEOUT_IN_SEC * 1000).then(() => {
      console.error(`DNSTIMEOUT ${DNS_TIMEOUT_IN_SEC} seconds: ${fullRecord}`)
      process.exit(1)
    })

    let records = 0

    do {
      records = await checkDns(fullRecord)
    } while (records === 0)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
