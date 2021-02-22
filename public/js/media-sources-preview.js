apos.define('media-sources-preview', {
  extend: 'apostrophe-modal',
  transition: 'slide',
  source: 'media-sources-preview',
  construct: (self, options) => {
    const superBeforeShow = self.beforeShow;
    self.beforeShow = async (callback) => {
      self.$form = self.$el.find('[data-apos-form]');
      self.provider = self.$form.attr('data-provider');
      self.item = JSON.parse(self.$form.attr('data-item'));

      const mediaSourceConnectors = JSON.parse(apos.mediaSourceConnectors);

      self.mediaSourceConnector = mediaSourceConnectors
        .find((connector) => connector.label === self.provider);

      self.link('apos-import', async () => {
        try {
          apos.notify('Download started.', { dismiss: true });
          apos.ui.globalBusy(true);

          const formData = {
            files: [ self.item ],
            connector: self.mediaSourceConnector.name
          };

          const imagesIds = await apos.utils
            .post(`${self.mediaSourceConnector.action}/download`, formData);

          apos.emit('refreshImages', imagesIds);
          apos.notify('Download succeeded.', {
            type: 'success',
            dismiss: true
          });
        } catch (error) {
          apos.notify('There has been an error. Please, retry later.', { type: 'error' });
        }

        apos.ui.globalBusy(false);
        self.cancel();
      });

      superBeforeShow(callback());
    };
  }
});
