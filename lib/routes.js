const { IncomingMessage } = require('http');

module.exports = (self) => {
  self.addRoutes = () => {
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

      const mediaSourcesFiltersOptions = self.connectors.map(({ name, label }) => {
        return {
          value: name,
          label
        };
      });

      if (mediaSourcesFiltersOptions.length) {
        self.filters.push({
          name: 'mediaSource',
          choices: [
            {
              value: 'apostrophe',
              label: 'Apostrophe'
            },
            ...mediaSourcesFiltersOptions
          ],
          def: null
        });
      }

      self.on('apostrophe-pages:beforeSend', 'sendConnectorsToBrowser', (req) => {
        req.browserCall('apos.mediaSourceConnectors=?', JSON.stringify(self.connectors));
      });
    });

    self.route('post', 'media-sources-browser', function(req, res) {
      const { provider } = req.body;

      const mediaSourceConnector = self.connectors
        .find((connector) => connector.label === provider);

      const choices = self.apos.modules[mediaSourceConnector.name].choices();

      const standardFilters = (mediaSourceConnector.standardFilters || [])
        .reduce((acc, filter) => {
          return {
            ...acc,
            [filter.name]: filter
          };
        }, {});

      return self.renderAndSend(req, 'mediaSourcesBrowser', {
        ...mediaSourceConnector,
        standardFilters,
        choices
      });
    });

    self.route('post', 'media-sources-preview', function(req, res) {
      const {
        provider, item, isImported
      } = req.body;

      const mediaSourceConnector = self.connectors
        .find((connector) => connector.label === provider);

      return self.renderAndSend(req, 'mediaSourcesPreview', {
        ...mediaSourceConnector,
        item,
        isImported
      });
    });

    self.route('post', 'find', async function(req, res) {
      try {
        const { connector, ...filters } = req.body;
        const currentModule = self.apos.modules[connector];

        if (self.isConnectorWithMethod(currentModule, 'find')) {
          const images = await currentModule.find(req, filters);

          const existingImages = await self.apos.images.find(req, {
            mediaSource: connector,
            mediaSourceId: { $in: images.results.map((img) => img.mediaSourceId) }
          }).toArray();

          const data = {
            images,
            existingIds: existingImages.map((img) => img.mediaSourceId),
            filterChoices: currentModule.choices(req, filters)
          };

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
        const { connector, file } = req.body;
        const currentModule = self.apos.modules[connector];

        if (!currentModule) {
          return res.status(400).send(`This module doesn't exist: ${connector}.`);
        }

        const data = await self.downloadAndInsert(req, file, currentModule);

        if (!data) {
          throw new Error(`Error while downloading image for ${connector}.`);
        }

        return res.status(200).send(data);
      } catch (err) {
        if (err.response) {
          const {
            status, statusText, data
          } = err.response;
          const dataIsStream = data instanceof IncomingMessage;

          return res.status(status || 500).send(dataIsStream ? statusText : data);
        }

        res.status(500).send(err);
      }
    });
  };
};
