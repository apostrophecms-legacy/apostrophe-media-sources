module.exports = {

  extend: 'apostrophe-pieces-cursor',
  // extend: false,
  // improve: 'apostrophe-images-cursor',

  construct: function(self, options) {

    self.addFilter('minSize', {
      finalize: function() {
        var minSize = self.get('minSize');
        if (!minSize) {
          return;
        }
        // var $nin = _.filter(_.keys(self.apos.attachments.sized), function(key) {
        //   return self.apos.attachments.sized[key];
        // });
        // var criteria = {
        //   $or: [
        //     {
        //       'attachment.extension': { $nin: $nin }
        //     },
        //     {
        //       'attachment.width': { $gte: minSize[0] },
        //       'attachment.height': { $gte: minSize[1] }
        //     }
        //   ]
        // };
        // self.and(criteria);
        self.and({});
      },
      safeFor: 'public',
      launder: function(a) {
        if (!Array.isArray(a)) {
          return undefined;
        }
        if (a.length !== 2) {
          return undefined;
        }
        return [ self.apos.launder.integer(a[0]), self.apos.launder.integer(a[1]) ];
      }
    });

    // Filter. Get images depending on the
    // orientation of their attachments. This orientation
    // is computed during import, comparing width and height.
    // Accessible programmatically using self.find(req).orientation('square')`.
    // Available options are: `landscape`, `portrait`, `square`.

    self.addFilter('orientation', {
      def: null,
      finalize: function() {
        const orientation = self.get('orientation');
        if (!orientation) {
          return;
        }

        self.and(getCriteria(orientation));

        function getCriteria(orientation) {
          if (orientation === 'landscape') {
            return {
              'attachment.landscape': true
            };
          } else if (orientation === 'portrait') {
            return {
              'attachment.portrait': true
            };
          } else {
            // Last case is square
            return {
              'attachment.square': true
            };
          }

        }
      },
      safeFor: 'public',
      launder: function(s) {
        return self.apos.launder.string(s);
      },
      choices: function(callback) {
        const { choices } = options.module.filters
          .find((filter) => filter.name === 'orientation');

        return callback(null, choices);
      }
    });

    // Filter. Get images depending on their
    // type, the available images extensions come from
    // `self.fileGroups` in `apostrophe-attachments`.
    // Accessible programmatically using self.find(req).fileType('jpg')`.
    // Available options are: `jpg`, `png`, `gif` and `svg` if `svgImages` is enabled.

    self.addFilter('fileType', {
      finalize: function() {
        const fileType = self.get('fileType');
        if (!fileType) {
          return;
        }

        const criteria = {
          'attachment.extension': fileType
        };

        self.and(criteria);
      },
      safeFor: 'public',
      launder: function(s) {
        return self.apos.launder.string(s);
      },
      choices: function(callback) {
        const { choices } = options.module.filters
          .find((filter) => filter.name === 'fileType');

        return callback(null, choices);
      }
    });

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

        console.log('choices ===> ', require('util').inspect(choices, {
          colors: true,
          depth: 2
        }));

        return callback(null, choices);
      }
    });
  }
};
