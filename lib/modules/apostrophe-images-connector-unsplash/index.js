module.exports = {
  name: 'apostrophe-images-connector-unsplash',
  label: 'Unsplash',
  construct (self, options) {

    const browseRoute = '/browse-unsplash';

    self.options.mediaSourceConnector = {
      browseAction: `${self.action}/${browseRoute}`,
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

    self.route('post', browseRoute, function(req, res) {});
  }
};
