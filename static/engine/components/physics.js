/*
 This component is a wrapper around the Ammo.js btRigidBody class.
 The methods implemented convert any vectors or quaternions passed into 
 	the correct format for usage with Ammo.js.
*/

PhysicsComponent = function(options) {
	this.applyOptions(options);
}

PhysicsComponent.prototype.applyOptions = function(options) {
	// Create the collision 'shape'

	if (options.shape == 'sphere')
		this.shape = new Ammo.btSphereShape(0.5);
	else if (options.shape == 'cylinder')
		this.shape = new Ammo.btCylinderShape(new Ammo.btVector3(0.5, 0.5, 0.5));
	else
		this.shape = new Ammo.btBoxShape(new Ammo.btVector3(0.5, 0.5, 0.5));

	this._scale = new Vector3(1, 1, 1);
	this._mass = options.mass;

	// Calculate the inertia vector from the mass
	this._inertia = new Ammo.btVector3();
	this.shape.calculateLocalInertia(this._mass, this._inertia);

	// Create the new rigid body from the interia, shape and mass.
	this.ammoobj = new Ammo.btRigidBody(
		new Ammo.btRigidBodyConstructionInfo(this._mass,
			new Ammo.btDefaultMotionState(),
			this.shape,
			this._inertia
		)
	);

	// Set any other properties passed in with the options.
	this.setMass(options.mass);
	this.setFriction(options.friction);
	this.setDamping(options.damping);
	this.setAngularDamping(options.angularDamping);
	this.setRestitution(options.restitution);
}

PhysicsComponent.prototype.onComponentAdded = function(ent, com) {
	/* When this component is added to an entity with a transform component
		Or a transform component is added to this component's parent entity,
		Set the transform component to subscribe to this component, which will make
	 	everything else on the entity follow the position and rotation of the physics object. */

	if (com.id === 'transform' || (com === this && this.entity.has('transform')))
		this.entity.get('transform').subscribe(this);
}

// Methods
PhysicsComponent.prototype.bt2three = function(i) {
	// Convert Ammo.js vectors and quaternions into the Three.js vector and quaternion format.
	if (i instanceof Ammo.btVector3)
		return new Vector3(i.x(), i.y(), i.z());
	else if (i instanceof Ammo.btQuaternion)
		return new Quaternion(i.x(), i.y(), i.z(), i.w());
	
	return i;
}

PhysicsComponent.prototype.three2bt = function(i) {
	// Convert Three.js vectors and quaternions to Ammo.js vectors and quaternions.
	if (i instanceof Vector3)
		return new Ammo.btVector3(i.x, i.y, i.z);
	else if (i instanceof Quaternion)
		return new Ammo.btQuaternion(i.x, i.y, i.z, i.w);
	
	return i;
}

PhysicsComponent.prototype.activate = function() {
	// Activating a physics component wakes it up from sleeping.
	this.ammoobj.activate();
}

PhysicsComponent.prototype.setScale = function(v) {
	this._scale = v;
	this.shape.setLocalScaling(this.three2bt(v));

	// Update inertia
	this.setMass(this.getMass());
}

PhysicsComponent.prototype.getScale = function(v) {
	return this._scale;
}

PhysicsComponent.prototype.getTransform = function() {
	return this.ammoobj.getWorldTransform();
}

PhysicsComponent.prototype.setTransform = function(t) {
	this.ammoobj.setWorldTransform(t);
}

PhysicsComponent.prototype.getPosition = function() {
	return this.bt2three(this.getTransform().getOrigin());
}

PhysicsComponent.prototype.setPosition = function(p) {
	var t = this.getTransform();
	t.setOrigin(this.three2bt(p));
	this.setTransform(t);
}

PhysicsComponent.prototype.getRotation = function() {
	return this.bt2three(this.getTransform().getRotation());
}

PhysicsComponent.prototype.setRotation = function(q) {
	var t = this.getTransform();
	t.setRotation(this.three2bt(q));
	this.setTransform(t);
}

PhysicsComponent.prototype.getInertia = function(i) {
	return this.bt2three(this._inertia);
}

PhysicsComponent.prototype.setInertia = function(i) {
	this._inertia = this.three2bt(i);
	this.ammoobj.setMassProps(this._mass, this._inertia);
}

PhysicsComponent.prototype.setMass = function(m) {
	this._mass = m;

	if (!this._inertia) {
		this._inertia = new Ammo.btVector3();
	}

	this.shape.calculateLocalInertia(m, this._inertia);
	this.ammoobj.setMassProps(m, this._inertia);
}

PhysicsComponent.prototype.getMass = function(m) {
	return this._mass;
}

PhysicsComponent.prototype.setFriction = function(f) {
	this._friction = f;
	this.ammoobj.setFriction(f);
}

PhysicsComponent.prototype.getFriction = function(f) {
	return this._friction;
}

PhysicsComponent.prototype.setDamping = function(d) {
	this._damping = d;
	this.ammoobj.setDamping(d, this._angdamping);
}

PhysicsComponent.prototype.getDamping = function(d) {
	return this._damping;
}

PhysicsComponent.prototype.setAngularDamping = function(ad) {
	this._angdamping = ad;
	this.ammoobj.setDamping(this._damping, ad);
}

PhysicsComponent.prototype.getAngularDamping = function(d) {
	return this._angdamping;
}

PhysicsComponent.prototype.setRestitution = function(r) {
	this._restitution = r;
	this.ammoobj.setRestitution(r);
}

PhysicsComponent.prototype.getRestitution = function(r) {
	return this._restitution;
}

PhysicsComponent.prototype.applyForce = function(v, rel) {
	this.activate();
	this.ammoobj.applyForce(this.three2bt(v), this.three2bt(rel));
}

PhysicsComponent.prototype.applyTorque = function(v) {
	this.activate();
	this.ammoobj.applyTorque(this.three2bt(v));
}

PhysicsComponent.prototype.applyImpulse = function(v, rel) {
	this.activate();
	this.ammoobj.applyImpulse(this.three2bt(v), this.three2bt(rel));
}

PhysicsComponent.prototype.applyCentralForce = function(v) {
	this.activate();
	this.ammoobj.applyCentralForce(this.three2bt(v));
}

PhysicsComponent.prototype.applyCentralImpulse = function(v) {
	this.activate();
	this.ammoobj.applyCentralImpulse(this.three2bt(v));
}

PhysicsComponent.prototype.applyTorqueImpulse = function(v) {
	this.activate();
	this.ammoobj.applyTorqueImpulse(this.three2bt(v));
}

PhysicsComponent.prototype.getLinearVelocity = function() {
	return this.bt2three(this.ammoobj.getLinearVelocity());
}

PhysicsComponent.prototype.getAngularVelocity = function() {
	return this.bt2three(this.ammoobj.getAngularVelocity());
}

PhysicsComponent.prototype.setLinearVelocity = function(v) {
	this.activate();
	this.ammoobj.setLinearVelocity(this.three2bt(v));
}

PhysicsComponent.prototype.setAngularVelocity = function(v) {
	this.activate();
	this.ammoobj.setAngularVelocity(this.three2bt(v));
}

Components.register('physics', PhysicsComponent, {
	shape: {type: ['box', 'sphere', 'cylinder'], default: 'box'},
	mass: {type: 'number', default: 1},
	friction: {type: 'scalar', default: 0.5},
	damping: {type: 'scalar', default: 0.0},
	angularDamping: {type: 'scalar', default: 0.0},
	restitution: {type: 'scalar', default: 0.0}
});
