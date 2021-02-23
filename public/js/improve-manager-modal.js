apos.define('apostrophe-images-manager-modal', {
  extend: 'apostrophe-pieces-manager-modal',

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

    const superEnableButtonEvents = self.enableButtonEvents;
    self.enableButtonEvents = function() {
      // focus on single click
      self.$el.on('click', '[data-focus-' + options.name + ']', function(e) {
        // If the click was actually on the edit button, we should
        // focus and toggle the selection only if the image was not already
        // part of the selection. Otherwise images disappear from the
        // selection as they are edited which is very confusing. -Tom
        if ($(e.target).attr('data-apos-edit-apostrophe-image')) {
          const $checkbox = $(this).find('input[type="checkbox"]');
          if ($checkbox.prop('checked')) {
            return;
          }
        }
        e.preventDefault();
        self.focusElement($(this));
      });

      // edit on double click
      self.$el.on('dblclick', '[data-edit-dbl-' + options.name + ']', function() {
        const id = $(this).attr('data-edit-dbl-' + options.name);
        self.manager.edit(id);
      });

      // toggle selection mode on checkmark select
      superEnableButtonEvents();
    };

    self.focusElement = function($el) {
      // set checkbox to :checked, and trigger change event
      const $checkbox = $el.find('input[type="checkbox"]');

      // only toggle if either the checkbox is already checked
      // or the chooser is not full. Always release a checked box
      if ($checkbox.prop('checked') || (!(self.chooser && self.chooser.full))) {
        $el.toggleClass('apos-focus');
        $checkbox.prop('checked', function(i, currentState) {
          return !currentState;
        });
        $checkbox.trigger('change');
        $el.toggleClass('apos-focus', $checkbox.prop('checked'));
      }
    };

    const superDisplayChoiceInCheckbox = self.displayChoiceInCheckbox;
    self.displayChoiceInCheckbox = function(id, state) {
      const $checkbox = superDisplayChoiceInCheckbox(id, state);
      $checkbox.parent('label').toggleClass('apos-focus', state);
      $checkbox.closest('[data-piece]').toggleClass('apos-focus', state);
      return $checkbox;
    };
  }
});
