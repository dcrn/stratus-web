/*
 Wrapper around the Three.js AmbientLight, SpotLight, DirectionalLight and PointLight classes
 Requires some special manipulation to be able to be added and removed in real time.
*/

LightComponent = function(options) {
	this.target = null;

	this.applyOptions(options);
}

LightComponent.prototype.onComponentRemove = function(ent, com) {
	if (com === this) {
		this.setIntensity(0.0);
		this.setShadowDarkness(0.0);
	}
}

LightComponent.prototype.applyOptions = function(options) {
	var ent = this.entity;
	var oldtype = this.type;

	// If changing light type, then remove it from the owner entity first
	if (ent && oldtype && options.type !== oldtype) {
		ent.remove(this);
	}

	if (options.type !== oldtype) {
		if (oldtype) {
			// If a light previously existed, make this one no longer visible
			this.setIntensity(0.0);
			this.setShadowDarkness(0.0);
			this.setShadowCameraVisible(false);
		}

		// Create the specific Three.js light class depending on the type
		this.type = options.type;
		if (options.type == 'ambient')
			this.threeobj = new THREE.AmbientLight();
		else if (options.type == 'spotlight')
			this.threeobj = new THREE.SpotLight();
		else if (options.type == 'directional')
			this.threeobj = new THREE.DirectionalLight();
		else
			this.threeobj = new THREE.PointLight();
	}

	// Add this component back onto the parent entity after updating the light type
	if (ent && oldtype && options.type !== oldtype) {
		ent.add(this);
	}

	this.setTarget(options.target);
	this.targetEntID = options.target;

	this.setColour(options.colour);
	this.setIntensity(options.intensity);
	this.setDistance(options.distance);
	this.setAngle(options.angle);
	this.setExponent(options.exponent);

	// If the light type is ambient or point, then ignore any shadow settings.
	if (this.type == 'ambient' || this.type == 'point') {
		return;
	}

	if (!options.castShadow) {
		this.setShadowDarkness(0.0);
	}
	else {
		this.setCastShadow(options.castShadow);
		this.setShadowDarkness(options.shadowDarkness);
	}
	this.setShadowCameraNear(options.shadowCameraNear);
	this.setShadowCameraFar(options.shadowCameraFar);
	this.setShadowCameraFov(options.shadowCameraFov);
	this.setShadowCameraVisible(options.shadowCameraVisible);
}

LightComponent.prototype.setTarget = function (eid) {
	// Set the light to point at a specific entity
	if (this.entity && eid in this.entity.scene.entities) {
		this.target = this.entity.scene.entities[eid];
		this.threeobj.target = this.target.get('transform').threeobj;
	}
}

LightComponent.prototype.update = function (dt) {
	if (this.targetEntID) {
		// If a target entity ID was set in the options, set the target on the first update.
		// This is performed in update to make sure other entities exist.
		this.setTarget(this.targetEntID);
		delete this.targetEntID;
	}
	
	if (!this.entity.has('transform')) return;
	var transform = this.entity.get('transform');

	// Copy position of the transform component
	this.threeobj.position.copy(transform.getPosition());
	this.threeobj.quaternion.copy(transform.getRotation());
}

LightComponent.prototype.getColour = function() {
	return this.threeobj.color.getHex();
}

LightComponent.prototype.setColour = function(v) {
	this.threeobj.color.setHex(v);
}

LightComponent.prototype.getIntensity = function() {
	return this.threeobj.intensity;
}

LightComponent.prototype.setIntensity = function(v) {
	this.threeobj.intensity = v;
}

LightComponent.prototype.getDistance = function() {
	return this.threeobj.distance;
}

LightComponent.prototype.setDistance = function(v) {
	this.threeobj.distance = v;
}

LightComponent.prototype.getAngle = function() {
	return this.threeobj.angle;
}

LightComponent.prototype.setAngle = function(v) {
	this.threeobj.angle = v;
}

LightComponent.prototype.getExponent = function() {
	return this.threeobj.exponent;
}

LightComponent.prototype.setExponent = function(v) {
	this.threeobj.exponent = v;
}

LightComponent.prototype.getCastShadow = function() {
	return this.threeobj.castShadow;
}

LightComponent.prototype.setCastShadow = function(v) {
	this.threeobj.castShadow = v;
}

LightComponent.prototype.getShadowDarkness = function() {
	return this.threeobj.shadowDarkness;
}

LightComponent.prototype.setShadowDarkness = function(v) {
	this.threeobj.shadowDarkness = v;
}

LightComponent.prototype.getShadowCameraNear = function() {
	return this.threeobj.shadowCameraNear;
}

LightComponent.prototype.setShadowCameraNear = function(v) {
	this.threeobj.shadowCameraNear = v;
}

LightComponent.prototype.getShadowCameraFar = function() {
	return this.threeobj.shadowCameraFar;
}

LightComponent.prototype.setShadowCameraFar = function(v) {
	this.threeobj.shadowCameraFar = v;
}

LightComponent.prototype.getShadowCameraFov = function() {
	return this.threeobj.shadowCameraFov;
}

LightComponent.prototype.setShadowCameraFov = function(v) {
	this.threeobj.shadowCameraFov = v;
}

LightComponent.prototype.getShadowCameraVisible = function() {
	return this.threeobj.shadowCameraVisible;
}

LightComponent.prototype.setShadowCameraVisible = function(v) {
	this.threeobj.shadowCameraVisible = v;
}

Components.register('light', LightComponent, {
	type: {type: ['point', 'spotlight', 'directional', 'ambient'], default: 'point'},
	target: {type: 'text', default: ''},
	colour: {type: 'colour', default: 0xFFFFFF},
	intensity: {type: 'scalar', default: 1.0},
	distance: {type: 'number', default: 0},
	angle: {type: 'scalar', default: Math.PI/3},
	exponent: {type: 'number', default: 10.0},
	castShadow: {type: 'bool', default: false},
	shadowDarkness: {type: 'scalar', default: 0.5},
	shadowCameraNear: {type: 'number', default: 0.1},
	shadowCameraFar: {type: 'number', default: 1000.0},
	shadowCameraFov: {type: 'number', default: 75},
	shadowCameraVisible: {type: 'bool', default: false}
});
