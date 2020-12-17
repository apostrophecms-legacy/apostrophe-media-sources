apos.on('wediaPicker', ({ domElement, server }) => {
  window.WediaContentPicker.attach({
    el: domElement,
    server,
    onPick: function(assets) {
      console.log('assets ====> ', assets)
    }
  });
});
