apos.on('WediaContentPickerLoaded', ({ domElement, mediaSourceConnector }) => {
  window.WediaContentPicker.attach({
    el: domElement,
    server: mediaSourceConnector.script.server,
    min: 1,
    max: 50,
    onPick: async ({ entities }) => {
      apos.notify('Download started.', { dismiss: true });
      apos.ui.globalBusy(true);
      try {
        const formData = {
          files: entities,
          connector: mediaSourceConnector.name
        };
        await apos.utils
          .post(`${mediaSourceConnector.action}/download`, formData);
      } catch ({ status }) {
        const message = status === 404
          ? 'This image was not found in Wedia.'
          : 'An error occurred when downloading from Wedia.';

        apos.notify(message, { type: 'error' });
      }

      apos.notify('Download succeeded.', {
        type: 'success',
        dismiss: true
      });
      apos.ui.globalBusy(false);
      apos.emit('refreshImages', []);
    }
  });
});
