apos.define('apostrophe-images-manager-modal', {
  extend: 'apostrophe-pieces-manager-modal',

  construct: function(self, options) {
    const superAfterRefresh = self.afterRefresh;

    self.afterRefresh = function (callback) {
      const $mediaSources = self.$el.find('[data-media-sources]');

      const mediaSourceConnectors = JSON.parse(apos.mediaSourceConnectors);
      const $connectors = mediaSourceConnectors.reduce((acc, connector) => {
        return `${acc}<option>${connector.label}</option>`;
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

    self.afterShow = function(callback) {
      const input = self.$el.find('.apos-modal-filters-search input')[0];
      input.focus();
      return callback;
    };

    self.getFormData = () => {
      const $form = self.$el.find('[data-media-sources-form]');
      const filters = $form.find('[data-media-sources-filter]');
      const values = {};

      filters.each(function() {
        if (this.value) {
          values[this.title] = this.value;
        }
      });

      return values;
    };
  }
});
