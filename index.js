module.exports = {
  improve: 'apostrophe-images',
  moogBundle: {
    directory: 'lib/modules',
    modules: [
      'apostrophe-images-connector-unsplash'
    ]
  },
  construct: function(self, options) {
    self.on('apostrophe:modulesReady', 'getAllImagesConnectorsModules', () => {
      // Find all images connectors defined in app configuration
      const connectors = Object.values(self.apos.modules)
        .reduce((connectors, moduleConfig) => {
          return !moduleConfig.options.mediaSourceConnector
            ? connectors
            : [
              ...connectors,
              {
                label: moduleConfig.options.label,
                ...moduleConfig.options.mediaSourceConnector
              }
            ];
        }, []);

      self.on('apostrophe-pages:beforeSend', 'sendConnectorsToBrowser', async (req) => {
        req.browserCall('apos.mediaSourceConnectors=?', JSON.stringify(connectors));
      });
    });

    self.route('post', 'media-source-browser', function(req, res) {
      const { provider } = req.body;

      const connectorModule = self.apos.modules[`apostrophe-images-connector-${provider.toLowerCase()}`];

      return self.renderAndSend(req, 'media-source-browser', {
        label: provider,
        options: connectorModule.options.mediaSourceConnector
      });
    });

    self.route('post', 'media-source-browser-editor', function(req, res) {
      const { provider, item } = req.body;

      const connectorModule = self.apos.modules[
        `apostrophe-images-connector-${provider.toLowerCase()}`
      ];

      return self.renderAndSend(req, 'mediaSourceBrowserEditor', {
        provider,
        item,
        options: connectorModule.options.mediaSourceConnector
      });
    });

    // TODO : Req response here
    self.route('post', 'find/:connector', function(req, res) {
      if (self.apos.modules[req.params.connector] &&
        self.apos.modules[req.params.connector].find &&
        typeof self.apos.modules[req.params.connector].find === 'function' &&
        self.apos.modules[req.params.connector].options.mediaSourceConnector) {
        self.apos.modules[req.params.connector].find(req, {});
      }
    });
  }
};
