module.exports = {
  name: 'apostrophe-images-connector-unsplash',
  label: 'Unsplash',
  construct (self, options) {
    self.options.mediaSourceConnector = {
      action: self.action,
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
      perPage: 50
    };

    self.find = async function(req, filters) {
      // TODO: when checking filters, if "square" orientation is present, modify to "squarish"
    };
  }
};
