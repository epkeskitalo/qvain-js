<template>
	<div>
	</div>
</template>

<script>
//import {pathToData} from '../schematodata.js'
//import vSchemaNumber from './v-schema-number.vue'
//import vSchemaString from './v-schema-string.vue'
//import vSchemaObject from './v-schema-object.vue'
//import Mapping from './mapping.js'

/* This creates cyclic dependencies because the components are nested: A creates a B which creates an A.
 * 
 * If you are lucky enough to get a warning, it will look like this:
 * 
 *   Failed to mount component: template or render function not defined.
 * 
 * You often won't get a warning, things just don't work correctly, like missing props.
 * 
 * Apparently ES6 doesn't support lazy loading yet. You can't create an intermediate function either,
 * because you will always have the import statements on top. So the only way is to load components lazily
 * when the component is being created by using old module syntax in Webpack.
 * 
 * See also:
 *   https://vuejs.org/v2/guide/components.html#Circular-References-Between-Components
 */

export default {
	name: 'schema-base',
	description: "base widget that all ui widgets inherit from",
	props: ['schema', 'value', 'valtype', 'parent', 'property', 'path', 'tab', 'activeTab', 'depth'],
	methods: {
		newPath: function(prop) {
			//return lvl !== undefined ? this.path + '/' + lvl : this.path
			//if (lvl === undefined) return this.path
			//return this.path.length > 0 ? this.path + '/' + lvl : this.path
			return this.path + '/' + prop
		},
	},
	computed: {
		showPath: function() {
			return this.path.length > 0 ? this.path : "root"
		},
		uniqId: function() {
			return this._uid
		},
		ui: function() {
			// if there was a $ref, use that ref's ui as default and load this path's on top of it
			if (this.schema['$deref']) {
				return Object.assign({}, this.$store.state.hints[this.schema['$deref']], this.$store.getters.uiForPath(this.path))
			}
			return this.$store.getters.uiForPath(this.path)
		},
		uiTab: function() {
			//return this.$store.state.hints[this.path] && this.$store.state.hints[this.path]['tab']
			return this.ui['tab']
		},
		myTab: function() {
			return typeof this.uiTab === 'number' ? this.uiTab : this.tab
		},
		uiTitle: function() {
			return this.ui['title'] || this.schema['title'] || this.property
		},
		uiDescription: function() {
			return this.ui['description'] || this.schema['description']
		},
		uiLabel: function() {
			return this.ui['label'] || this.uiTitle
		},
		uiHelp: function() {
			return this.ui['help']
		},
		uiPlaceholder: function() {
			return this.ui['placeholder']
		},
		inArray: function() {
			return typeof this.property === 'number'
		},
		toplevel: function() {
			return this.$store.state.hints.tabs ? 'tab' in this.ui : true
		},
		/*
		schemaValidation: {
			cache: false,
			get: function() {
				return '.q' in this.schema ? this.schema['.q'] : null
			},
		},
		*/
		/*
		schemaState: {
			cache: false,
			get: function() {
				return '.q' in this.schema ? this.schema['.q'].v : null
			},
		},
		*/
		schemaState: {
			cache: true,
			get: function() {
				var v = (this.$store.state.vState[this.path] || {}).v
				console.log("schemaState triggered")
				if (v) {
					this.$root.$emit('bv::hide::popover', 'jack');
					console.log("emitting hide")
					//this.$root.$emit('bv::disable::popover', 'jack');
				} else {
					//this.$root.$emit('bv::enable::popover', 'jack');
					console.log("emitting show")
					this.$root.$emit('bv::show::popover', 'jack');
				}
				return (this.$store.state.vState[this.path] || {}).v
			},
		},
		showErrors: function() {
			var state = this.$store.getters.getState(this.path)
			return state ? !state.v : undefined
		},
		schemaErrors: {
			cache: false,
			get: function() {
				return (this.$store.state.vState[this.path] || {}).e || []
			},
		},
		validity: {
			cache: false,
			get: function() {
				console.error(this.path)
				return this.$store.getters.getState(this.path) || "not set"
			},
		},
	},
	watch: {
		'validity': function(v) {
			console.warn("schemaState watcher:", v)
			console.log("schemaState watcher:")
			if (v) {
				this.$root.$emit('bv::hide::popover', 'jack');
				this.$root.$emit('bv::disable::popover', 'jack');
			} else {
				this.$root.$emit('bv::enable::popover', 'jack');
				this.$root.$emit('bv::show::popover', 'jack');
			}
		},
	},
	beforeCreate: function () {
		//console.log("c1:", this.$options.components)
		
		//this.$options.components = require('./mapping.js').default
		for (var component in require('./mapping.js').default) {
			this.$options.components[component] = require('./mapping.js').default[component]
		}
	},
}
</script>
