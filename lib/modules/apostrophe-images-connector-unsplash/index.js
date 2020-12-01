const axios = require('axios');

module.exports = {
  name: 'apostrophe-images-connector-unsplash',
  label: 'Unsplash',
  construct (self, options) {
    const browseRoute = 'browse-unsplash';
    const unsplashUrl = 'https://api.unsplash.com';
    const { accessKey } = options;

    if (!accessKey) {
      self.apos.utils.warn('⚠️ You have to set an unsplash access key in order to use their Api.');
    }

    self.options.mediaSourceConnector = {
      action: `${self.action}/${browseRoute}`,
      filters: [ 'extension', 'width', 'height', 'autocomplete', 'orientation', 'search' ],
      customFilters: {
        brand: {
          importAsTag: true
        },
        category: {
          multiple: true,
          importAsTag: true
        },
        tags: {
          multiple: true,
          importAsTag: true
        }
      },
      propertyLabels: {
        likes: 'Number Of Likes'
      },
      // Results returned "per page" (see find method below)
      perPage: 30
    };

    // If the search is a random one, Unsplash returns results direclty in data array
    self.formatData = (data) => {
      /* eslint-disable camelcase */
      const isRandom = Array.isArray(data);

      return {
        total: !isRandom ? data.total : options.mediaSourceConnector.perPage,
        totalPages: !isRandom ? data.total_pages : 1,
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
          categories,
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
            categories,
            downloadLink: links.download,
            created_at
          };
        })
      };
    };

    self.route('post', browseRoute, async (req, res) => {
      try {
        const {
          search,
          widthValue,
          widthRange,
          heightValue,
          heightRange,
          orientation,
          extension,
          page
        } = req.body;
        const params = {
          ...search && { query: search },
          ...orientation && { orientation: orientation.toLowerCase() },
          ...page && { page },
          per_page: options.mediaSourceConnector.perPage
        };

        const { status, data } = await axios({
          method: 'get',
          url: `${unsplashUrl}${search ? '/search' : ''}/photos`,
          headers: {
            Authorization: `Client-ID ${accessKey}`
          },
          params
        });

        if (status === 200) {
          return res.status(200).send(self.formatData(data));
        }

        return res.status(status).send();
      } catch (err) {
        res.status((err.response && err.response.status) || err.status)
          .send((err.response && err.response.data) || err.statusText);
      }
    });
  }
};
