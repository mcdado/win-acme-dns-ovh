const util = require('util')
const parseDomain = require('parse-domain')

const ovh = require('ovh')({
  endpoint: process.env.OVH_ENDPOINT || 'ovh-eu',
  consumerKey: process.env.OVH_CUSTOMER_KEY,
  appKey: process.env.OVH_APP_KEY,
  appSecret: process.env.OVH_APP_SECRET
})

module.exports = async function deleteChallenge (domainToValidate) {
  const domain = parseDomain(domainToValidate)
  const secondLevelDomain = domain && domain.domain && domain.tld ? `${domain.domain}.${domain.tld}` : ''
  const acmeRecord = domain && domain.subdomain ? `_acme-challenge.${domain.subdomain}` : '_acme-challenge'

  const ovhRequest = util.promisify(ovh.request)

  const options = {
    fieldType: 'TXT',
    subDomain: `${acmeRecord}`
  }

  try {
    const records = await ovhRequest('POST', `/domain/zone/${secondLevelDomain}/record`, options)
    if (records.length < 1) {
      process.exit(0)
    }
    await ovhRequest('DELETE', `/domain/zone/${secondLevelDomain}/record/${records[0]}`)
    await ovhRequest('POST', `/domain/zone/${secondLevelDomain}/refresh`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
