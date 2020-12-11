const qs = require('qs');
const axios = require('axios');

module.exports = {
  name: 'apostrophe-media-sources-wedia',
  label: 'Wedia',
  construct (self, options) {
    const { login, password, perPage = 30 } = options;

    if (!login || ! password) {
      self.apos.utils.warn('⚠️ You have to provide a login and password credentials in order to use their API.');
    }

    self.options.mediaSourceConnector = {
      standardFilters: [
        {
          name: 'orientation',
          dependsOn: [ 'search' ]
        },
        {
          name: 'search'
        }
      ],
      totalResults: 5000,
      perPage: (perPage < 10 || perPage > 30) ? 30 : perPage
    };

    self.find = async function(req, filters) {
      const { data: auth } = await axios({
        method: 'post',
        url: `https://michelin-pp.wedia-group.com/api/rest/signin`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify({
          login: 'anthony@apostrophecms.com',
          password: 'Michelin2020!'
        })
      });

      //TODO: pass an Axios GET request to find images with headers: { Authorization: `${auth.tokenType} ${auth.accessToken}` }

      return [];
    };
  }
};
