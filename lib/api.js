const fs = require('fs');
const unlink = require('util').promisify(fs.unlink);

module.exports = (self) => {
  self.isConnectorWithMethod = (module, method) => {
    return module && module[method] &&
      typeof module[method] === 'function' &&
      module.options.mediaSourceConnector;
  };

  self.downloadAndInsert = async (req, file, connectorModule) => {
    const tempPath = self.apos.attachments.uploadfs.getTempPath();

    // If a script is used, we need to format the file in the download method
    // so we have to return it to insert image with the right file object
    const { fileName, formattedFile } = await connectorModule
      .download(req, file, tempPath);

    const fileToInsert = formattedFile || file;

    const filePath = `${tempPath}/${fileName}`;

    const image = await self.insertImage({
      req,
      connectorName: connectorModule.options.name,
      file: fileToInsert,
      fileName,
      filePath
    });

    await unlink(filePath);

    return image._id;
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
      tags: file.tags.map((tag) => self.apos.launder.filterTag(tag)),
      mediaSourceId: file.mediaSourceId,
      mediaSource: connectorName
    };

    return self.apos.images.insert(req, piece);
  };

  self.buildFilters = () => {
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
            label: 'Media Library'
          },
          ...mediaSourcesFiltersOptions
        ],
        def: null
      });
    }
  };
};
