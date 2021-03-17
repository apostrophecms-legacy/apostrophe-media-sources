const fs = require('fs');
const stream = require('stream');
const axios = require('axios');
const pipeline = require('util').promisify(stream.pipeline);

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
          label: 'Orientation',
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
          type: 'select'
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
          user,
          urls,
          likes,
          tags,
          links,
          created_at
        }) => {
          const title = (description && description.length > 30
            ? `${description.substring(0, 30).trim()}...`
            : description) || '';

          const credit = `${user.first_name || ''} ${user.last_name || ''}`.trim();

          return {
            mediaSourceId: id,
            title,
            width,
            height,
            description: description || '',
            thumbLink: urls.thumb || urls.small || urls.regular || urls.raw,
            previewLink: urls.raw,
            likes,
            creditInfos: {
              credit,
              creditUsername: user.username || '',
              creditFirstName: user.first_name || '',
              creditLastName: user.last_name || '',
              creditPicture: user.profile_image.large || '',
              creditUrl: user.links.html || ''
            },
            tags: (tags && tags.map(({ title }) => title)) || [],
            downloadLink: links.download,
            createdAt: created_at
          };
        })
      };
    };

    self.find = async (req, filters) => {
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

      try {
        const {
          data
        } = await axios({
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

        return self.formatData(data, perPage);
      } catch (err) {
        // Show error to user when it's related to Unsplash rate limit
        if (self.checkRateLimitError(err)) {
          err.response.errorMsg = 'Unsplash rate limit exceeded';
        }
        throw err;
      }
    };

    self.download = async (req, file, tempPath) => {
      try {
        const { data } = await axios({
          method: 'get',
          url: file.downloadLink,
          headers: {
            Authorization: `Client-ID ${accessKey}`
          },
          responseType: 'stream'
        });

        const fileName = self.apos.utils.generateId() + '.jpg';
        const filePath = `${tempPath}/${fileName}`;

        await pipeline(
          data,
          fs.createWriteStream(filePath)
        );

        return { fileName };

      } catch (err) {
        // Show error to user when it's related to Unsplash rate limit
        if (self.checkRateLimitError(err)) {
          err.response.errorMsg = 'Unsplash rate limit exceeded';
        }
        throw err;
      }
    };

    self.checkRateLimitError = ({ response }) => {
      if (!response) {
        return false;
      }
      const rateLimit = response.headers['x-ratelimit-remaining'];

      return response.status === 403 && parseInt(rateLimit, 10) === 0;
    };

    self.choices = () => {
      return {
        orientation: [
          {
            label: 'All',
            value: ''
          },
          {
            label: 'Landscape',
            value: 'landscape'
          },
          {
            label: 'Portrait',
            value: 'portrait'
          },
          {
            label: 'Square',
            value: 'square'
          }
        ],
        color: [
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
      };
    };
  }
};
