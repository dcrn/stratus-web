/*
 The selection object is what renders around the currently selected entity in the SceneView.
 A handle is rendered for each axis (X, Y, Z), and can be used to click and drag the entity around the sceneview.
 When the entity is moved, Editor.onPropertyChanged is called to update the gamedata JSON.
*/

SelectionObject = function(renderer, cam) {
	this.renderer = renderer;
	this.camera = cam;
	this.ray = new THREE.Raycaster();

	// Create the wireframe box
	this.mesh = new THREE.Mesh(
		new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({wireframe: true})
	);
	this.mesh.visible = false;

	this.selectedHandle = null;
	this.handles = [];
	this.planes = [];

	var handlegeo = new THREE.IcosahedronGeometry(0.15);
	var zero = new Vector3();
	var self = this;

	// Axis colours (R, G, B)
	var colours = [0xFF0000, 0x00FF00, 0x0000FF];
	// Handle axes (X, Y, Z)
	var axes = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
	// Y and X axis Planes
	var planeaxes = [new Vector3(0, 1, 0), new Vector3(1, 0, 0)];

	// Create a plane for each plane axis and attach it to the mesh 
	$.each(planeaxes, function(i, v) {
		self.planes[i] = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(1000, 1000),
			new THREE.MeshBasicMaterial({side: THREE.DoubleSide})
		);
		// Rotate from pointing up to pointing in the correct plane axis direction
		self.planes[i].quaternion.setFromUnitVectors(axes[2], planeaxes[i]);

		// Hide the plane, as this is only used for raycasting.
		self.planes[i].visible = false;
		self.mesh.add(self.planes[i]);
	});

	// Create the handles and lines between the origin and the handles
	$.each(axes, function(i, v) {
		// Create the handle with the correct colour (X, Y, Z -> R, G, B)
		self.handles[i] = new THREE.Mesh(
			handlegeo,
			new THREE.MeshBasicMaterial({color: colours[i]})
		);
		self.handles[i].position.add(v);
		self.mesh.add(self.handles[i]);

		// Create the line between the handle and the origin
		var g = new THREE.Geometry();
		g.vertices.push(zero, v);
		self.mesh.add(new THREE.Line(
			g, 
			new THREE.LineBasicMaterial({color: colours[i]})
		));
	});
}

SelectionObject.prototype.getMesh = function() {
	return this.mesh
}

SelectionObject.prototype.setEntity = function(e) {
	if (!e || !e.has('transform')) {
		this.entity = null;
		this.mesh.visible = false;
	}
	else {
		this.entity = e;
	}
}

SelectionObject.prototype.onMouseDown = function(x, y) {
	if (!this.entity) return;

	/*
		When the mouse is pressed down, a ray is cast from the mouse position to check if 
		the user is clicking on any of the handles on the selection object
		Any intersected handle is stored.
	*/

	var mpos = new THREE.Vector2(
		x / this.renderer.domElement.width * 2 - 1,
		y / this.renderer.domElement.height * -2 + 1
	);

	this.ray.setFromCamera(mpos, this.camera);
	
	var res = this.ray.intersectObjects(this.handles, true);
	if (res.length > 0) {
		this.selectedHandle = this.handles.indexOf(res[0].object);
		return true;
	}

	return false;
}

SelectionObject.prototype.onMouseUp = function(x, y) {
	// Clear any previously selected handle from onMouseDown
	this.selectedHandle = null;
}

SelectionObject.prototype.onMouseMove = function(x, y) {
	if (!this.entity || this.selectedHandle === null) return;

	/*
		While there's a selected handle and the mouse is moving, 
			a ray is cast each frame to the planes.
		The intersection point of the ray and the plane determines how much to move the entity by
	*/

	var mpos = new THREE.Vector2(
		x / this.renderer.domElement.width * 2 - 1,
		y / this.renderer.domElement.height * -2 + 1
	);

	this.ray.setFromCamera(mpos, this.camera);

	var n = this.selectedHandle;
	var handle = this.handles[n];

	// Get the axis of the selected handle, and the offset from the center of the selection mesh
	var handledir = handle.position.clone().applyQuaternion(this.mesh.quaternion);
	var offset = this.mesh.position.clone().add(
		handledir.clone().multiply(this.mesh.scale)
	);

	var dot, delta = new Vector3(0, 0, 0);
	var res = [];

	// Fire a ray at the specific plane (Y for the X axis handle, X for the Y axis handle)
	if (n < 2) {
		res = this.ray.intersectObject(this.planes[n]);
	}
	// If the Z axis handle is selected, attempt to intersect with both the X and Y axis planes.
	else {
		res = this.ray.intersectObjects(this.planes);
	}

	// If any plane is hit by the ray, then determine how much to move the entity by
	if (res.length > 0) {
		// First the dot product is found using the handle axis vs the localised
		// intersection point
		dot = handledir.dot(res[0].point.sub(offset));

		// then the handle axis is scaled by the dot product to get a vector to be
		//	 added to the entity's position
		delta = handledir.clone().multiplyScalar(dot);
	}


	// The transform component on the entity is then updated
	var t = this.entity.get('transform');
	var pos = t.getPosition();
	pos.add(delta);
	
	// The editor is told to change the property in the gamedata JSON and to update the Properties view.
	Editor.onPropertyChanged('transform', 'position', {
		type: 'vector', parameters: [pos.x, pos.y, pos.z]
	}, true);
}

SelectionObject.prototype.update = function() {
	if (this.entity) {
		if (this.entity.has('transform')) {
			this.mesh.visible = true;

			// Update the selection mesh to follow the selected entity
			var t = this.entity.get('transform');
			this.mesh.position.copy(t.getPosition());
			this.mesh.quaternion.copy(t.getRotation());

			// Set the scale of the mesh to the lowest scale axis of the selected entity
			// with a minimum scale of 10.
			var s = Math.max(
				Math.max.apply(null, t.getScale().toArray()),
				10
			);
			this.mesh.scale.set(s, s, s);
		}
		else {
			// No selection, hide the mesh
			this.mesh.visible = false;
			this.mesh.position.set(0, 0, 0);
			this.mesh.quaternion.set(0, 0, 0, 1);
			this.mesh.scale.set(1, 1, 1);
		}
	}
}