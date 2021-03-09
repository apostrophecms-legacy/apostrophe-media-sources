apos.define('apostrophe-images-manager-modal', {

  construct: (self, options) => {
    apos.on('refreshImages', (ids) => {
      self.choices = [
        ...ids,
        ...self.choices
      ];
      self.refresh();
    });

    // save manager so we can call edit() later
    self.manager = apos.docs.getManager(options.name);

    const superBeforeShow = self.beforeShow;
    self.beforeShow = (callback) => {
      self.$el.on('change', 'select[name="media-sources"]', function() {
        const { value } = this;
        if (value.toLowerCase() !== 'apostrophe') {
          apos.create('media-sources-browser', {
            action: self.action,
            body: { provider: value }
          });
          // Select "Apostrophe" in the dropdown: when coming back,
          // the user can select again what he has just selected
          setTimeout(() => (this.selectedIndex = 0), 400);
        }
      });

      superBeforeShow(callback);
    };

    const superAfterRefresh = self.afterRefresh;
    self.afterRefresh = (callback) => {
      const $mediaSources = self.$el.find('[data-media-sources]');

      const mediaSourceConnectors = JSON.parse(apos.mediaSourceConnectors);
      const $connectors = mediaSourceConnectors.reduce((acc, connector) => {
        return `${acc}<option>${connector.label}</option>`;
      }, '');

      const selectClasses = 'class="apos-field-input apos-field-input-select"';

      const $select =
        `<select name="media-sources" ${selectClasses}>
          <option>Media Library</option>
          ${$connectors}
        </select>`;

      $mediaSources.append($select);
      superAfterRefresh(callback);
    };
  }
});
