apos.define('apostrophe-images-manager-modal', {
  extend: 'apostrophe-pieces-manager-modal',

  construct: function(self, options) {
    const superAfterRefresh = self.afterRefresh;

    self.afterRefresh = function (callback) {
      const $mediaSources = self.$el.find('[data-media-sources]');

      const connectors = JSON.parse(apos.connectors)
      const $connectors = connectors.reduce((acc, connector) => {
        return `${acc}<option>${connector}</option>`
      }, '')

      const selectClasses = 'class="apos-field-input apos-field-input-select"'

      const $select = `<select name="media-sources" ${selectClasses}><option>Apostrophe</option>${$connectors}</select>`;

      $mediaSources.append($select);

      superAfterRefresh(callback);
    };
  }
});
