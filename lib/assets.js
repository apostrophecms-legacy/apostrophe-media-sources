module.exports = (self) => {
  self.pushAssets = () => {
    // self.pushAsset('stylesheet', 'user', { when: 'user' });
    self.pushAsset('script', 'improve-manager-modal', {
      when: 'user',
      preshrunk: true
    });
    self.pushAsset('script', 'media-sources-browser', {
      when: 'user',
      preshrunk: true
    });
    self.pushAsset('script', 'media-sources-preview', {
      when: 'user',
      preshrunk: true
    });
  };
};
