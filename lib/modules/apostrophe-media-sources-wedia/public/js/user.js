apos.on('wediaPicker', ({ domElement, mediaSourceConnector }) => {
  window.WediaContentPicker.attach({
    el: domElement,
    server: 'https://michelin-pp.wedia-group.com',
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
