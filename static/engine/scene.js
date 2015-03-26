/*
 Scene class used to manage the Three.js scene and Ammo.js world.
 Contains a list of child entities contained in this scene
*/

Scene = function(options) {
	options = options || {};
	this.defaultCameraEntityID = options.defaultCameraEntityID;

	// Set up the Three.js Scene object
	this.threeobj = new THREE.Scene();
	this.threeobj.up.set(0, 0, 1);


	// Create the Ammo.js world, specifying the dispatcher and solver classes to be used in the simulation
	var collisionConfig = new Ammo.btDefaultCollisionConfiguration();
	this.ammoobj = new Ammo.btDiscreteDynamicsWorld(
		new Ammo.btCollisionDispatcher(collisionConfig),
		new Ammo.btDbvtBroadphase(), 
		new Ammo.btSequentialImpulseConstraintSolver(), 
		collisionConfig
	);

	// Set the gravity to -9.86 on the z-axis
	this.ammoobj.setGravity(
		new Ammo.btVector3(
			0,
			0,
			options.gravity || -9.86
		)
	);

	this.entities = {};
}

Scene.prototype.activate = function() {
	// Set this scene as the active scene in the Game.
	Game.setActiveScene(this);

	// Activate the camera from the options, or whatever camera is found first.
	if (this.defaultCameraEntityID && 
		this.defaultCameraEntityID in this.entities &&
		this.entities[this.defaultCameraEntityID].has('camera')) {
		
		this.entities[this.defaultCameraEntityID].get('camera').activate();
	}
	else {
		for (var e in this.entities)
		{
			if (this.entities[e].has('camera')) {
				this.entities[e].get('camera').activate()
				break;
			}
		}
	}
}

Scene.prototype.add = function(entid, ent) {
	// Add a new entity to the scene
	this.entities[entid] = ent;
	ent.scene = this;
	ent.id = entid;

	// For each component in the entity, call the onComponentAdded event on this scene.
	var comps = ent.components();
	for (c in comps) {
		com = comps[c];
		this.onComponentAdded(ent, com);
	}
}

Scene.prototype.remove = function(entid) {
	// Remove an entity from this scene
	var ent = this.entities[entid];
	delete this.entities[entid].scene;
	delete this.entities[entid];

	// call onComponentRemoved for each component on the entity.
	var comps = ent.components();
	for (c in comps) {
		com = comps[c];
		this.onComponentRemoved(ent, com);
	}
}

Scene.prototype.updateAllMaterials = function() {
	// Trigger each material in the scene to update
	// this allows new shadows to be cast after rendering materials previously

	var e, c, ent, coms, com;
	for (e in this.entities) {
		ent = this.entities[e];
		coms = ent.components();
		for (c in coms) {
			com = coms[c];
			if (com.threeobj && com.threeobj.material) {
				com.threeobj.material.needsUpdate = true;
			}
		}
	}
}

Scene.prototype.onComponentAdded = function(ent, com) {
	// If a light component was added, then update all materials.
	if (com.id == 'light')
		this.updateAllMaterials();
	
	// If the component has a three.js object contained, then add it to the Three.js Scene object.
	if (com.threeobj)
		this.threeobj.add(com.threeobj);

	// If it has an Ammo.js object, then add it to the collision world.
	if (com.ammoobj)
		this.ammoobj.addRigidBody(com.ammoobj);
}

Scene.prototype.onComponentRemoved = function(ent, com) {
	// Remove any threejs or ammojs objects when the component is removed from the scene.
	if (com.threeobj)
		this.threeobj.remove(com.threeobj);
	if (com.ammoobj)
		this.ammoobj.removeRigidBody(com.ammoobj);
}

Scene.prototype.update = function(dt) {
	// Update the Ammo.js world
	this.ammoobj.stepSimulation(dt, 20);

	// Update each child entity
	for (e in this.entities) {
		this.entities[e].update(dt);
	}
}

Scene.prototype.getGravity = function() {
	return this.ammoobj.getGravity();
}

Scene.prototype.setGravity = function(val) {
	this.ammoobj.setGravity(val);
}