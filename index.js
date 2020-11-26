module.exports = {
  improve: 'apostrophe-images',
  moogBundle: {
    directory: 'lib/modules',
    modules: [
      'apostrophe-images-connector-unsplash'
    ]
  },
  beforeConstruct: function (self, options) {
    options.addFields = [
      {
        name: 'width',
        type: 'string',
        label: 'Width'
      }
    ].concat(options.addFields || []);
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
              moduleConfig.options.label
            ];
        }, []);

      self.on('apostrophe-pages:beforeSend', 'sendConnectorsToBrowser', async (req) => {
        req.browserCall('apos.connectors=?', JSON.stringify(connectors));
      });
    });

    self.route('post', 'media-source-browser', function(req, res) {
      const { provider } = req.body;

      const connectorModule = self.apos.modules[`apostrophe-images-connector-${provider.toLowerCase()}`];

      return self.renderAndSend(req, 'media-source-browser', {
        label: `Browse ${provider} Images`,
        options: connectorModule.options.mediaSourceConnector,
        action: connectorModule.action
      });
    });
  }
};
