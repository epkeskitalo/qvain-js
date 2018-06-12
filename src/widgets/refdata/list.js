import vSchemaBase from '../v-schema-base.vue'
import esApiClient from './es.js'

function groupByParent(objectArray) {
	var grouped = objectArray.reduce(function (acc, obj) {
		if (!obj['_source']) return acc

		// get rid of the annoying _source level
		obj = obj['_source']

		// if a value doesn't have parent_ids, add it to empty key
		var targets = obj['parent_ids'] || ['']

		// group top categories with their children
		if (targets.length < 1) {
			targets = obj['has_children'] ? [obj.id] : ['']
		}

		for (let key of targets) {
			if (!acc[key]) {
				acc[key] = { group: null, children: [] }
			}
			if (obj.id === key) {
				// group item
				acc[key].group = obj
			} else {
				// child item
				acc[key].children.push(obj)
			}
		}
		return acc
	}, {})

	// pre-sort children
	Object.keys(grouped).forEach(group => grouped[group].children.sort(sortById))

	return grouped
}

const sortById = (a, b) => a.id < b.id ? -1 : (a.id > b.id ? 1 : 0)

function filterKeys(full, wanted) {
	return Object.keys(full)
		.filter(key => wanted.includes(key))
		.reduce((obj, key) => {
			obj[key] = full[key]
			return obj
		}, {})
}

export default {
	extends: vSchemaBase,
	name: 'refdata-list',
	description: "refdata list from Elastic Search",
	schematype: 'object',
	props: {
		esIndex: {
			default: "reference_data",
			type: String
		},
		esDoctype: {
			default: "funder_type", // funder_type, license
			type: String
		},
		optgroups: {
			default: false,
			type: Boolean,
		},
	},
	data: function() {
		return {
			//selected: null,
			staticItems: [{"id":"funder_type_tekes","code":"tekes","type":"funder_type","uri":"http://purl.org/att/es/reference_data/funder_type/funder_type_tekes","wkt":"","label":{"fi":"Tekes","en":"Tekes","und":"Tekes"},"parent_ids":[],"child_ids":[],"has_children":false,"same_as":[]},{"id":"funder_type_tekes-shok","code":"tekes-shok","type":"funder_type","uri":"http://purl.org/att/es/reference_data/funder_type/funder_type_tekes-shok","wkt":"","label":{"fi":"Tekes SHOK","en":"Tekes SHOK","und":"Tekes SHOK"},"parent_ids":[],"child_ids":[],"has_children":false,"same_as":[]},{"id":"funder_type_eu-esr","code":"eu-esr","type":"funder_type","uri":"http://purl.org/att/es/reference_data/funder_type/funder_type_eu-esr","wkt":"","label":{"fi":"EU Euroopan sosiaalirahasto ESR","en":"EU European Social Fund ESR","und":"EU Euroopan sosiaalirahasto ESR"},"parent_ids":[],"child_ids":[],"has_children":false,"same_as":[]},{"id":"funder_type_eu-other","code":"eu-other","type":"funder_type","uri":"http://purl.org/att/es/reference_data/funder_type/funder_type_eu-other","wkt":"","label":{"fi":"EU muu rahoitus","en":"EU other funding","und":"EU muu rahoitus"},"parent_ids":[],"child_ids":[],"has_children":false,"same_as":[]},{"id":"funder_type_commercial","code":"commercial","type":"funder_type","uri":"http://purl.org/att/es/reference_data/funder_type/funder_type_commercial","wkt":"","label":{"fi":"Yritys","en":"Commercial","und":"Yritys"},"parent_ids":[],"child_ids":[],"has_children":false,"same_as":[]},{"id":"funder_type_academy-of-finland","code":"academy-of-finland","type":"funder_type","uri":"http://purl.org/att/es/reference_data/funder_type/funder_type_academy-of-finland","wkt":"","label":{"fi":"Suomen Akatemia","en":"Academy of Finland","und":"Suomen Akatemia"},"parent_ids":[],"child_ids":[],"has_children":false,"same_as":[]},{"id":"funder_type_eu-framework-programme","code":"eu-framework-programme","type":"funder_type","uri":"http://purl.org/att/es/reference_data/funder_type/funder_type_eu-framework-programme","wkt":"","label":{"fi":"EU puiteohjelmat","en":"EU Framework Programme","und":"EU puiteohjelmat"},"parent_ids":[],"child_ids":[],"has_children":false,"same_as":[]},{"id":"funder_type_eu-eakr","code":"eu-eakr","type":"funder_type","uri":"http://purl.org/att/es/reference_data/funder_type/funder_type_eu-eakr","wkt":"","label":{"fi":"EU Euroopan aluekehitysrahasto EAKR","en":"EU Regional Development Fund EAKR","und":"EU Euroopan aluekehitysrahasto EAKR"},"parent_ids":[],"child_ids":[],"has_children":false,"same_as":[]},{"id":"funder_type_finnish-fof","code":"finnish-fof","type":"funder_type","uri":"http://purl.org/att/es/reference_data/funder_type/funder_type_finnish-fof","wkt":"","label":{"fi":"Kotimainen rahasto tai säätiö","en":"Finnish fund or foundation","und":"Kotimainen rahasto tai säätiö"},"parent_ids":[],"child_ids":[],"has_children":false,"same_as":[]},{"id":"funder_type_foreign-fof","code":"foreign-fof","type":"funder_type","uri":"http://purl.org/att/es/reference_data/funder_type/funder_type_foreign-fof","wkt":"","label":{"fi":"Ulkomainen rahasto tai säätiö","en":"Foreign fund or foundation","und":"Ulkomainen rahasto tai säätiö"},"parent_ids":[],"child_ids":[],"has_children":false,"same_as":[]},{"id":"funder_type_other-public","code":"other-public","type":"funder_type","uri":"http://purl.org/att/es/reference_data/funder_type/funder_type_other-public","wkt":"","label":{"fi":"Muu julkinen rahoitus","en":"Other public funding","und":"Muu julkinen rahoitus"},"parent_ids":[],"child_ids":[],"has_children":false,"same_as":[]}],
			items: null,
			byId: {},
			//items: null,
			error: null,
			busy: false,
			filterApiFields: true,
			lang: "en",
			apiFields: ['code', 'id', 'label', 'type', 'uri'],
		}
	},
	methods: {
		getList: function(index, doctype) {
			this.busy = true
			var vm = this
			esApiClient(index, doctype)
				.then(response => {
					if (response.data && response.data.hits && response.data.hits.hits) {
						if (this.optgroups) {
							vm.items = groupByParent(response.data.hits.hits)
						} else {
							let items = response.data.hits.hits
							vm.items = vm.filterApiFields ? items.map(item => filterKeys(item['_source'], vm.apiFields)) : items.map(item => item['_source'])
						}
						vm.error = null
					} else {
						vm.items = []
						vm.error = "no data"
					}
				})
				.catch(error => {
					console.log(error)
					this.error = "error calling ElasticSearch API"
					console.log(Object.keys(error))
					if (error.response && error.response.status) {
						this.error += ": " + error.response.status + (error.response.statusText ? "(" + error.response.statusText + ")" : "")
					}
				})
				// "finally() is not a function" :(
				//.finally(() => {
					vm.busy = false
				//})
		},
		indexOf: function(id) {
			if (!this.items) {
				return -1
			}
			for (let i = 0; i < this.items.length; i++) {
				if (this.items['id'] === id) {
					return i
				}
			}
			return -1
		},
	},
	computed: {
		selected: {
			get () {
				//return this.$store.state.obj.message
				//return this.value
				if (this.value && this.value['id']) {
					let index = this.indexOf(this.value.id)
					if (index >= 0) {
						return this.items[index]
					}
				}
				return null
			},
			set (value) {
				//this.$store.commit('updateMessage', value)
				//console.log("selected:", value)
				//this.$store.commit('updateValue', { p: this.parent, prop: this.property, val: this.items[value] })
				this.$store.commit('updateValue', {
					p: this.parent,
					prop: this.property,
					val: {
						'identifier': value.uri,
						'pref_label': value.label,
						'id': value.id,
					}
				})
			}
		},
		groups: function() {
			return this.items ? Object.keys(this.items).sort() : []
		},
		noGroupItems: function() {
			return this.items && this.items[''] && this.items[''].children ? this.items[''].children : []
		},
		placeholder: function() {
			return this.ui['placeholder'] || "Select an option:"
		}
	},
	created() {
		//console.log("refdata widget", this.value)
		//this.getList("reference_data", "funder_type")
		this.getList(this.esIndex, this.esDoctype)
	},
}
