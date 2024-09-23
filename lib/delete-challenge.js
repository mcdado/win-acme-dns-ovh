const debug = require('debug')('win-acme-dns-ovh:delete-challenge')
const parseDomain = require('parse-domain').parseDomain

const ovh = require('./ovh')

module.exports = async function deleteChallenge (domainToValidate, fullRecord, challengeToken) {
  const dom = parseDomain(domainToValidate)
  const secondLevelDomain = dom && dom.domain && dom.topLevelDomains.length ? `${dom.domain}.${dom.topLevelDomains.join('.')}` : ''
  const acmeRecord = fullRecord.substring(0, fullRecord.indexOf(secondLevelDomain) - 1)

  try {
    const options = {
      fieldType: 'TXT',
      subDomain: `${acmeRecord}`
    }

    let records = null
    let counter = 0

    do {
      debug(`Checking record for ${secondLevelDomain}: %o`, options)
      const results = await ovh.requestPromised('GET', `/domain/zone/${secondLevelDomain}/record`, options)
      debug('API response %o', results)

      if (results.length > 0) {
        debug(`Deleting record for ${secondLevelDomain}: %o`, results[0])
        await ovh.requestPromised('DELETE', `/domain/zone/${secondLevelDomain}/record/${results[0]}`)
        debug('Refreshing records')
        await ovh.requestPromised('POST', `/domain/zone/${secondLevelDomain}/refresh`)
      }
      records = results.length - 1
      counter += 1
    } while (records > 0)
    debug(`Done deleting ${counter} records.`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
