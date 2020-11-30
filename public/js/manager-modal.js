apos.define('apostrophe-images-manager-modal', {
  extend: 'apostrophe-pieces-manager-modal',

  construct: function(self, options) {
    const superAfterRefresh = self.afterRefresh;

    self.afterRefresh = function (callback) {
      const $mediaSources = self.$el.find('[data-media-sources]');

      const connectors = JSON.parse(apos.connectors);
      const $connectors = connectors.reduce((acc, connector) => {
        return `${acc}<option>${connector}</option>`;
      }, '');

      const selectClasses = 'class="apos-field-input apos-field-input-select"';

      const $select = `<select name="media-sources" ${selectClasses}><option>Apostrophe</option>${$connectors}</select>`;

      $mediaSources.append($select);

      superAfterRefresh(callback);

      self.$el.on('change', 'select[name="media-sources"]', function() {
        const { value } = this;
        if (value !== 'Apostrophe') {
          apos.create('media-source-browser', {
            action: self.action,
            body: { provider: value }
          });
          // Select "Apostrophe" in the dropdown: when coming back, the user can select again what he has just selected
          setTimeout(() => (this.selectedIndex = 0), 250);
        }
      });
    };
  }
});

apos.define('media-source-browser', {
  extend: 'apostrophe-modal',
  source: 'media-source-browser',
  construct: function (self, options) {
    const superBeforeShow = self.beforeShow;
    self.beforeShow = function(callback) {
      const $form = self.$el.find('[data-media-sources-form]');

      $form.keypress(({ originalEvent }) => {
        if (originalEvent.charCode === 13) {
          self.getFormData();
        }
      });

      self.link('import', function(e) {
        // Here do import
      });

      return superBeforeShow(callback);
    };

    self.getFormData = () => {
      const $form = self.$el.find('[data-media-sources-form]');

      const widthValue = $form.find('[data-media-sources-width-value]').val();
      const widthRange = $form.find('[data-media-sources-width-range]').val();
      const heightValue = $form.find('[data-media-sources-height-value]').val();
      const heightRange = $form.find('[data-media-sources-height-range]').val();
      const orientation = $form.find('[data-media-sources-orientation]').val();
      const extension = $form.find('[data-media-sources-extension]').val();
      const search = $form.find('[data-media-sources-search]').val();

      return {
        ...widthValue && {
          widthValue,
          widthRange
        },
        ...heightValue && {
          heightValue,
          heightRange
        },
        ...orientation && orientation !== 'All' && { orientation },
        ...extension && extension !== 'All' && { extension },
        ...search && { search }
      };
    };
  }
});
