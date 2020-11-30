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

      self.$el.on('change', 'select[data-media-sources-orientation]', function() {
        self.requestMediaSource($form, 1);
      });

      self.$el.on('input', 'input[data-media-sources-search]', debounce(function() {
        self.requestMediaSource($form, 1);
      }, 500));

      function debounce(func, wait, immediate) {
        let timeout;
        return function() {
          const context = this;
          const args = arguments;

          const later = function() {
            timeout = null;
            !immediate && func.apply(context, args);
          };

          const callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          callNow && func.apply(context, args);
        };
      };

      done();
    };

    self.requestMediaSource = ($form, page) => {
      const formData = {
        ...self.getFormData($form),
        page
      };

      const { action } = $form.data();

      $.post(action, formData, (data) => {

        self.injectResultsLabel(data.results.length, data.total, page);
        self.injectResultsList(data.results);
        self.injectResultsPager({
          $form,
          currentPage: page,
          totalPages: data.totalPages
        });
      });
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

    self.injectResultsPager = ({
      $form, currentPage, totalPages
    }) => {
      const $pager = self.$el.find('[data-media-sources-pager]');

      const htmlPager = self.getHtmlPager(currentPage, totalPages);

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

    self.getHtmlPager = (current, total) => {
      const maxPages = 6;
      const pagerSize = (total < maxPages ? total : maxPages);

      // We add two for the gap and the last page
      const pagerIterator = [ ...Array(pagerSize + 2).keys() ];

      const pagerToInject = pagerIterator.reduce((acc, index) => {
        const pageNumber = index + 1;

        const gapItem = '<span class="apos-pager-gap">...</span>';

        const getHtmlItem = ({
          num,
          isLast,
          isActive,
          isFirst
        }) => {
          return `<span class="apos-pager-number
            ${isFirst ? ' apos-first' : ''}
            ${isLast ? ' apos-last' : ''}
            ${isActive ? ' apos-active' : ''}
            ">
            ${!isActive ? `<a data-apos-page=${num}>${num}</a>` : num}
          </span>`;
        };

        const numberToRender = () => {
          switch (pageNumber) {
            case 2:
              return current - 2;
            case 3:
              return current - 1;
            case 4:
              return current;
            case 5:
              return current + 1;
            case 6:
              return current + 2;
          }
        };

        if (current > 4) {
          const num = numberToRender();

          if (num) {
            return `${acc}${pageNumber === 2 ? gapItem : ''}${getHtmlItem({
              num,
              isActive: num === current
            })}`;
          }

          // if (pageNumber === 2) {
          //   return `${acc}${gapItem}${getHtmlItem({ num: current - 2 })}`;
          // }
          // if (pageNumber === 3) {
          //   return `${acc}${getHtmlItem({ num: current - 1 })}`;
          // }
          // if (pageNumber === 4) {
          //   return `${acc}${getHtmlItem({
          //     num: current,
          //     isActive: true
          //   })}`;
          // }
          // if (pageNumber === 5) {
          //   return `${acc}${getHtmlItem({ num: current + 1 })}`;
          // }
          // if (pageNumber === 6) {
          //   return `${acc}${getHtmlItem({ num: current + 2 })}`;
          // }
        }

        if (pageNumber === pagerSize + 1) {
          return `${acc}${gapItem}`;
        }
        if (pageNumber === pagerSize + 2) {
          return `${acc}${getHtmlItem({
            num: total,
            isLast: true
          })}`;
        }

        // const firstClass = pageNumber === 1 ? ' apos-first' : '';
        // const activeClass = pageNumber === current ? ' apos-active' : '';

        // const item = `<span class="apos-pager-number${firstClass}${activeClass}">
        //   ${!activeClass ? `<a data-apos-page=${pageNumber}>${pageNumber}</a>` : pageNumber}
        // </span>`;

        const item = getHtmlItem({
          num: pageNumber,
          isActive: pageNumber === current,
          isFirst: pageNumber === 1
        });

        return `${acc}${item}`;
      }, '');

      return pagerToInject;
    };
  }
});
