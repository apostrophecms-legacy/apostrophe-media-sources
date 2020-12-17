const qs = require('qs');
const axios = require('axios');

module.exports = {
  name: 'apostrophe-media-sources-wedia',
  label: 'Wedia',
  async construct (self, options) {
    self.pushAsset('script', 'user', { when: 'user' });

    const { login, password, perPage = 30 } = options;

    if (!login || !password) {
      self.apos.utils.warn('⚠️ You have to provide a login and password credentials in order to use their API.');
    }

    self.options.mediaSourceConnector = {
      script: {
        src: 'https://michelin-pp.wedia-group.com/asset-picker/wedia-content-picker.js',
        name: 'WediaContentPicker',
        handler: 'attach',
        domElementName: 'el',
        params: {
          server: 'https://michelin-pp.wedia-group.com',
          onPick: function (assets) {
            console.log('assets ====> ', assets)
          }
        }
      }
    };

    self.find = async function(req, filters) {
      return [];
    };
  }
};
