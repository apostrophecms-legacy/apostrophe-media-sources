apos.on('WediaContentPickerLoaded', ({ domElement, mediaSourceConnector }) => {
  window.WediaContentPicker.attach({
    el: domElement,
    server: mediaSourceConnector.script.server,
    onPick: async ({ entities }) => {
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
      apos.ui.globalBusy(false);
    }
  });
});
