apos.on('WediaContentPickerLoaded', ({ domElement, mediaSourceConnector }) => {
  const scriptOptions = mediaSourceConnector.script.options;

  window.WediaContentPicker.attach({
    el: domElement,
    server: mediaSourceConnector.script.server,
    min: 1,
    ...scriptOptions,
    onPick: async ({ entities }) => {
      try {
        apos.notify('Download started.', { dismiss: true });
        apos.ui.globalBusy(true);

        const imagesIds = [];

        for (const entity of entities) {
          const formData = {
            file: entity,
            connector: mediaSourceConnector.name
          };

          const imageId = await apos.utils
            .post(`${mediaSourceConnector.action}/download`, formData);

          imagesIds.push(imageId);
        }

        apos.emit('refreshImages', imagesIds);

        apos.notify('Download succeeded.', {
          type: 'success',
          dismiss: true
        });
      } catch ({ status }) {
        const message = status === 404
          ? 'This image was not found in Wedia.'
          : 'An error occurred when downloading from Wedia.';

        apos.notify(message, { type: 'error' });
      }

      apos.ui.globalBusy(false);
    }
  });

});
