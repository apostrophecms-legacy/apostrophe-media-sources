# apostrophe-media-sources

A set of modules that ease browse and import of web-compatible image content from various media sources, including DAMs and Unsplash, into Apostrophe's media library.

## How to install

You need to already have an Apostrophe project in which you will install `apostrophe-media-sources`.
This module will override `apostrophe-images`, adding the possibility to browse different images providers.

For now, only `apostrophe-media-sources-unsplash` has been implemented, this module is part of the `apostrophe-media-sources` bundle, so you don't need to install it.

This module will be available on `npm` soon, for now, you can still clone it to have a look.

## Configuration

To configure this modules, you should add this module and the connectors in the `app.js` of your project :
```javascript
    modules: {
    'apostrophe-media-sources': {},
    'apostrophe-media-sources-unsplash': {
      accessKey: 'my-access-key'
    },
  }
```

Notice that the `Unsplash` Api require to create a free developper account which will provide you an access key.

Of course you should use an environment variable, to avoid storing key in your source code.

## Create you own connector

What we call a connector is a module which connect the `apostrophe-media-sources` to a specific provider.

Each module must have a `mediaSourceConnector` config in options :
```javascript
    self.options.mediaSourceConnector = {
      standardFilters: [ // Should work for every provider
        {
          name: 'orientation',
          // We add a dependencies options, because for some providers,
          // a filter can be modified if another is set (this feature isn't stable)
          dependsOn: [ 'search' ]
        },
        {
          name: 'search'
        }
      ],
      customFilters: [ // You can add custom filters for a specific provider
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
          ]
        }
      ],
      propertyLabels: { // You can modify the labels of the preview form
        likes: 'Number Of Likes'
      },
      totalResults: 5000, // Total of results you want to return
      perPage: 20 // Results per page
    };
```

A connector must have two methods declared in its `construct`,
those will be called by `apostrophe-media-sources` :
* `self.find` (req, filters):
  This one must get the data from the provider and format it, it has to return
  ```javascript
      {
        images,
        existingIds
      };
  ```
  ExistingIds, is an array of ids of the already imports images,
  Images is an array of images which have been formatted this way:

  ```javascript
  {
      mediaSourceId, // The image ID of the provider
      title,
      description,
      width,
      height,
      thumbLink, // For listing
      previewLink, // For preview button
      likes, // Number
      tags, // Array of strings
      categories,
      downloadLink,
      createdAt
  }
  ```

* `self.download` (req, files):
This method will download the photo in a temp folder,
create apostrophe `attachment` and `image` pieces.
Finally it has to return the ids of the created images pieces.

Last important thing, you have to store in your piece the `mediaSourceId`
which is the id from the provider, it allows us to know if an image has already been imported.
And the `mediaSource` property, which is the name of the module, for Unsplash (`apostrophe-media-sources-unsplash`).
