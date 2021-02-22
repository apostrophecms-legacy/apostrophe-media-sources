module.exports = {
  improve: 'apostrophe-images',
  moogBundle: {
    directory: 'lib/modules',
    modules: [
      'apostrophe-media-sources-unsplash',
      'apostrophe-media-sources-wedia'
    ]
  },
  construct: (self, options) => {
    require('./lib/api.js')(self, options);
    require('./lib/routes.js')(self, options);
    require('./lib/assets.js')(self);
    require('./lib/improveCursor.js')(self);
  },
  afterConstruct: (self) => {
    self.pushAssets();
    self.addRoutes();
  }
};
