const axios = require('axios');

module.exports = {
  name: 'apostrophe-images-connector-unsplash',
  label: 'Unsplash',
  construct (self, options) {
    const unsplashUrl = 'https://api.unsplash.com';
    const { accessKey } = options;

    if (!accessKey) {
      self.apos.utils.warn('⚠️ You have to set an unsplash access key in order to use their Api.');
    }

    self.options.mediaSourceConnector = {
      standardFilters: [ 'orientation', 'search' ],
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
      perPage: 30,
      totalResults: 5000
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

    self.find = async function(req, filters) {
      const filtersKeys = [
        ...self.options.mediaSourceConnector.standardFilters,
        ...Object.values(self.options.mediaSourceConnector.customFilters).map(filter => filter.name),
        'page'
      ];

      const params = Object.entries(filters).reduce((acc, [ key, value ]) => {
        if (filtersKeys.includes(key)) {
          if (key === 'search') {
            acc.query = value;
          } else {
            acc[key] = value;
          }
        }
        return acc;
      }, {});

      const { totalResults, perPage } = options.mediaSourceConnector;

      const { status, data } = await axios({
        method: 'get',
        url: `${unsplashUrl}${params.query ? '/search' : ''}/photos`,
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'X-Total': totalResults,
          'X-Per-Page': perPage
        },
        params: {
          ...params,
          per_page: perPage
        }
      });

      if (status !== 200) {
        throw new Error('No results from Unsplash API');
      }

      return self.formatData(data);
    };
  }
};
