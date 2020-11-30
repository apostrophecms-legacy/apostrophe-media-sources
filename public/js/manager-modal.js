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
  construct: (self, options) => {
    // const superBeforeShow = self.beforeShow;
    self.beforeShow = (done) => {
      const $form = self.$el.find('[data-media-sources-form]');

      $form.keypress(({ originalEvent }) => {
        if (originalEvent.charCode === 13) {
          self.requestMediaSource($form, 1);
        }
      });

      done();
    };

    self.requestMediaSource = async ($form, page) => {
      try {
        const formData = {
          ...self.getFormData($form),
          page
        };

        const { action } = $form.data();

        const {
          results,
          total,
          totalPages
        } = await apos.utils.post(action, formData);

        self.injectResultsLabel(results.length, total, page);
        self.injectResultsList(results);
        self.injectResultsPager({
          $form,
          current: page,
          total: totalPages,
          noResults: !results.length
        });
      } catch (err) {
        // TODO Show error to user
        console.log('err ===> ', err);
      }
    };

    self.getFormData = ($form) => {
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

      if (!numResults) {
        $resultsLabel.empty();
        $resultsLabel.append('No Results');

        return;
      }

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
          ${self.getHtmlListItem(item)}
        `;
      }, '');

      $items.empty();
      $items.append(htmlToInject);
    };

    self.getHtmlListItem = (item) => {
      return `
      <div class="apos-manage-grid-piece">
      <div class="apos-manage-grid-image">
        <img src="${item.urls.thumb}" alt="image from Unsplash" />
        <div class="apos-image-screen" />
        <div class="apos-manage-grid-piece-controls">
          <button class="apos-button apos-button--minor">
            Infos
          <i class="fa fa-caret-right" />
          </button>
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

    self.injectResultsPager = ({
      $form, current, total, noResults
    }) => {
      const $pager = self.$el.find('[data-media-sources-pager]');

      const htmlPager = self.getHtmlPager({
        current,
        total,
        noResults
      });

      $pager.empty();
      $pager.append(htmlPager);

      const pagerLinks = $pager.find('[data-apos-page]');

      pagerLinks.each((index, item) => {
        const page = $(item).data('apos-page');

        $(item).on('click', () => {
          self.requestMediaSource($form, page);
        });

      });
    };

    self.getHtmlPagerItem = ({
      num,
      isLast,
      isActive,
      isFirst
    }) => {
      return `<span class="apos-pager-number${
        isFirst ? ' apos-first' : ''}${
        isLast ? ' apos-last' : ''}${
        isActive ? ' apos-active' : ''}">${
        !isActive ? `<a data-apos-page=${num}>${num}</a>` : num}</span>`;
    };

    self.getHtmlPager = ({
      current, total, noResults
    }) => {
      if (noResults) {
        return self.getHtmlPagerItem({ num: 1 });
      }

      const maxPages = 6;
      const pagerSize = (total < maxPages ? total : maxPages);

      // We add two for the gap and the last page
      const pagerIterator = [ ...Array(pagerSize + 2).keys() ];

      const pagerToInject = pagerIterator.reduce((acc, index) => {
        const pagerNumber = index + 1;

        const gapItem = '<span class="apos-pager-gap">...</span>';

        // Depending on where we are in the pages, render the right
        // page number at the right place
        const numberToRender = (lastPages = false) => {
          switch (pagerNumber) {
            case 2:
              return lastPages ? total - 4 : current - 2;
            case 3:
              return lastPages ? total - 3 : current - 1;
            case 4:
              return lastPages ? total - 2 : current;
            case 5:
              return lastPages ? total - 1 : current + 1;
            case 6:
              return lastPages ? total : current + 2;
          }
        };

        // If we are in intermediate page
        if (current > 4 && current <= total - 4) {
          const num = numberToRender();

          if (num) {
            return `${acc}${pagerNumber === 2 ? gapItem : ''}${self.getHtmlPagerItem({
              num,
              isActive: num === current
            })}`;
          }
        }

        // If the current page is one of the 4 last ones
        if (current > total - 4) {
          const num = numberToRender(true);

          if (num) {
            return `${acc}${pagerNumber === 2 ? gapItem : ''}${self.getHtmlPagerItem({
              num,
              isActive: num === current
            })}`;
          }

          // We dont render the 2 last pagers
          if (pagerNumber > 6) {
            return acc;
          }
        } else {
          // If we aren't in last pages, we want a gap and the last page
          if (pagerNumber === pagerSize + 1) {
            return `${acc}${gapItem}`;
          }
          if (pagerNumber === pagerSize + 2) {
            return `${acc}${self.getHtmlPagerItem({
              num: total,
              isLast: true
            })}`;
          }
        }

        const item = self.getHtmlPagerItem({
          num: pagerNumber,
          isActive: pagerNumber === current,
          isFirst: pagerNumber === 1
        });

        return `${acc}${item}`;
      }, '');

      return pagerToInject;
    };
  }
});
