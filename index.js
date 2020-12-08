module.exports = {
  improve: 'apostrophe-images',
  moogBundle: {
    directory: 'lib/modules',
    modules: [
      'apostrophe-media-sources-unsplash'
    ]
  },
  construct: function(self, options) {
    self.on('apostrophe:modulesReady', 'getAllImagesConnectorsModules', () => {
      // Find all images connectors defined in app configuration
      self.connectors = Object.values(self.apos.modules)
        .reduce((connectors, { options: moduleOptions }) => {
          return !moduleOptions.mediaSourceConnector
            ? connectors
            : [
              ...connectors,
              {
                name: moduleOptions.name,
                label: moduleOptions.label,
                action: `${self.action}`,
                ...moduleOptions.mediaSourceConnector
              }
            ];
        }, []);

      self.on('apostrophe-pages:beforeSend', 'sendConnectorsToBrowser', (req) => {
        req.browserCall('apos.mediaSourceConnectors=?', JSON.stringify(self.connectors));
      });
    });

    self.route('post', 'media-sources-browser', function(req, res) {
      const { provider } = req.body;

      const mediaSourceConnector = self.connectors
        .find((connector) => connector.label === provider);

      const standardFilters = mediaSourceConnector.standardFilters.map((filter) => filter.name);

      return self.renderAndSend(req, 'mediaSourcesBrowser', {
        ...mediaSourceConnector,
        standardFilters
      });
    });

    self.route('post', 'media-sources-preview', function(req, res) {
      const { provider, item } = req.body;

      const mediaSourceConnector = self.connectors
        .find((connector) => connector.label === provider);

      return self.renderAndSend(req, 'mediaSourcesPreview', {
        ...mediaSourceConnector,
        item
      });
    });

    self.route('post', 'find', async function(req, res) {
      try {
        const { connector, ...filters } = req.body;
        const currentModule = self.apos.modules[connector];

        if (self.isMethodExist(currentModule, 'find')) {
          const data = await currentModule.find(req, filters);

          return res.status(200).send(data);
        }
        res.status(404).send(`Connector ${connector} doesn't exist or doesn't have the right methods`);
      } catch (err) {
        if (err.response) {
          const { status, data } = err.response;
          return res.status(status || 500).send(data);
        }

        res.status(500).send(err);
      }
    });

    self.route('post', 'download', async function(req, res) {
      try {
        const { connector, files } = req.body;
        const currentModule = self.apos.modules[connector];

        if (self.isMethodExist(currentModule, 'download')) {
          const data = await currentModule.download(req, files);

          return res.status(200).send(data);
        }
        res.status(404).send(`Connector ${connector} doesn't exist or doesn't have the right methods`);
      } catch (err) {
        if (err.response) {
          const { status, data } = err.response;
          return res.status(status || 500).send(data);
        }

        res.status(500).send(err);
      }
    });

    self.isMethodExist = (module, method) => {
      return module && module[method] &&
        typeof module[method] === 'function' &&
        module.options.mediaSourceConnector;
    };
  }
};
