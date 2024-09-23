const dns = require('dns').promises
const parseDomain = require('parse-domain').parseDomain
const debug = require('debug')('win-acme-dns-ovh:create-challenge')

const ovh = require('./ovh')
const getNameservers = require('./get-nameservers')
const sleep = require('./sleep')

const DNS_RETRY_IN_SEC = 5
const DNS_TIMEOUT_IN_SEC = 120

module.exports = async function createChallenge (domainToCleanup, fullRecord, challengeToken) {
  const resolver = new dns.Resolver()
  const dom = parseDomain(domainToCleanup)
  const secondLevelDomain = dom && dom.domain && dom.topLevelDomains.length ? `${dom.domain}.${dom.topLevelDomains.join('.')}` : ''
  const acmeRecord = fullRecord.substring(0, fullRecord.indexOf(secondLevelDomain) - 1)

  const options = {
    fieldType: 'TXT',
    subDomain: acmeRecord,
    target: challengeToken,
    ttl: 1
  }

  debug(`Getting nameservers for: ${secondLevelDomain}`)
  const servers = await getNameservers(secondLevelDomain)

  debug('Setting resolver nameservers: %o', servers)
  resolver.setServers(servers)

  async function checkDns (record) {
    try {
      debug('Check DNS: %o', record)
      const results = await resolver.resolveTxt(record)
      return results ? results.length : 0
    } catch (reason) {
      if (reason.code === 'ENOTFOUND') {
        return 0
      }
      console.error('DNS check failed, reason: %o', reason.code)
      throw reason
    }
  }

  try {
    debug(`Creating record for server ${secondLevelDomain}: %o`, options)
    const results = await ovh.requestPromised('POST', `/domain/zone/${secondLevelDomain}/record`, options)
    debug('API response: %o', results)

    debug('Refreshing records')
    await ovh.requestPromised('POST', `/domain/zone/${secondLevelDomain}/refresh`)

    sleep(DNS_TIMEOUT_IN_SEC * 1000).then(() => {
      debug(`DNS timed out after ${DNS_TIMEOUT_IN_SEC} seconds, exiting...`)
      console.error(`DNSTIMEOUT ${DNS_TIMEOUT_IN_SEC} seconds: ${fullRecord}`)
      process.exit(1)
    })

    let records = 0

    do {
      debug(`Waiting ${DNS_RETRY_IN_SEC} seconds...`)
      await sleep(DNS_RETRY_IN_SEC * 1000)

      records = await checkDns(fullRecord)
      debug(`DNS check returned ${records} records`)
    } while (records === 0)

    debug(`Done creating ${fullRecord} record.`)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
