const fs = require('fs');
const unlink = require('util').promisify(fs.unlink);

module.exports = {
  improve: 'apostrophe-images',
  moogBundle: {
    directory: 'lib/modules',
    modules: [
      'apostrophe-media-sources-unsplash',
      'apostrophe-media-sources-wedia'
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
        const jsonReplacer = (key, val) => typeof val === 'function' ? val.toString() : val;
        req.browserCall('apos.mediaSourceConnectors=?', JSON.stringify(self.connectors, jsonReplacer));
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
        const { connector, files } = req.body;
        const currentModule = self.apos.modules[connector];

        if (!currentModule) {
          return res.status(400).send(`This module doesn't exist: ${connector}.`);
        }

        const data = await self.downloadAndInsert(req, files, currentModule);

        if (!data) {
          throw new Error(`Error while downloading image for ${connector}.`);
        }

        return res.status(200).send(data);
      } catch (err) {
        if (err.response) {
          const { status, data } = err.response;
          return res.status(status || 500).send(data);
        }

        res.status(500).send(err);
      }
    });

    self.isConnectorWithMethod = (module, method) => {
      return module && module[method] &&
        typeof module[method] === 'function' &&
        module.options.mediaSourceConnector;
    };

    self.downloadAndInsert = async (req, files, connectorModule) => {
      const imagesIds = [];
      const tempPaths = [];

      const tempPath = self.apos.attachments.uploadfs.getTempPath();

      for (const file of files) {
        const fileName = await connectorModule.download(req, file, tempPath);

        const filePath = `${tempPath}/${fileName}`;

        const image = await self.insertImage({
          req,
          connectorName: connectorModule.options.name,
          file,
          fileName,
          filePath
        });

        tempPaths.push(filePath);
        imagesIds.push(image._id);
      }

      self.unlinkImages(tempPaths);

      return imagesIds;
    };

    self.insertImage = async ({
      req,
      connectorName,
      file,
      fileName,
      filePath
    }) => {
      const { slugPrefix } = self.apos.modules['apostrophe-images'].options;

      const attachment = await self.apos.attachments.insert(req, {
        name: fileName,
        path: filePath
      });

      const title = file.title || file.mediaSourceId;

      const piece = {
        title,
        slug: `${slugPrefix || ''}${file.mediaSourceId}`,
        published: true,
        trash: false,
        attachment,
        mediaSourceId: file.mediaSourceId,
        mediaSource: connectorName
      };

      return self.apos.images.insert(req, piece);
    };

    self.unlinkImages = (tempPaths) => {
      const promises = tempPaths.map((tempPath) => {
        return unlink(tempPath);
      });

      return Promise.all(promises);
    };
  }
};
