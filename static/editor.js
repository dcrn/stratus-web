var Editor = Editor || {};

Editor.init = function() {
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	$('#sceneEditor').append(this.renderer.domElement);

	this.renderer.setClearColor(0xE0E0E0);
	this.renderer.shadowMapEnabled = true;

	this.camera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000);
	this.camera.position.set(0, -100, 40);
	this.camera.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2.5);

	this.updateCamera();

	// Handlebars setup
	Handlebars.registerHelper('isArray', 
		function (context, options) {
			if (Handlebars.Utils.isArray(context))
				return options.fn(this);
			else
				return options.inverse(this);
	});

	Handlebars.registerHelper('isEq', 
		function (context, value, options) {
			if (context.valueOf() === value)
				return options.fn(this);
			else
				return options.inverse(this);
	});

	this.explorer_template = Handlebars.compile(
		$('#explorer_template').html());

	this.properties_template = Handlebars.compile(
		$('#properties_template').html());

	this.components_template = Handlebars.compile(
		$('#components_template').html());
}

Editor.updateCamera = function() {
	var w = $('#sceneEditor').width();
	var h = $('#sceneEditor').height();

	this.renderer.setSize(w, h);

	this.camera.aspect = w / h;
	this.camera.updateProjectionMatrix();
}

Editor.load = function(gamedata, repotree) {
	this.gamedata = gamedata;
	this.repotree = repotree;
	this.scenes = Game.load(gamedata);

	if ('config' in gamedata && 'defaultSceneID' in gamedata.config) {
		this.selectedScene = gamedata.config.defaultSceneID;
		this.setActiveScene(
			this.scenes[gamedata.config.defaultSceneID]
		);
	}
}

Editor.start = function() {
	var self = this;
	this.updateExplorer();
	this.updateComponentList();

	function update() {
		requestAnimationFrame(update);
		if (self.activeScene) {
			for (var entid in self.activeScene.entities) {
				var ent = self.activeScene.entities[entid];
				var comps = ent.components();

				for (c in comps) {
					var com = comps[c];
					if ('threeobj' in com) {
						if (ent.has('transform')) {
							var transform = ent.get('transform');
							com.threeobj.position.copy(transform.getPosition());
							com.threeobj.quaternion.copy(transform.getRotation());
							com.threeobj.scale.copy(transform.getScale());
						}
					}
				}
			}

			self.renderer.render(
				self.activeScene.threeobj, 
				self.camera
			);
		}
	}
	requestAnimationFrame(update);

	window.addEventListener('resize', function(e) {
		self.updateCamera();
	});
}

Editor.setActiveScene = function(s) {
	this.activeScene = s;
}

Editor.getActiveScene = function(s) {
	return this.activeScene;
}

Editor.selectScene = function(s) {
	this.selectedScene = s;
	this.selectedEntity = null;

	Editor.explorerOnSelect('scene', s);
	this.updatePropertiesList();
	this.setActiveScene(this.scenes[s]);
}

Editor.selectEntity = function(s, e) {
	this.selectScene(s);
	this.selectedEntity = e;

	Editor.explorerOnSelect('entity', s, e);
	this.updatePropertiesList();
}

Editor.selectComponent = function(s, e, c) {
	this.selectEntity(s, e);
	this.selectedComponent = c;

	Editor.explorerOnSelect('component', s, e, c);
}

// Update views
Editor.updateExplorer = function() {
	var explorer = $('#explorer');
	var html = this.explorer_template(this.gamedata);
	
	explorer.empty();
	explorer.append(html);

	$('#explorer ul.expl li').click(this.explorerOnClick);
	$('#explorer ul.expl li .listtoggle').click(this.explorerOnListToggle);

	if (this.selectedScene) {
		Editor.explorerOnSelect('scene', this.selectedScene);

		if (this.selectedEntity)
			Editor.explorerOnSelect('entity', this.selectedScene, this.selectedEntity);
	}

	// jQuery events
	$('#explorer ul.expl li .actions').tooltip({container:'body'});
	$('#explorer ul.expl li .actions').click(this.explorerOnActionClick);
}

Editor.updateComponentList = function() {
	var components = $('#components');
	var html = this.components_template(this.repotree);

	components.empty();
	components.append(html);

	$('#components ul.expl li').click(this.componentsOnClick);
	$('#components ul.expl li .actions').tooltip({container:'body'});
	$('#components ul.expl li .actions').click(this.componentsOnActionClick);
}

Editor.updatePropertiesList = function() {
	var el = $('#properties');
	var info = {}

	if (this.selectedEntity) {
		var components = this.gamedata
			.scenes[this.selectedScene]
			.entities[this.selectedEntity];

		for (comid in components) {
			info[comid] = {};

			var options = Components.getDefaults(
				comid, 
				components[comid],
				true
			);

			var props = Components.getProperties(comid);
			var val, type;
			for (p in props) {
				val = options[p];
				type = props[p].type;

				if (type == 'colour')
					val = [val >> 16 & 0xFF, val >> 8 & 0xFF, val & 0xFF];

				info[comid][p] = {
					type: type,
					value: val
				};
			}
		}
	}

	var html = this.properties_template(info);
	el.empty();
	el.append(html);

	$('.proptoggle').click(this.propertiesOnPropToggle);
	$('.properties_component input, .properties_component select').on('change input', this.propertiesOnChange);
}

// Events:

/* Explorer */
Editor.explorerOnClick = function(e) {
	e.preventDefault();
	e.stopPropagation();
	var el, type, id;
	el = $(this);
	type = el.data('type');
	id = el.data('id');

	if (type == 'scene') {
		Editor.selectScene(id);
	}
	else if (type == 'entity') {
		Editor.selectEntity(el.data('scene'), id);
	}
	else if (type == 'component') {
		Editor.selectComponent(
			el.data('scene'), 
			el.data('entity'), 
			id);
	}
}

Editor.explorerOnSelect = function(type, s, e, c) {
	var selector = '#explorer ul.expl li[data-type="' + type + '"]';
	if (type == 'entity' || type == 'component')
		selector += '[data-scene="' + s + '"]';
	if (type == 'component')
		selector += '[data-entity="' + e + '"]';

	selector += '[data-id="' + (c || e || s) + '"]';

	if (type == 'component')
		$('#explorer ul.expl li.selected[data-type=component]').
			toggleClass('selected');
	else if (type == 'entity')
		$('#explorer ul.expl li.selected[data-type=entity]').
			toggleClass('selected');
	else
		$('#explorer ul.expl li.selected').toggleClass('selected');

	$(selector).toggleClass('selected');
}

Editor.explorerOnListToggle = function(e) {
	e.preventDefault();
	e.stopPropagation();
	
	var el = $(this);
	el.parent().find('ul:first').toggle();
	var span = el.find('span:first');
	span.toggleClass('glyphicon-folder-open');
	span.toggleClass('glyphicon-folder-close');
}

Editor.explorerOnActionClick = function(e) {
	e.preventDefault();
	e.stopPropagation();
	
}

/* Properties */
Editor.propertiesOnPropToggle = function(e) {
	e.preventDefault();
	e.stopPropagation();
	
	var el = $(this);
	el.parent().parent().find('.form-group').toggle();
	var span = el.find('span:first');
	span.toggleClass('glyphicon-folder-open');
	span.toggleClass('glyphicon-folder-close');
}

Editor.propertiesOnChange = function(e) {
	var el = $(this).parent();

	var ent = Editor.gamedata.scenes[Editor.selectedScene].
		entities[Editor.selectedEntity];
	var comid = el.data('component');
	var prop = el.data('property');
	var type = el.data('type');
	var com = ent[comid];

	if (type == 'bool')
		com[prop] = $(this).prop('checked');
	else if (type == 'number' || type == 'scalar')
		com[prop] = Number.parseFloat($(this).val());
	else if (type == 'list')
		com[prop] = $(this).val();
	else if (type == 'vector' || type == 'quaternion') { // Multi-part inputs
		var x = Number.parseFloat(el.find('[data-axis=x]').val());
		var y = Number.parseFloat(el.find('[data-axis=y]').val());
		var z = Number.parseFloat(el.find('[data-axis=z]').val());
		if (type == 'vector')
			com[prop] = {type: type, parameters: [x, y, z]};
		else if (type == 'quaternion') {
			var w = Number.parseFloat(el.find('[data-axis=w]').val());
			com[prop] = {type: type, parameters: [x, y, z, w]};
		}
	}
	else if (type == 'colour') {
		var r = Number.parseFloat(el.find('[data-axis=r]').val());
		var g = Number.parseFloat(el.find('[data-axis=g]').val());
		var b = Number.parseFloat(el.find('[data-axis=b]').val());
		var c = r << 16 | g << 8 | b;

		com[prop] = c;
	}

	// Update Game object entities
	var comobj = Game.scenes[Editor.selectedScene].
		entities[Editor.selectedEntity].
		get(comid);

	Components.applyOptions(comid, comobj, com);
}

/* Components */
Editor.componentsOnClick = function(e) {
	e.preventDefault();
	e.stopPropagation();
	$('#components ul.expl li.selected').toggleClass('selected');
	$(this).toggleClass('selected');
}

Editor.componentsOnActionClick = function(e) {
	e.preventDefault();
	e.stopPropagation();
	
}
