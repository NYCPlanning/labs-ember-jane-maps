# Ember Jane Maps

Ember Jane Maps is an Ember addon built on top of `ember-mapbox-gl`. It provides a set of tools for building and maintaining complex map-based web applications.

**Which abstract case does this solve?**

Existing Ember addons provide bindings for managing Mapbox GL state. However, some map-based web applications feature a very large number of [layers](https://www.mapbox.com/mapbox-gl-js/style-spec/#layers), each requiring state that may also need to be managed through URL parameters. These requirements lends itself to potentially unmaintainable source code. This addon implements a pattern that has helped with a number of map-based Ember application.

## Installation
`ember install ember-jane-maps`

## How we work

[NYC Planning Labs](https://planninglabs.nyc) takes on a single project at a time, working closely with our customers from concept to delivery in a matter of weeks.  We conduct regular maintenance between larger projects.

## How you can help
Ember Jane Maps is in its infancy and arose from an abstract case observed across numerous projects developed by NYC Planning Labs and the DCP Capital Planning Division. Many aspects are not perfectly documented. You can help just by observing and documenting any friction you notice when setting up this addon. We will continue to improve this library as it is used in a few of our [flagship products](https://planninglabs.nyc/projects/).

In the spirit of free software, everyone is encouraged to help improve this project.  Here are some ways you can contribute:

- Comment on or clarify [issues](https://github.com/NYCPlanning/ember-jane-maps/issues)
- Report [bugs](https://github.com/NYCPlanning/ember-jane-maps/issues)
- Suggest new features
- Write or edit documentation
- Write code (no patch is too small)
  - Fix typos
  - Add comments
  - Clean up code
  - Add new features

**[Read more about contributing.](CONTRIBUTING.md)**

## Requirements

You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (with NPM)
- [Ember CLI](https://ember-cli.com/)

## Local development

- Clone this repo `git clone https://github.com/NYCPlanning/ember-jane-maps.git`
- Install Dependencies `npm install`
- Start the server `ember s`

## Architecture
At a high level, Mapbox GL "sources" and "layers" (which are the styles that you see on the map) may reference each other in many-to-many relationship. Ember Jane Maps works by combining multiple [layers](https://www.mapbox.com/mapbox-gl-js/style-spec/#layers) into a "layer-group". Because sometimes a map "layer" is actually multiple "layers" or "styles" in Mapbox GL parlance, this addon uses the "layer group" concept to allow for easy management of map layers. In short:

 > **Ember Jane Maps' Layer Group = Many Mapbox GL Layers (or Styles)**

### Configuration Data
Mapbox GL layers may be configured with sometimes-large configuration objects, often represented as JavaScript object literals. If an Ember application has 20 layers, there will be 20 separate configuration objects. Ember Jane Maps organizes these configuration objects into separate folders.

You can now generate layer-groups and layer configurations with:

`ember generate layer layer-name`

`ember generate layer-group layer-group-name`

Will generate:
 -> `/layers/layer-name.js`

 -> `/layers/layer-group-name.js`

and is imported like:
`import layerName from '../layers/layer-name'`;

These are explicitly importable - styles may also be reused across layers and layer groups in their definition files.

### API
The API includes a few components and helpers:
 - Components (+ contextual components)
   - `layer-group`
   - `layer-control-timeline`
   - `layer-multi-select-control`
   - `layer-checkbox`
   - `group-checkbox`
   - `cascading-checkbox`
 - Helpers
  - `get-unique-options-for`
  - `extract-layer-stops-for`

_Components_
#### Layer Group
`layer-group` sets up map layers in mapbox-gl based on a given layer definition file. It is a sub-component of `mabox-gl` and must be called as `map.layer-group`.
Properties:
 - `config` (required) - this is accepts a `layer-group` configuration, which is an extension of mapboxGl's layer source definition. You can generate these with `ember g layer-group {layer-group-name}`
- `qps` (optional) - query params - this should be the controller scope so that the `layer-group` can bind its state. Optional.

Example:
```
{{#mapbox-gl as |map|}}
  {{map.layer-group config=pluto qps=qps}}
{{/mapbox-gl}}
```

**Block Context**
`layer-group` yields some of its internals through [contextual components](https://guides.emberjs.com/v2.15.0/components/wrapping-content-in-a-component/#toc_sharing-component-data-with-its-wrapped-content). It also includes subcomponents.

##### Properties / Actions
`visible` - [property] whether layer is visible or not (boolean, true / false)
`update` - [action] `layer-group`'s internal action for updating SQL. It's signature is:
`updateSql(method = 'string', column = 'string', value = [])`, where `method` is any of the named methods (`buildRangeSQL`, `buildMultiSelectSQL`, for now).
`toggleVisibility` - action that may be passed to toggle layer visibility.
`isPending` - boolean (true/false) layer-specific loading state (only the state of the initial handshake, not tiles!)

##### Sub-Components
`timeline-control` - (details below)
`multi-select-control` - (details below)

##### Examples:
```
{{#map.layer-group
  config=zoningMapAmendments
  tagName='li'
  classNames='layer-group clearfix'
  qps=qps as |group|}}

  {{#if group.visible}}
    {{group.timeline-control
        column='effective'
        query-param='zma-effective'}}
  {{/if}}
{{/map.layer-group}}
```

###### Timeline Control
Allows for a range slider with two handles that filter a carto-type layer by a given `date` column.

`column` = SQL column with the date value
`query-param` = control's named query parameter

Example:
```
{{#map.layer-group
  config=zoningMapAmendments
  qps=qps as |group|}}
    {{group.timeline-control
        column='effective'
        query-param='zma-effective'}}
{{/map.layer-group}}
```

###### Multi Select Control
Allows for carto-type layers to be filtered by a list of values. Requires configured subcomponents. Exposes a `layer-checkbox`:
```
{{#group.multi-select-control
column='overlay' as |multiSelect|}}
    {{multiSelect.checkbox
        value='C1-4'}}
      C1-4
{{/group.multi-select-control}}
```
Requires a `column` property that specifies the SQL column used to filter.

###### Group Checkbox
This is the explicit implementation of cascading checkboxes. The other component, cascading-checkboxes, implements this in a more expressive way, but it is hacky and doesn't support deeply nested logic. We should use this explicit group-checkbox until cascading-checkbox can be refactored and cleaned up.

In the example below, each layer-checkbox is given an explicit value for reference. These values do not have to be defined upfront, they just can't collide with anything else in the parent scope.

group-checkbox requires `refs`, `values`, and a `scope`. `refs` should be an array of string values naming the variables used for the group logic. `values` should be an array of the values themselves, passed as variables. The `scope` is the object on which values `get` and `set`.
```
<ul>      
  <li>
    {{group-checkbox
      refs=(array 'c14' 'c24' 'c22' 'c13' 'c23')
      values=(array c14 c24 c22 c13 c23)
      scope=this}}
  </li>
  <li>
    {{multiSelect.checkbox
        value='C1-4'
        checked=c14}} C1-4
  </li>
  <li>
    {{multiSelect.checkbox
        value='C2-4'
        checked=c24}} C2-4
  </li>
  <li>
    {{multiSelect.checkbox
        value='C2-2'
        checked=c22}} C2-2
  </li>
  <li>
    {{multiSelect.checkbox
        value='C1-3'
        checked=c13}} C1-3
  </li>
  <li>
    {{multiSelect.checkbox
        value='C2-3'
        checked=c23}} C2-3
  </li>
</ul>
```

_Helpers_
#### Get Unique Options For
(Helper) Gets unique list options for a given column in a given `sql` query.
```
{{get-unique-options-for 'primaryzone' zoningDistricts.sql}}
```

#### Extract Layer Stops For
(Helper) This grabs the MapboxGL style "stops" from a given `layer-group` and `layer` id.

```
{{extract-layer-stops-for 'layerId' layerConfigObject}}
```

## Testing and checks

- **ESLint** - We use ESLint with Airbnb's rules for JavaScript projects
  - Add an ESLint plugin to your text editor to highlight broken rules while you code
  - You can also run `eslint` at the command line with the `--fix` flag to automatically fix some errors.

- **Testing**
  - run `ember test --serve`
  - Before creating a Pull Request, make sure your branch is updated with the latest `develop` and passes all tests

## Contact us

You can find us on Twitter at [@nycplanninglabs](https://twitter.com/nycplanninglabs), or comment on issues and we'll follow up as soon as we can. If you'd like to send an email, use [labs_dl@planning.nyc.gov](mailto:labs_dl@planning.nyc.gov).
