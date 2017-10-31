import Ember from 'ember';
import { computed } from 'ember-decorators/object'; // eslint-disable-line
import union from 'npm:@turf/union';

const { get } = Ember;
const { service } = Ember.inject;

export default Ember.Service.extend({
  registeredLayers: service(),
  mapMouseover: service(),

  currentEvent: null,

  highlightedFeatures: [],

  tooltipTemplate: '',
  highlightedLayer: null,

  @computed('currentEvent')
  mousePosition(event) {
    if (event) {
      const { point: { x, y } } = event;

      return {
        x,
        y,
      };
    }

    return null;
  },

  @computed('mousePosition.x', 'mousePosition.y')
  hasMousePosition(x, y) {
    return !!(x && y);
  },

  @computed('registeredLayers.visibleLayerIds.@each', 'currentEvent', 'mousePosition')
  hoveredFeature(layers, currentEvent) {
    if (currentEvent) {
      const map = currentEvent.target;

      return map
        .queryRenderedFeatures(
          currentEvent.point,
          { layers },
        )
        .objectAt(0) || {};
    }
    return {};
  },

  @computed('hoveredFeature')
  tooltipText(feature) {
    return get(feature, 'properties.bbl');
  },

  @computed('highlightedFeatures')
  highlightedFeatureSource(features) {
    return {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    };
  },

  highlighter(e, source, sourceLayer, uniqueidProperty) {
    const map = e.target;
    this.set('currentEvent', e);

    // of all registered layers, we only want to query the ones
    // that exist on the map AND are highlightable

    const layers = this.get('registeredLayers.highlightableAndVisibleLayerIds');
    const features = map.queryRenderedFeatures(e.point, { layers });


    if (features.length > 0) {
      map.getCanvas().style.cursor = 'pointer';
      //
      const thisFeature = features[0];
      const uniqueId = thisFeature.properties[uniqueidProperty];

      const sourceFeatures = map.querySourceFeatures(source, {
        sourceLayer,
        filter: ["==", uniqueidProperty, uniqueId]
      });

      let unionedFeature = {}

      // join them together
      if (sourceFeatures.length > 1) {
          unionedFeature = sourceFeatures[0];
          for (var i = 1; i < sourceFeatures.length; i++) {
              unionedFeature = union(unionedFeature, sourceFeatures[i]);
          }
      }

      console.log('unionedFeature', unionedFeature);

      const prevFeature = this.get('highlightedFeatures')[0];
      if (!prevFeature || thisFeature.properties[uniqueidProperty] !== prevFeature.properties[uniqueidProperty]) {
        console.log('setting new highlighted features')
        this.set('highlightedFeatures', sourceFeatures);
        console.log(this.get('highlightedFeatureSource'))

        // move the layer
        const layerId = thisFeature.layer.id;
        this.set('highlightedLayer', layerId);

        const beforeLayerId = map.getStyle().layers.reduce((acc, curr) => {
          if (curr.id === layerId) return 'hit';
          if (acc === 'hit') return curr;
          return acc;
        }).id;

        if (map.getLayer('highlighted-feature')) {
          map.moveLayer('highlighted-feature', beforeLayerId);
        }
      }

      this.set('tooltipTemplate', this.get('registeredLayers').getTooltipTemplate(thisFeature.layer.id));
    } else {
      map.getCanvas().style.cursor = '';

      this.set('highlightedFeatures', []);
    }
  },
});
