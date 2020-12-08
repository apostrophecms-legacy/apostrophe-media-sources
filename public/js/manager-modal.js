apos.define('apostrophe-images-manager-modal', {
  extend: 'apostrophe-pieces-manager-modal',

  construct: function(self, options) {
    const superAfterRefresh = self.afterRefresh;

    apos.refreshImages = self.refresh;

    self.afterRefresh = function (callback) {
      const $mediaSources = self.$el.find('[data-media-sources]');

      const mediaSourceConnectors = JSON.parse(apos.mediaSourceConnectors);
      const $connectors = mediaSourceConnectors.reduce((acc, connector) => {
        return `${acc}<option>${connector.label}</option>`;
      }, '');

      const selectClasses = 'class="apos-field-input apos-field-input-select"';

      const $select =
        `<select name="media-sources" ${selectClasses}>
          <option>Apostrophe</option>
          ${$connectors}
        </select>`;

      $mediaSources.append($select);

      superAfterRefresh(callback);

      self.$el.on('change', 'select[name="media-sources"]', function() {
        const { value } = this;
        if (value.toLowerCase() !== 'apostrophe') {
          apos.create('media-sources-browser', {
            action: self.action,
            body: {
              provider: value,
              refresh: self.refresh
            }
          });
          // Select "Apostrophe" in the dropdown: when coming back,
          // the user can select again what he has just selected
          setTimeout(() => (this.selectedIndex = 0), 250);
        }
      });
    };
  }
});

apos.define('media-sources-browser', {
  extend: 'apostrophe-modal',
  source: 'media-sources-browser',
  construct: (self, options) => {
    self.results = [];
    self.choices = [];
    self.currentPage = 1;
    self.totalPages = 0;

    self.resizeContentHeight = () => {};

    self.beforeShow = async (callback) => {
      self.$manageView = self.$el.find('[data-apos-manage-view]');
      self.$filters = self.$modalFilters.find('[data-filters]');
      self.$items = self.$el.find('[data-items]');
      self.$searchInput = self.$el.find('.apos-modal-filters-search [data-media-sources-filter]')[0];
      self.provider = self.$filters.attr('data-provider');

      const mediaSourceConnectors = JSON.parse(apos.mediaSourceConnectors);

      self.mediaSourceConnector = mediaSourceConnectors
        .find((connector) => connector.label === self.provider);

      self.enableCheckboxEvents();
      self.enableInputsListeners();
      self.disableOrEnableFilters();
      await self.requestMediaSource(1);

      self.link('apos-import', async function() {
        apos.ui.globalBusy(true);
        const files = self.choices.map(choice => self.results
          .find(result => result.mediaSourceId === choice));
        const formData = {
          files,
          connector: self.mediaSourceConnector.name
        };

        await apos.utils.post(`${self.mediaSourceConnector.action}/download`, formData);

        apos.refreshImages();
        apos.ui.globalBusy(false);
        self.hide();
      });

      callback();
    };

    self.enableInputsListeners = () => {
      // Make search when clicking on enter
      self.$filters.keypress(({ originalEvent }) => {
        if (originalEvent.charCode === 13) {
          self.requestMediaSource(1);
        }
      });

      $(document).keydown(({ originalEvent }) => {
        // Left arrow
        if (originalEvent.keyCode === 37) {
          const isFirstPage = self.currentPage === 1;
          self.requestMediaSource(isFirstPage ? self.totalPages : self.currentPage - 1);
        } else if (originalEvent.keyCode === 39) {
          const isLastPage = self.currentPage === self.totalPages;
          self.requestMediaSource(isLastPage ? 1 : self.currentPage + 1);
        }
      });

      self.$el.on('change', 'select[data-media-sources-filter]', function() {
        self.requestMediaSource(1);
      });

      self.$el.on('input', 'input[data-media-sources-filter]', debounce(function() {
        const hasNoValue = !self.$searchInput.value.length;

        self.disableOrEnableFilters(hasNoValue, 'search');

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
    };

    self.disableOrEnableFilters = (disable = true, dependency) => {
      const allFilters = [
        ...self.mediaSourceConnector.standardFilters,
        ...self.mediaSourceConnector.customFilters
      ];

      allFilters.forEach((filter) => {
        if (filter.dependsOn) {
          const $filter = self.$filters.find(`[name="${filter.name}"]`);

          if (!dependency) {
            $filter.prop('disabled', disable);
          }

          if (dependency && filter.dependsOn.includes('search')) {
            const inputType = $filter.prop('type');
            if (inputType === ('select-one') && disable) {
              $filter[0].selectedIndex = 0;
            }
            $filter.prop('disabled', disable);
          }
        }
      });
    };

    self.enableCheckboxEvents = () => {
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

    self.requestMediaSource = async (page = 1) => {
      try {
        const formData = {
          ...self.getFormData(self.$filters),
          page,
          connector: self.mediaSourceConnector.name
        };

        const {
          results,
          total,
          totalPages
        } = await apos.utils.post(`${self.mediaSourceConnector.action}/find`, formData);

        self.currentPage = page;
        self.totalPages = totalPages;
        self.results = results;

        self.injectResultsLabel(results.length, total, page);
        self.injectResultsList(results);
        self.injectResultsPager({
          current: page,
          total: totalPages
        });

      } catch (err) {
        // TODO Show error to user
      }
    };

    self.afterShow = (callback) => {
      if (self.$searchInput) {
        self.$searchInput.focus();
      }
      return callback;
    };

    self.getFormData = () => {
      const filters = self.$filters.find('[data-media-sources-filter]');
      const values = {};

      filters.each(function() {
        if (this.value) {
          values[this.name] = this.value;
        }
      });

      return values;
    };

    self.injectResultsLabel = (numResults, total, page) => {
      const $resultsLabel = self.$el.find('[data-result-label]');
      const { perPage, totalResults } = self.mediaSourceConnector;
      const isLastPage = page !== 1 && (numResults < perPage);

      if (!numResults) {
        $resultsLabel.empty();
        $resultsLabel.append('No Results');

        return;
      }

      const end = isLastPage
        ? total
        : page * perPage;

      const start = end - (numResults - 1);

      const limitedResultsMsg = total > totalResults
        ? ` (Results have been limited around ${totalResults})`
        : '';

      $resultsLabel.empty();
      $resultsLabel.append(`Showing ${start} - ${end} of ${total}${limitedResultsMsg}`);
    };

    self.injectResultsList = (results) => {
      const htmlToInject = results.reduce((acc, item) => {
        return `
          ${acc}
          ${self.getHtmlListItem(item)}
        `;
      }, '');

      self.$items.empty();
      self.$items.append(htmlToInject);

      const items = self.$items.find('.apos-manage-grid-piece');

      items.each((index, item) => {
        const button = $(item).find('.apos-manage-grid-piece-controls button');

        $(button).on('click', () => {
          const itemId = $(item).data('media-source-id');
          const data = self.results.find((item) => item.mediaSourceId === itemId);

          apos.create('media-sources-preview', {
            action: self.action,
            transition: 'slide',
            body: {
              item: data,
              provider: self.body.provider
            }
          });

          apos.hideMediaSourcesBrowser = self.hide;
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
      current,
      total
    }) => {
      const $pager = self.$el.find('[data-media-sources-pager]');

      const htmlPager = self.getHtmlPager({
        current,
        total
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
      total
    }) => {
      if (!self.results.length) {
        return self.getHtmlPagerItem({
          num: 1,
          isActive: true
        });
      }

      const maxPages = 6;
      const pagerSize = (total < maxPages ? total : maxPages);

      const hasGaps = total > maxPages;

      // We create an array of numbers to iterate from and
      // we add two for the gap and the last page if more than 4 pages
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

apos.define('media-sources-preview', {
  extend: 'apostrophe-modal',
  transition: 'slide',
  source: 'media-sources-preview',
  construct: (self, options) => {

    self.beforeShow = async (callback) => {
      self.$form = self.$el.find('[data-apos-form]');
      self.provider = self.$form.attr('data-provider');
      self.item = JSON.parse(self.$form.attr('data-item'));

      const mediaSourceConnectors = JSON.parse(apos.mediaSourceConnectors);

      self.mediaSourceConnector = mediaSourceConnectors
        .find((connector) => connector.label === self.provider);

      self.link('apos-import', async function() {
        apos.ui.globalBusy(true);

        const formData = {
          files: [ self.item ],
          connector: self.mediaSourceConnector.name
        };

        await apos.utils.post(`${self.mediaSourceConnector.action}/download`, formData);

        apos.refreshImages();
        apos.hideMediaSourcesBrowser();
        apos.ui.globalBusy(false);
        self.hide();
      });

      callback();
    };

  }
});
