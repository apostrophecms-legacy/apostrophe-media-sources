module.exports = {

  // extend: 'apostrophe-pieces-cursor',
  // extend: false,
  improve: 'apostrophe-images-cursor',

  construct: function(self, options) {
    // Filter. Get images depending on their media source,
    // The availables media sources depends on the ones you are using in your project
    // Accessible programmatically using self.find(req).mediaSources('apostrophe')`.
    // Available options all media sources declared in you project:
    // `apostrophe`, `unsplash`, `wedia`...

    self.addFilter('mediaSource', {
      finalize: function() {
        const mediaSource = self.get('mediaSource');
        if (!mediaSource) {
          return;
        }

        const criteria = mediaSource === 'apostrophe'
          ? { mediaSource: { $exists: false } }
          : { mediaSource: mediaSource };

        self.and(criteria);
      },
      safeFor: 'public',
      launder: function(s) {
        return self.apos.launder.string(s);
      },
      choices: function(callback) {
        const { choices } = options.module.filters
          .find((filter) => filter.name === 'mediaSource');

        return callback(null, choices);
      }
    });
  }
};
