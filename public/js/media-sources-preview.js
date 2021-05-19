apos.define('media-sources-preview', {
  extend: 'apostrophe-modal',
  transition: 'slide',
  source: 'media-sources-preview',
  construct: (self, options) => {
    const superBeforeShow = self.beforeShow;
    self.beforeShow = async (callback) => {
      self.$form = self.$el.find('[data-apos-form]');

      self.enableImportLink();
      self.enableGroupTabs();

      superBeforeShow(callback(null));
    };

    self.enableImportLink = () => {
      const provider = self.$form.attr('data-provider');
      const file = JSON.parse(self.$form.attr('data-item'));

      const mediaSourceConnectors = JSON.parse(apos.mediaSourceConnectors);

      self.mediaSourceConnector = mediaSourceConnectors
        .find((connector) => connector.label === provider);

      self.link('apos-import', async () => {
        try {
          apos.notify('Download started.', { dismiss: true });
          apos.ui.globalBusy(true);

          const formData = {
            file,
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
    };

    self.enableGroupTabs = () => {
      self.$form.on('click', '[data-apos-open-group]', ({ target }) => {
        const $tab = $(target);

        self.$form.find('[data-apos-open-group], [data-apos-group]').removeClass('apos-active');
        $tab.addClass('apos-active');
        self.$form.find(`[data-apos-group=${$tab.data('apos-open-group')}]`).addClass('apos-active');
      });
    };
  }
});
