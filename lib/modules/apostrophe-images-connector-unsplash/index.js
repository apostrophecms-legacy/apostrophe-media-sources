module.exports = {
  name: 'apostrophe-images-connector-unsplash',
  label: 'Unsplash',
  construct (self, options) {

    // const browseAction = self.action + '/browse-unsplash';

    self.options.mediaSourceConnector = {
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

    self.route('post', 'browse-unsplash', function(req, res) {

      // return self.renderAndSend(req, 'media-source-browser', {
      //   options: mediaSourceConnector,
      //   label: `${provider} Browser`
      // });
    });
  }
};
