apos.on('wediaPicker', ({ domElement }) => {
  WediaContentPicker.attach({
    el: domElement,
    server: "https://michelin-pp.wedia-group.com",
    onPick: function(assets) {
      console.log('assets ====> ', assets)
    }
  })
});
