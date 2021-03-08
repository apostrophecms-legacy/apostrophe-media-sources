module.exports = {
  improve: 'apostrophe-images',
  moogBundle: {
    directory: 'lib/modules',
    modules: [
      'apostrophe-media-sources-unsplash',
      'apostrophe-media-sources-wedia'
    ]
  },
  construct: (self, options) => {
    require('./lib/api.js')(self, options);

    self.on('apostrophe:modulesReady', 'getAllImagesConnectorsModules', () => {
      self.buildFilters();

      self.on('apostrophe-pages:beforeSend', 'sendConnectorsToBrowser', (req) => {
        req.browserCall('apos.mediaSourceConnectors=?', JSON.stringify(self.connectors));
      });
    });

    require('./lib/routes.js')(self, options);
    require('./lib/assets.js')(self);
    require('./lib/improveCursor.js')(self);
  },
  afterConstruct: (self) => {
    self.pushAssets();
    self.addRoutes();
  }
};
