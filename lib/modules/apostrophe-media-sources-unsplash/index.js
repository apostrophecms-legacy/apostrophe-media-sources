const axios = require('axios');
const fs = require('fs');

module.exports = {
  name: 'apostrophe-media-sources-unsplash',
  label: 'Unsplash',
  construct (self, options) {
    const unsplashUrl = 'https://api.unsplash.com';
    const { accessKey, perPage = 30 } = options;

    if (!accessKey) {
      self.apos.utils.warn('⚠️ You have to set an unsplash access key in order to use their Api.');
    }

    // Unsplash only allows perPage between 10 and 30
    if (perPage && (perPage < 10 || perPage > 30)) {
      self.apos.utils.warn('⚠️ Unsplash only allows perPage between 10 and 30. (set by default to 30)');
    }

    self.options.mediaSourceConnector = {
      standardFilters: [
        {
          name: 'orientation',
          dependsOn: [ 'search' ]
        },
        {
          name: 'search'
        }
      ],
      customFilters: [
        {
          name: 'color',
          label: 'Color',
          type: 'select',
          choices: [
            {
              label: 'All',
              value: ''
            },
            {
              label: 'Black And White',
              value: 'black_and_white'
            },
            {
              label: 'Black',
              value: 'black'
            },
            {
              label: 'White',
              value: 'white'
            },
            {
              label: 'Yellow',
              value: 'yellow'
            },
            {
              label: 'Orange',
              value: 'orange'
            },
            {
              label: 'Red',
              value: 'red'
            },
            {
              label: 'Purple',
              value: 'purple'
            },
            {
              label: 'Magenta',
              value: 'magenta'
            },
            {
              label: 'Green',
              value: 'green'
            },
            {
              label: 'Teal',
              value: 'teal'
            },
            {
              label: 'Blue',
              value: 'blue'
            }
          ]
        }
      ],
      propertyLabels: {
        likes: 'Number Of Likes'
      },
      // Results returned "per page" (see find method below)
      totalResults: 5000,
      perPage: (perPage < 10 || perPage > 30) ? 30 : perPage
    };

    // If the search is a random one, Unsplash returns results directly in data array
    self.formatData = (data, perPage) => {
      /* eslint-disable camelcase */
      const { totalResults } = options.mediaSourceConnector;
      const isRandom = Array.isArray(data);

      const { total, pages } = !isRandom && data.total > totalResults
        ? {
          total: Math.ceil(totalResults / perPage) * perPage,
          pages: Math.ceil(totalResults / perPage)
        }
        : {
          total: data.total,
          pages: data.total_pages
        };

      return {
        total: !isRandom ? total : perPage,
        totalPages: !isRandom ? pages : 1,
        results: (!isRandom ? data.results : data).map(({
          id,
          width,
          height,
          description,
          description_alts,
          urls,
          likes,
          tags,
          links,
          created_at
        }) => {
          return {
            mediaSourceId: id,
            title: description || '',
            width,
            height,
            description: description_alts || '',
            thumbLink: urls.thumb || urls.small || urls.regular || urls.raw,
            previewLink: urls.raw,
            likes,
            tags: (tags && tags.map(({ title }) => title)) || [],
            categories: [],
            downloadLink: links.download,
            created_at
          };
        })
      };
    };

    self.find = async function(req, filters) {
      const { standardFilters, customFilters } = self.options.mediaSourceConnector;

      const filtersKeys = [
        ...Object.values(standardFilters).map(filter => filter.name),
        ...Object.values(customFilters).map(filter => filter.name),
        'page'
      ];

      const params = Object.entries(filters).reduce((acc, [ key, value ]) => {
        if (filtersKeys.includes(key)) {
          if (key === 'search') {
            acc.query = value;
          } else if (key === 'orientation' && value === 'square') {
            acc[key] = 'squarish';
          } else {
            acc[key] = value;
          }
        }
        return acc;
      }, {});

      const { status, data } = await axios({
        method: 'get',
        url: `${unsplashUrl}${params.query ? '/search' : ''}/photos`,
        headers: {
          Authorization: `Client-ID ${accessKey}`
        },
        params: {
          ...params,
          per_page: perPage
        }
      });

      if (status !== 200) {
        throw new Error('No results from Unsplash API');
      }

      return self.formatData(data, perPage);
    };

    self.getAndwriteFile = (file) => {
      return new Promise((resolve, reject) => {
        axios({
          method: 'get',
          url: file.downloadLink,
          headers: {
            Authorization: `Client-ID ${accessKey}`
          },
          responseType: 'stream'
        }).then(({ status, data }) => {
          if (status !== 200) {
            reject(new Error('Error when downloading image from Unsplash API'));
          }

          const fileName = self.apos.utils.generateId() + '.' + 'jpg';
          const tempPath = self.apos.attachments.uploadfs.getTempPath() + '/' + fileName;

          const writer = fs.createWriteStream(tempPath);

          data.pipe(writer);

          writer.on('finish', () => resolve({
            file,
            fileName,
            tempPath
          }));

          writer.on('error', (err) => reject(err));
        }).catch((err) => reject(err));
      });
    };

    self.insertImage = async (req, {
      file, fileName, tempPath
    }) => {
      const attachment = await self.apos.attachments.insert(req, {
        name: fileName,
        path: tempPath
      });

      const piece = {
        title: file.title || file.mediaSourceId,
        published: true,
        trash: false,
        attachment,
        mediaSourceId: file.mediaSourceId,
        mediaSource: options.name
      };

      const image = await self.apos.images.insert(req, piece);

      return image;
    };

    self.unlinkImages = async (filesInfos) => {
      const promises = filesInfos.map(({ tempPath }) => {
        return new Promise((resolve, reject) => {
          return fs.unlink(tempPath, (err) => {
            if (err) {
              reject(err);
            }

            resolve();
          });
        });
      });

      return Promise.all(promises);
    };

    self.download = async (req, files) => {
      const writePromises = files.map((file) => {
        return self.getAndwriteFile(file);
      });

      const filesInfos = await Promise.all(writePromises);

      const insertPromises = filesInfos.map((file) => {
        return self.insertImage(req, file);
      });

      const insertedFiles = await Promise.all(insertPromises);

      self.unlinkImages(filesInfos);

      return insertedFiles;
    };
  }
};
