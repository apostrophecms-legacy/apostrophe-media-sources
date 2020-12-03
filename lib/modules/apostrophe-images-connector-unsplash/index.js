const axios = require('axios');

module.exports = {
  name: 'apostrophe-images-connector-unsplash',
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

    // If the search is a random one, Unsplash returns results direclty in data array
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

    self.download = async function(req, files) {
      const [ file ] = files;

      const { data, status } = await axios({
        method: 'get',
        url: file.downloadLink,
        headers: {
          Authorization: `Client-ID ${accessKey}`
        }
      });
      console.log('status ===> ', require('util').inspect(status, {
        colors: true,
        depth: 2
      }));
      console.log('data ===> ', require('util').inspect(data, {
        colors: true,
        depth: 2
      }));
    };
  }
};
