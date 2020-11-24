module.exports = {
  improve: 'apostrophe-images',
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
