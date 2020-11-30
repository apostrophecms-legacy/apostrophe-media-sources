const axios = require('axios');
const { linkSync } = require('fs');

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

    self.formatData = (data) => {
      return {
        total: data.total,
        totalPages: data.total_pages,
        results: data.results.map(({
          id,
          width,
          height,
          description,
          urls,
          likes,
          tags,
          links
        }) => {
          return {
            mediaSourceId: id,
            width,
            height,
            description,
            urls,
            likes,
            tags,
            downloadLink: links.download
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
          url: `${unsplashUrl}${search.length ? '/search' : ''}/photos`,
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
        res.status(err.response.status || 500).send(err.response.data);
      }
    });
  }
};
