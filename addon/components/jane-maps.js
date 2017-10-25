import Ember from 'ember';
import EmberMapboxGL from 'ember-mapbox-gl/components/mapbox-gl';
import layout from '../templates/components/jane-maps';


import { ParentMixin } from 'ember-composability-tools';

const { service } = Ember.inject;

export default EmberMapboxGL.extend(ParentMixin, {
  layout,

  init(...args) {
    this._super(...args);

    this.set('registeredLayers.layers', this.get('childComponents'));
  },
  registeredLayers: service(),
});
