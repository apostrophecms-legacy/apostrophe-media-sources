module.exports = {
  name: 'apostrophe-images-connector-unsplash',
  label: 'Unsplash',
  construct (self, options) {
    self.options.mediaSourceConnector = {
      action: self.action,
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
      perPage: 50
    };

    self.find = async function(req, filters) {};
  }
};
