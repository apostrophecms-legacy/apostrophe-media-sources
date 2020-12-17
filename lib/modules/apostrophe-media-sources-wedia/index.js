module.exports = {
  name: 'apostrophe-media-sources-wedia',
  label: 'Wedia',
  async construct (self, options) {
    self.pushAsset('script', 'user', { when: 'user' });

    self.options.mediaSourceConnector = {
      script: options.script
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
