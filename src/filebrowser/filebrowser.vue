<template>
	<div>
		<b-tabs pills card vertical @input="getProjectForTab">
			<b-tab :title="`Project ${project}`" v-for="project in projects" :key="project">
				<filelist :project="project" :root="rootId" :path="path"></filelist>
			</b-tab>
		</b-tabs>
	</div>
</template>

<script>
import vFileList from './filelist.vue'
import axios from 'axios'

var API_PROJECT_ROOT_URL = "https://metax-test.csc.fi/rest/directories/root"

export default {
	name: "browser",
	props: ["project", "relpath"],
	data: function() {
		return {
			tabIndex: 0,
			error: null,
			rootId: null,
		}
	},
	methods: {
		getProjectForTab: function(index) {
			console.log("filebrowser getFilesForProject:", index, this.tabIndex, this.projects[index])
			//this.$router.push({ name: "files", params: { project: this.projects[index], relpath: this.relpath || '/' }})
			// apparently this event gets triggered also on first load for the first tab; only change the url if it was an actual click
			if (this.tabIndex !== index) {
				console.log("relpath:", relpath)
				this.$router.push({ name: "files", params: { project: this.projects[index], relpath: "/" }})
			}
			this.tabIndex = index
			//this.getRootForProject(this.projects[index])
		},
		getRootForProject: function(project) {
			var v = this
			
			console.log("DEBUG getting root for project", project)
			axios.get(API_PROJECT_ROOT_URL, {
				params: { project: project }
			})
				.then(function (response) {
					console.log("status:", response.status)
					v.processRoot(response.data, v.$data)
				})
				.catch(function (error) {
					console.log(error)
				})
		},
		processRoot: function(response, data) {
			if (!('id' in response)) data.error = "empty"
			console.log("root id:", response.id)
			data.rootId = response.id
			console.log("rootId set to:", data.rootId)
		},
	},
	computed: {
		path: function() {
			return this.relpath ? '/' + this.relpath : '/'
		},
		user: function() {
			//return this.$store.state.auth.user
			return this.$store.getters['auth/getUserName']
		},
		projects: function() {
			return this.$store.getters['auth/getProjects']
		},
	},
	watch: {},
	components: {
		'filelist': vFileList,
	},
	created() {
		//console.log("store:", this.$store.getters)
		console.log("filebrowser for project", this.project, "at", this.path)
		if (this.path.indexOf(",") >= 0) {
			console.log("comma in path!", this.path)
		}
		//this.$router.push({ name: "files", params: { project: this.project, relpath: this.relpath || [] }})
		this.$router.push({ name: "files", params: { project: this.project, relpath: this.relpath || [] }})
	},
}
</script>
