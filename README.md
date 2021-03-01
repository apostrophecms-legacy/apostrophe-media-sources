# apostrophe-media-sources

A set of modules that ease the browsing and import of web-compatible image content from various media sources, including the Wedia DAM and Unsplash, into Apostrophe's media library.

## How to install

You need to already have an Apostrophe project in which you will install `apostrophe-media-sources`. This module will override `apostrophe-images`, adding the possibility to browse different image providers.

For now, `apostrophe-media-sources-unsplash``apostrophe-media-sources-wedia` have been implemented. These modules are part of the `apostrophe-media-sources` bundle, so you don't need to separately install them.

## Warnings

**When using this module, your site cannot be edited in the IE11 browser.** This site does not affect the experience of ordinary logged-out site visitors in IE11.

## Configuration

To configure the modules in this bundle, you should add `apostrophe-media-sources` itself and the connector modules of your choice in `app.js`, like this:

```javascript
    modules: {
      'apostrophe-media-sources': {},
      'apostrophe-media-sources-unsplash': {
        accessKey: 'my-access-key'
      },
      'apostrophe-media-sources-wedia': {
        script: {
          // You will get your own subdomain ("xyz" below) when you sign up with Wedia
          src: 'https://xyz.wedia-group.com/asset-picker/wedia-content-picker.js',
          server: 'https://xyz.wedia-group.com',
          name: 'WediaContentPicker',
          options: {} // optional - pass options to the wedia content picker -
        }
      }
    }
  }
```

Notes:
* You can find existing wedia options in the documentation: https://crossmedia.atlassian.net/wiki/spaces/WD/pages/379551745/Wedia+Content+Picker#Settings

* To access the `Unsplash` API you will need to create a free developer account, which will provide you with an access key, this free account is limited to 50 requests per hour. For Wedia you will need to work with the Wedia team.

If you prefer not to store keys in your source code, you can use an environment variable, like this:

```javascript
accessKey: process.env.UNSPLASH_ACCESS_KEY
```

## Create your own connector

### Example with an API

What we call a connector is a module which connects the Apostrophe image library to a specific provider. Most connectors will be based on an API offered by the provider, and use a universal user interface provided by this module, as with Unsplash. A few will use a custom "picker" UI script offered directly by the provider instead.

For the API approach, each connector module must have a `mediaSourceConnector` option:

```javascript
    self.options.mediaSourceConnector = {
      standardFilters: [
        {
          name: 'orientation',
          // For some providers, certain filters can be accessed only if another is set
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
        }
      ],
      propertyLabels: { // You can modify the labels of the preview form
        likes: 'Number Of Likes'
      },
      totalResults: 5000, // Total of results you want to return
      perPage: 20 // Results per page
    };
```

Here are all the standard filters handled by `apostrophe-media-sources`:

* Search
* Orientation (Notice that your `choices` method should return some for this filter)

For these you do not have to provide a `label` or a `type`.

For custom filters, you must provide `label` and `type`, which currently may only be `select`.

A connector must have at least three methods declared in its `construct`. These will be called by `apostrophe-media-sources`:

* `self.find = async (req, filters)`:
  Fetches data from the provider, taking into account the `filters` object. Returned images should be formatted as an array. Each entry should be formatted in the following manner:

```javascript
{
    mediaSourceId, // The image ID from the provider
    title,
    description,
    width, // Number
    height, // Number
    thumbLink, // For listing
    previewLink, // For preview button
    likes, // Number
    tags, // Array of strings
    categories,
    downloadLink, // Download Url
    createdAt
}
```

* `self.download = async (req, file, tempPath)`:
Given a `file`, which must be one of the objects returned in the array by `find`, this method must download that file to the specified local filesystem folder, `tempPath`.
The method must then return the image file name within that folder, with its extension.
`apostrophe-media-source` will  take care of the attachment and image piece creation, as well as deleting the temporary image after the import operation is complete.

* `self.choices = async (req, filters)`
This method should return the available choices for all available filters, taking into account the previously chosen values in the `filters` object. If practical the set of choices provided for each filter should be reduced to take into account the choices already made for other filters, but not itself. This method is executed during every search. The return value must be an object with a property for each filter. The value of the property is an array of choices with `value` and `label` properties.

### Example with a DAM-provided "picker" script

If a provider furnishes a "picker" or "chooser" script to be used to select media via a custom user interface, the connector module must have:
- a `public/js/user.js` file, starting the provider's script.
- a `index.js` file pushing the `user.js` file as a `script` asset in the `user` scene, with placeholder empty methods for `find` and `choices` and a fully implemented `download` method.

`user.js` would look like this. For this example we'll communicate with an imaginary picker script called `SomeThirdPartyPicker`:

```javascript
apos.on('ThirdPartyPickerLoaded', ({ domElement, mediaSourceConnector }) => {
  window.ThirdPartyPicker.picked(imageRecords => {
    try {
      imageRecords = imageRecords.map(imageRecord => {
        return {
          mediaSourceId: imageRecord.originalId,
          title: imageRecord.label
          // et cetera — convert the format from the third party picker to
          // the format given above for the return value of "find"
        };
      });
      apos.notify('Download started.', { dismiss: true });
      apos.ui.globalBusy(true);
      const imageIds = await apos.utils
        .post(`${mediaSourceConnector.action}/download`, {
          files: imageRecords,
          connector: mediaSourceConnector.name
        });
      apos.emit('refreshImages', imageIds);
      apos.notify('Download succeeded.', {
        type: 'success',
        dismiss: true
      });
    } catch ({ status }) {
      const message = status === 404
        ? 'This image was not found in the third party system.'
        : 'An error occurred when downloading from the third party system.';

      apos.notify(message, { type: 'error' });
    }
    apos.ui.globalBusy(false);
  });
});
```

Configuration of your module in `index.js` will then look like:

```js
  'third-party-connector': {
    script: {
      src: 'https://url-that-loads-the-picker-script-goes-here',
      // Event name, must be unique
      name: 'ThirdPartyContentPicker',
      // additional options custom to your picker can be accessed
      // in user.js as properties of the mediaSourceConnector parameter
    }
  }
```
