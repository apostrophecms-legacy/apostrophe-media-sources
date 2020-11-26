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
        const { value } = $(this)[0];
        if (value !== 'Apostrophe') {
          apos.create('media-source-browser', {
            action: self.action,
            body: { provider: value }
          });
        }
      });
    };
  }
});

apos.define('media-source-browser', {
  extend: 'apostrophe-modal',
  source: 'media-source-browser',
  construct: function (self, options) {
    // const superAfterShow = self.afterShow;
    // self.afterShow = function (cb) {

    //   const headerHeight = self.$el.find('.apos-modal-header').outerHeight();

    //   console.log('headerHeight ===> ', headerHeight);

    //   self.resizeContentHeight();

    //   return superAfterShow(cb);
    // };

    const superBeforeShow = self.beforeShow;
    self.beforeShow = function(callback) {
      const $form = self.$el.find('[data-media-sources-form]');

      const { action } = $form.data();

      $form.keypress(({ originalEvent }) => {
        if (originalEvent.charCode === 13) {
          const formData = self.getFormData();

          $.post(action, formData, function(data) {
            self.injectResultsLabel(data.results.length, data.total, 1);
            self.injectResultsList(data.results);
          });
        }
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

    self.injectResultsLabel = (numResults, total, page) => {
      const $resultsLabel = self.$el.find('[data-result-label]');

      const end = page * numResults;
      const start = end - (numResults - 1);

      $resultsLabel.empty();
      $resultsLabel.append(`Showing ${start} - ${end} of ${total}`);
    };

    self.injectResultsList = (results) => {
      const $items = self.$el.find('[data-items]');

      const htmlToInject = results.reduce((acc, item) => {
        return `
          ${acc}
          ${self.getHtmlItem(item)}
        `;
      }, '');

      $items.empty();
      $items.append(htmlToInject);
    };

    self.getHtmlItem = (item) => {
      return `
      <div class="apos-manage-grid-piece">
      <div class="apos-manage-grid-image">
        <img src="${item.urls.thumb}" alt="image from Unsplash" />
        <div class="apos-manage-grid-piece-controls">
        </div>
      </div>
      <div class="apos-manage-grid-piece-label">${item.description ? item.description : ''}</div>
      <label>
        <input type="checkbox" class="apos-field-input apos-field-input-checkbox" />
        <span class="apos-field-input-checkbox-indicator"></span>
      </label>

    </div>`;

      //   <div class="apos-manage-grid-piece" data-focus-{{ piece.type }} data-edit-dbl-{{ data.options.name | css }}="{{ piece._id }}" data-piece="{{ piece._id }}">
    //   <div class="apos-manage-grid-image">
    //     {# Trash only has access to very low fi version of image, by design.
    //       Other sizes will 404. Might not seem so due to your cache at first. -Tom #}
    //     <img src="{{ apos.attachments.url(piece.attachment, { size: (piece.trash and 'one-sixth') or 'one-third' } ) }}" alt="">
    //     <div class="apos-image-screen"></div>
    //     <div class="apos-manage-grid-piece-controls">
    //       {% set verb = 'rescue' if (piece.trash and not (data.canEditTrash)) else 'edit' %}
    //       {% set label = 'Rescue' if (verb == rescue) else 'Edit' %}
    //       {{ buttons.minor(label, { action: verb + '-' + data.options.name | css, value: piece._id, icon: 'caret-right' }) }}
    //     </div>
    //   </div>
    //   <div class="apos-manage-grid-piece-label">{{ piece.title }}</div>
    //   {{ fields.checkbox(data.options.name + '-select') }}
    // </div>
    };
  }
});
