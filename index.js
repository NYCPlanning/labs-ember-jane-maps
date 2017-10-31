/* eslint-env node */
'use strict';

module.exports = {
  name: 'ember-jane-maps',
  afterInstall: function() {
    return RSVP.all([
      this.addPackageToProject('@turf/union'),
      this.addAddonToProject('ember-browserify'),
    ]);
  },

  isDevelopingAddon: function() {
    return true;
  }
};
