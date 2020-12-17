apos.on('wediaPicker', ({ domElement }) => {
  window.WediaContentPicker.attach({
    el: domElement,
    server: 'https://michelin-pp.wedia-group.com',
    onPick: function(assets) {

    }
  });
});
