apos.on('wediaPicker', ({ domElement, mediaSourceConnector }) => {
  console.log('mediaSourceConnector ====> ', mediaSourceConnector)
  window.WediaContentPicker.attach({
    el: domElement,
    server: 'https://michelin-pp.wedia-group.com',
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
