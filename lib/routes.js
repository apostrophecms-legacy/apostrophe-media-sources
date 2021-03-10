module.exports = (self) => {
  self.addRoutes = () => {
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
          const {
            status, errorMsg
          } = err.response;

          return res.status(status || 500).send(errorMsg);
        }

        res.status(500).send();
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
            status, errorMsg
          } = err.response;

          return res.status(status || 500).send(errorMsg);
        }

        res.status(500).send(err);
      }
    });
  };
};
