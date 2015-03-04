var Editor = Editor || {};

Editor.init = function() {
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	$('#sceneEditor').append(this.renderer.domElement);

	this.renderer.setClearColor(0xE0E0E0);

	this.camera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000);
	this.camera.position.set(0, -100, 10);
	this.camera.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2);

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
}

Editor.updateCamera = function() {
	var w = $('#sceneEditor').width();
	var h = $('#sceneEditor').height();

	this.renderer.setSize(w, h);

	this.camera.aspect = w / h;
	this.camera.updateProjectionMatrix();

	this.invalidate();
}

Editor.load = function(gamedata) {
	this.gamedata = gamedata;
	this.scenes = Game.load(gamedata);

	if ('config' in gamedata && 'defaultSceneID' in gamedata.config) {
		this.selectedScene = gamedata.config.defaultSceneID;
		this.setActiveScene(
			this.scenes[gamedata.config.defaultSceneID]
		);
	}
}

Editor.invalidate = function() {
	this.paint = true;
}

Editor.start = function() {
	var self = this;
	this.invalidate();
	this.updateExplorer();
	this.updateComponentList();

	function update() {
		requestAnimationFrame(update);
		if (self.paint && self.activeScene) {
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
			self.paint = false;
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
	this.invalidate();
}

Editor.selectEntity = function(s, e) {
	this.selectScene(s);
	this.selectedEntity = e;

	Editor.explorerOnSelect('entity', s, e);
	this.updatePropertiesList();
	this.invalidate();
}

Editor.selectComponent = function(s, e, c) {
	this.selectEntity(s, e);
	this.selectedComponent = c;

	Editor.explorerOnSelect('component', s, e, c);
	this.invalidate();
}

// Update views
Editor.updateExplorer = function() {
	var explorer = $('#explorer');
	var html = this.explorer_template(this.gamedata);
	
	explorer.empty();
	explorer.append(html);

	$('.explorer_item').click(this.explorerOnClick);
	$('.listtoggle').click(this.explorerOnListToggle);

	if (this.selectedScene) {
		Editor.explorerOnSelect('scene', this.selectedScene);

		if (this.selectedEntity)
			Editor.explorerOnSelect('entity', this.selectedScene, this.selectedEntity);
	}

	// jQuery events
	$('.explorer_actions').tooltip({container:'body'});
}

Editor.updateComponentList = function() {

}

Editor.updatePropertiesList = function() {
	var el = $('#properties');
	var properties = {}

	if (this.selectedEntity) {
		var components = this.gamedata
			.scenes[this.selectedScene]
			.entities[this.selectedEntity];

		for (comid in components) {
			properties[comid] = Components.getProperties(comid);
		}
	}

	var html = this.properties_template(properties);
	el.empty();
	el.append(html);

	$('.proptoggle').click(this.propertiesOnPropToggle);
}

// Events:

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
	var selector = '.explorer_item[data-type="' + type + '"]';
	if (type == 'entity' || type == 'component')
		selector += '[data-scene="' + s + '"]';
	if (type == 'component')
		selector += '[data-entity="' + e + '"]';

	selector += '[data-id="' + (c || e || s) + '"]';

	if (type == 'component')
		$('.explorer_item.selected[data-type=component]').
			toggleClass('selected');
	else if (type == 'entity')
		$('.explorer_item.selected[data-type=entity]').
			toggleClass('selected');
	else
		$('.explorer_item.selected').toggleClass('selected');

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

Editor.propertiesOnPropToggle = function(e) {
	e.preventDefault();
	e.stopPropagation();
	
	var el = $(this);
	el.parent().parent().find('.form-group').toggle();
	var span = el.find('span:first');
	span.toggleClass('glyphicon-folder-open');
	span.toggleClass('glyphicon-folder-close')
}