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
        label: 'Width',
      }
    ].concat(options.addFields || []);
  },
  construct: function(self, options) {
    self.on('apostrophe:modulesReady', 'getAllImagesConnectorsModules' , () => {
      // Find all images connectors defined in app configuration
      const connectors = Object.entries(self.apos.modules)
        .reduce((connectors, [moduleName, moduleConfig]) => {
          return !moduleConfig.mediaSourceConnector
            ? connectors
            : [
              ...connectors,
              moduleConfig.options.label
            ]
      }, [])

      self.on('apostrophe-pages:beforeSend', 'sendConnectorsToBrowser', async (req) => {
        req.browserCall('apos.connectors=?', JSON.stringify(connectors));
      })
    })

    self.route('post', 'media-source-browser', function(req, res) {
      return self.renderAndSend(req, 'media-source-browser', {
        options: self.options,
        label: 'Media Source Browser'
      });
    });
  }
};
