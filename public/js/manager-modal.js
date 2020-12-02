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
    self.results = [];
    self.choices = [];

    self.resizeContentHeight = () => {};

    // const superBeforeShow = self.beforeShow;
    self.beforeShow = async (done) => {
      self.$manageView = self.$el.find('[data-apos-manage-view]');
      self.$filters = self.$modalFilters.find('[data-filters]');

      self.enableCheckboxEvents();
      await self.requestMediaSource(1);

      // Make search when clicking on enter
      self.$filters.keypress(({ originalEvent }) => {
        if (originalEvent.charCode === 13) {
          self.requestMediaSource(1);
        }
      });

      self.$el.on('change', 'select[data-media-sources-orientation]', function() {
        self.requestMediaSource(1);
      });

      self.$el.on('input', 'input[data-media-sources-search]', debounce(function() {
        self.requestMediaSource(1);
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

    self.enableCheckboxEvents = function() {
      self.$el.on('change', 'input[type="checkbox"][name="select-all"]', function () {
        const checked = $(this).prop('checked');
        const $pieces = self.$el.find('[data-piece]');

        $pieces.each(function() {
          const id = $(this).attr('data-media-source-id');

          $(this).find('input[type="checkbox"]').prop('checked', checked);
          self.addOrRemoveChoice(id, !checked);
        });
        self.toggleImportButton();
      });

      self.$el.on('change', '[data-piece] input[type="checkbox"]', function(e) {
        const $box = $(this);
        const id = $box.closest('[data-piece]').attr('data-media-source-id');

        self.addOrRemoveChoice(id, !$box.prop('checked'));
        self.toggleImportButton();
      });

      // Add ability to select multiple checkboxes (Using Left Shift)
      let lastChecked;
      // Clicks on checkbox directly are not possible because as visibility:hidden is set on it and clicks won't be detected.
      self.$el.on('click', '.apos-field-input-checkbox-indicator', function (e) {
        const box = $(this).siblings('.apos-field-input-checkbox')[0];

        // Store a variable called lastchecked to point to the last checked checkbox. If it is undefined it's the first checkbox that's selected.
        if (!lastChecked) {
          lastChecked = box;
          return;
        }

        // If shift key is pressed and the checkbox is not checked.
        if (e.shiftKey) {
          if (!box.checked) {
            const $checkboxesInScope = $(box).closest('[data-items]').find('input') || [];
            const startIndex = $checkboxesInScope.index(box);
            const endIndex = $checkboxesInScope.index(lastChecked);

            $checkboxesInScope.slice(
              Math.min(startIndex, endIndex),
              Math.max(startIndex, endIndex) + 1
            ).each(function (i, el) {
              $(el).prop('checked', true);
              $(el).trigger('change');
            });
          } else {
            const $pieces = self.$el.find('[data-piece]');
            const currentId = $(box).attr('data-media-source-id');
            $pieces.each(function() {
              const id = $(this).attr('data-media-source-id');

              if (id !== currentId) {
                $(this).find('input[type="checkbox"]').prop('checked', false);
                self.addOrRemoveChoice(id, true);
              }
            });
          }
        }
        self.toggleImportButton();
        lastChecked = box;
      });
    };

    self.toggleImportButton = () => {
      const $importButton = self.$el.find('[data-apos-import]');

      if (self.choices.length) {
        $importButton.removeClass('apos-button--disabled');
      } else {
        $importButton.addClass('apos-button--disabled');
      }
    };

    self.addOrRemoveChoice = (id, remove = false) => {
      if (remove) {
        self.choices = self.choices.filter((choiceId) => choiceId !== id);
        return;
      }

      self.choices.push(id);
    };

    self.requestMediaSource = async (page) => {
      try {
        const formData = {
          ...self.getFormData(self.$filters),
          page
        };

        const { action } = self.$filters.data();

        const {
          results,
          total,
          totalPages
        } = await apos.utils.post(action, formData);

        self.injectResultsLabel(results.length, total, page);
        self.injectResultsList(results);
        self.injectResultsPager({
          current: page,
          total: totalPages,
          noResults: !results.length
        });

        self.results = results;
      } catch (err) {
        // TODO Show error to user
        console.log('err ===> ', err);
      }
    };

    self.getFormData = () => {
      const widthValue = self.$filters.find('[data-media-sources-width-value]').val();
      const widthRange = self.$filters.find('[data-media-sources-width-range]').val();
      const heightValue = self.$filters.find('[data-media-sources-height-value]').val();
      const heightRange = self.$filters.find('[data-media-sources-height-range]').val();
      const orientation = self.$filters.find('[data-media-sources-orientation]').val();
      const extension = self.$filters.find('[data-media-sources-extension]').val();
      const search = self.$filters.find('[data-media-sources-search]').val();

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

      const items = $items.find('.apos-manage-grid-piece');

      items.each((index, item) => {
        const button = $(item).find('.apos-manage-grid-piece-controls button');

        $(button).on('click', () => {
          const itemId = $(item).data('media-source-id');
          const data = self.results.find((item) => item.mediaSourceId === itemId);

          apos.create('media-source-browser-editor', {
            action: self.action,
            transition: 'slide',
            body: {
              item: data,
              provider: self.body.provider
            }
          });
        });

      });
    };

    self.getHtmlListItem = (item) => {
      return `
      <div class="apos-manage-grid-piece" data-piece data-media-source-id="${item.mediaSourceId}">
      <div class="apos-manage-grid-image">
        <img src="${item.thumbLink}" alt="image from Unsplash" />
        <div class="apos-image-screen" />
        <div class="apos-manage-grid-piece-controls">
          <button class="apos-button apos-button--minor">
            Infos
          <i class="fa fa-caret-right" />
          </button>
        </div>
      </div>
      <div class="apos-manage-grid-piece-label">${item.title}</div>
      <label>
        <input type="checkbox" class="apos-field-input apos-field-input-checkbox" />
        <span class="apos-field-input-checkbox-indicator"></span>
      </label>
    </div>`;
    };

    self.injectResultsPager = ({
      current, total, noResults
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
          self.requestMediaSource(page);
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
      current,
      total,
      noResults
    }) => {
      if (noResults) {
        return self.getHtmlPagerItem({ num: 1 });
      }

      const maxPages = 6;
      const pagerSize = (total < maxPages ? total : maxPages);

      const hasGaps = total > maxPages;

      // We add two for the gap and the last page if more than 4 pages
      const pagerIterator = [ ...Array(pagerSize + (hasGaps ? 2 : 0)).keys() ];

      const pagerToInject = pagerIterator.reduce((acc, index) => {
        const pagerNumber = index + 1;

        const gapItem = hasGaps ? '<span class="apos-pager-gap">...</span>' : '';

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

        if (hasGaps) {
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

apos.define('media-source-browser-editor', {
  extend: 'apostrophe-modal',
  transition: 'slide',
  source: 'media-source-browser-editor',
  construct: (self, options) => {

  }
});
