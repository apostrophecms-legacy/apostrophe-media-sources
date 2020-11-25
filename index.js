module.exports = {
  improve: 'apostrophe-images',
  moogBundle: {
    directory: 'lib/modules',
    modules: [
      'apostrophe-images-connector-unsplash'
    ]
  },
  beforeConstruct: function (self, options) {
    options.addFields = [
      {
        name: 'width',
        type: 'string',
        label: 'Width',
      }
    ].concat(options.addFields || []);
  }
};
