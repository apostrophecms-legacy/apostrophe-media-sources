module.exports = {
  name: 'apostrophe-media-sources-wedia',
  label: 'Wedia',
  async construct (self, options) {
    self.pushAsset('script', 'user', { when: 'user' });

    const {
      login, password
    } = options;

    if (!login || !password) {
      self.apos.utils.warn('⚠️ You have to provide a login and password credentials in order to use their API.');
    }

    self.options.mediaSourceConnector = {
      script: {
        src: 'https://michelin-pp.wedia-group.com/asset-picker/wedia-content-picker.js',
        server: 'https://michelin-pp.wedia-group.com'
      }
    };

    self.find = () => [];

    self.choices = () => [];

    self.formatData = (file) => {
      console.log('file ===> ', require('util').inspect(file, {
        colors: true,
        depth: 2
      }));
    };

    self.download = (req, file, tempPath) => {
      const formattedFile = self.formatData(file);

      console.log('file ===> ', require('util').inspect(formattedFile, {
        colors: true,
        depth: 2
      }));
    };
  }
};
