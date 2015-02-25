Scene = function(options) {
	options = options || {};

	if (!('gravity' in options))
		options.gravity = new Vector3(0, 0, -9.86);

	this.defaultCameraEntityID = options.defaultCameraEntityID;

	this.threeobj = new THREE.Scene();
	this.threeobj.up.set(0, 0, 1);

	var collisionConfig = new Ammo.btDefaultCollisionConfiguration();

	this.ammoobj = new Ammo.btDiscreteDynamicsWorld(
		new Ammo.btCollisionDispatcher(collisionConfig),
		new Ammo.btDbvtBroadphase(), 
		new Ammo.btSequentialImpulseConstraintSolver(), 
		collisionConfig
	);

	this.ammoobj.setGravity(
		new Ammo.btVector3(
			options.gravity.x,
			options.gravity.y,
			options.gravity.z
		)
	);

	this.entities = {};
}

Scene.prototype.activate = function() {
	Game.setActiveScene(this);

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
	this.entities[entid] = ent;
	ent.scene = this;

	var comps = ent.components();
	for (c in comps) {
		com = comps[c];
		this.onComponentAdded(ent, com);
	}
}

Scene.prototype.remove = function(entid) {
	var ent = this.entities[entid];
	delete this.entities[entid].scene;
	delete this.entities[entid];

	var comps = ent.components();
	for (c in comps) {
		com = comps[c];
		this.onComponentRemoved(ent, com);
	}
}

Scene.prototype.onComponentAdded = function(ent, com) {
	if (com.threeobj)
		this.threeobj.add(com.threeobj);
	if (com.ammoobj)
		this.ammoobj.addRigidBody(com.ammoobj);
}

Scene.prototype.onComponentRemoved = function(ent, com) {
	if (com.threeobj)
		this.threeobj.remove(com.threeobj);
	if (com.ammoobj)
		this.ammoobj.removeRigidBody(com.ammoobj);
}

Scene.prototype.update = function(dt) {
	this.ammoobj.stepSimulation(dt, 20);
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