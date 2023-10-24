const parseDomain = require('parse-domain').parseDomain

const ovh = require('./ovh')

module.exports = async function deleteChallenge(domainToValidate, fullRecord, challengeToken) {
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
      const results = await ovh.requestPromised('GET', `/domain/zone/${secondLevelDomain}/record`, options)
      if (results.length > 0) {
        try {
          await ovh.requestPromised('DELETE', `/domain/zone/${secondLevelDomain}/record/${results[0]}`)
        } catch (reason) {
          // Temporary workaround for changes in OVH APIs and current library
          if (reason.error === 204) { /* no-op */ }
        }
        try {
          await ovh.requestPromised('POST', `/domain/zone/${secondLevelDomain}/refresh`)
        } catch (reason) {
          // Temporary workaround for changes in OVH APIs and current library
          if (reason.error === 204) { /* no-op */ }
        }
      }
      records = results.length - 1
      counter += 1
    } while (records > 0)
    console.log(`Done deleting ${counter} records.`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
