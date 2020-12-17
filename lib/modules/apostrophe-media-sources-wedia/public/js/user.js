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
      } catch (err) {
        console.log('err ===> ', err);
      }
      apos.ui.globalBusy(false);
    }
  });
});
