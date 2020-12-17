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

    self.download = (req, file, tempPath) => {

    };
  }
};
