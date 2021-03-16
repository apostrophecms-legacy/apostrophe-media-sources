module.exports = {
  improve: 'apostrophe-images',
  moogBundle: {
    directory: 'lib/modules',
    modules: [
      'apostrophe-media-sources-unsplash',
      'apostrophe-media-sources-wedia'
    ]
  },
  beforeConstruct: (self, options) => {
    options.addFields = [
      ...options.addFields || [],
      {
        type: 'string',
        name: 'creditUsername',
        label: 'Credit Username'
      },
      {
        type: 'string',
        name: 'creditFirstName',
        label: 'Credit First Name'
      },
      {
        type: 'string',
        name: 'creditLastName',
        label: 'Credit Last Name'
      },
      {
        type: 'string',
        name: 'creditPicture',
        label: 'Credit Picture'
      }
    ];

    options.arrangeFields = [
      {
        name: 'credit',
        label: 'Credit',
        fields: [
          'credit',
          'creditUsername',
          'creditFirstName',
          'creditLastName',
          'creditPicture',
          'creditUrl'
        ]
      }
    ];
  },
  construct: (self, options) => {
    require('./lib/api.js')(self, options);

    self.on('apostrophe:modulesReady', 'getAllImagesConnectorsModules', () => {
      self.buildFilters();

      self.on('apostrophe-pages:beforeSend', 'sendConnectorsToBrowser', (req) => {
        req.browserCall('apos.mediaSourceConnectors=?', JSON.stringify(self.connectors));
      });
    });

    require('./lib/routes.js')(self, options);
    require('./lib/assets.js')(self);
    require('./lib/improveCursor.js')(self);
  },
  afterConstruct: (self) => {
    self.pushAssets();
    self.addRoutes();
  }
};
