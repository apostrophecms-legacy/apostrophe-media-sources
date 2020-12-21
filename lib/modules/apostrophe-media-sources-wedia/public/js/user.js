apos.on('WediaContentPickerLoaded', ({ domElement, mediaSourceConnector }) => {
  const maxImports = mediaSourceConnector.script.maxConcurrentImports;

  window.WediaContentPicker.attach({
    el: domElement,
    server: mediaSourceConnector.script.server,
    min: 1,
    max: maxImports
      ? parseInt(maxImports) >= 1 && parseInt(maxImports) <= 100
        ? maxImports
        : 1
      : 1,
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
      apos.emit('refreshImages', []);
    }
  });
});
