apos.define('apostrophe-images-manager-modal', {
  extend: 'apostrophe-pieces-manager-modal',

  construct: function(self, options) {
    const superAfterRefresh = self.afterRefresh;

    self.afterRefresh = function (callback) {
      const $mediaSources = self.$el.find('[data-media-sources]');

      // const selectOptions = options.filters.reduce((acc, cur) => {

      // }, '')

      const $select = `<select name="media-sources" class="apos-field-input apos-field-input-select"><option>Apostrophe</option></select>`;
      $mediaSources.append($select);

      superAfterRefresh(callback);
    };
  }
});
