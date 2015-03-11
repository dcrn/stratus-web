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

	this.scriptnav_template = Handlebars.compile(
		$('#scriptnav_template').html());

	this.scriptpanel_template = Handlebars.compile(
		$('#scriptpanel_template').html());

	this.ace_editors = {};
}

Editor.updateCamera = function() {
	var w = $('#sceneEditor').width();
	var h = $('#sceneEditor').height();

	Editor.renderer.setSize(w, h);

	Editor.camera.aspect = w / h;
	Editor.camera.updateProjectionMatrix();
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

	window.addEventListener('resize', function(e) {
		Editor.updateCamera();
	});

	$('a[data-target="#sceneEditorPanel"]').click(function() {
		setTimeout(Editor.updateCamera, 100);
	});

	requestAnimationFrame(Editor.update);
	setInterval(Editor.autoSave, 5000);
}

Editor.update = function() {
	requestAnimationFrame(Editor.update);
	if (Editor.activeScene) {
		for (var entid in Editor.activeScene.entities) {
			var ent = Editor.activeScene.entities[entid];
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

		Editor.renderer.render(
			Editor.activeScene.threeobj, 
			Editor.camera
		);
	}
}

Editor.onEdit = function() {
	Editor.lastEdit = Date.now();
}

Editor.autoSave = function() {
	if (Editor.lastEdit && Editor.lastEdit < (Date.now() - 3000)) {
		$.ajax({
			type:'POST', 
			data: JSON.stringify(Editor.gamedata), 
			url: window.location.pathname + 
				'/gamedata.json'
		});
		delete Editor.lastEdit;
	}

	// Save scripts
	var fname;
	for (var fname in Editor.ace_editors) {
		Editor.saveComponentScript(fname);
	}
}

Editor.saveComponentScript = function(filename) {
	var edit = Editor.ace_editors[filename];
	if (edit) {
		var val = edit.getValue();

		if (val !== edit.lastSavedValue) {
			if (!Editor.validateComponentScript(edit))
				return false;

			$.ajax({
				type:'POST', 
				data: val, 
				url: window.location.pathname + 
					'/components/' + 
					filename
			});

			edit.lastSavedValue = val;
		}
	}
	return true;
}

Editor.validateComponentScript = function(edit) {
	var val = edit.getValue();
	var tab = edit.tabElement

	try {
		eval(val);
	}
	catch (err) {
		var popover = tab.data('bs.popover');
		if (popover) {
			popover.options.content = err.toString();
			if (popover.$tip && popover.$tip.hasClass('in')) {
				tab.popover('show');
			}
		}
		else {
			tab.popover({
				container: 'body',
				title: 'JavaScript Error',
				content: err.toString(),
				trigger: 'hover',
				placement: 'bottom'
			});
		}

		tab.toggleClass('error', true);
		return false;
	}

	edit.tabElement.toggleClass('error', false);
	edit.tabElement.popover('destroy');

	return true;
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
	else if (type == 'list' || type == 'text')
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

	Editor.onEdit();
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
	
	var el = $(this);
	var parent = el.parent();
	var filename = parent.data('id');
	var action = el.data('action');

	if (action == 'edit') {
		$.ajax({
			type:'GET', 
			url: window.location.pathname + 
				'/components/' + 
				filename, 
			success: function(data) {
				Editor.newScriptTab(filename, data);
			}
		});
	}
}

Editor.newScriptTab = function(filename, data) {
	var id = 'script_' + filename.slice(0, -3);

	$('#tablist li[role=presentation].active').
		toggleClass('active');
	$('#tabpanels div[role=tabpanel].active').
		toggleClass('active');

	if ($('#' + id).length > 0) {
		$('[data-filename="' + filename + '"]').
			toggleClass('active')
		return;
	}

	var tab = $(this.scriptnav_template({
		id: id,
		filename: filename
	}));
	var panel = $(this.scriptpanel_template({
		id: id,
		filename: filename
	}));

	$('#tablist').append(tab);
	$('#tabpanels').append(panel);

	$('#tablist [data-filename="'+filename+'"] .closebutton').click(Editor.onCloseTab);

	var texteditor = ace.edit(id);
	texteditor.$blockScrolling = Infinity;
	texteditor.getSession().setMode("ace/mode/javascript");
	texteditor.setValue(data);
	texteditor.clearSelection();
	texteditor.focus();
	texteditor.on('change', function(e) {
		Editor.validateComponentScript(texteditor);
	});

	this.ace_editors[filename] = texteditor;
	texteditor.lastSavedValue = data;
	texteditor.tabElement = tab;
}

Editor.onCloseTab = function(e) {
	e.preventDefault();
	e.stopPropagation();

	var el = $(this).parent().parent();
	var active = el.hasClass('active');
	var filename = el.data('filename');

	var save = Editor.saveComponentScript(filename);
	if (!save) {
		el.popover('show');
		return;
	}

	delete Editor.ace_editors[filename];

	$('#tablist > [data-filename="'+filename+'"]').remove();
	$('#tabpanels > [data-filename="'+filename+'"]').remove();

	if (active)
		$('#tablist > :first-child, #tabpanels > :first-child').
			toggleClass('active');
}
