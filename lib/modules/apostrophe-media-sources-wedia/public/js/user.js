apos.on('WediaContentPickerLoaded', ({ domElement, mediaSourceConnector }) => {
  window.WediaContentPicker.attach({
    el: domElement,
    server: mediaSourceConnector.script.server,
    onPick: async ({ entities }) => {
      apos.ui.globalBusy(true);
      const formData = {
        files: entities,
        connector: mediaSourceConnector.name
      };

      const imagesIds = await apos.utils
        .post(`${mediaSourceConnector.action}/download`, formData);

      console.log('imagesIds ===> ', imagesIds);

      apos.ui.globalBusy(false);
    }
  });
});
