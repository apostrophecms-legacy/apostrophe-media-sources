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

      const moduleName = `apostrophe-images-connector-${provider.toLowerCase()}`;

      const connectorModule = self.apos.modules[moduleName];

      return self.renderAndSend(req, 'media-source-browser', {
        label: provider,
        options: {
          action: `${self.action}/find/${moduleName}`,
          ...connectorModule.options.mediaSourceConnector
        }
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
    self.route('post', 'find/:connector', async function(req, res) {
      try {
        const currentModule = self.apos.modules[req.params.connector];

        if (currentModule &&
          currentModule.find &&
          typeof currentModule.find === 'function' &&
          currentModule.options.mediaSourceConnector) {
          const data = await currentModule.find(req, req.body);

          return res.status(200).send(data);
        }

        res.status(404).send(`This connector doesn't exist: ${req.params.connector}`);
      } catch (err) {
        res.status((err.response && err.response.status) || err.status || 500)
          .send((err.response && err.response.data) || err.statusText);
      }
    });
  }
};
