LightComponent = function(options) {
	options = options || {};
	if (!('type' in options))
		options.type = 'point';
	if (!('colour' in options))
		options.colour = 0xFFFFFF;
	if (!('intensity' in options))
		options.intensity = 1.0;
	if (!('distance' in options))
		options.distance = 0.0;
	if (!('angle' in options))
		options.angle = Math.PI/3;
	if (!('exponent' in options))
		options.exponent = 10.0;
	if (!('castShadow' in options))
		options.castShadow = false;
	if (!('shadowDarkness' in options))
		options.shadowDarkness = 0.5;
	if (!('shadowCameraNear' in options))
		options.shadowCameraNear = 0.1;
	if (!('shadowCameraFar' in options))
		options.shadowCameraFar = 1000.0;
	if (!('shadowCameraFOV' in options))
		options.shadowCameraFOV = 75;
	if (!('shadowCameraVisible' in options))
		options.shadowCameraVisible = false;

	this.type = options.type;
	if (options.type == 'ambient')
		this.threeobj = new THREE.AmbientLight();
	else if (options.type == 'spotlight')
		this.threeobj = new THREE.SpotLight();
	else if (options.type == 'directional')
		this.threeobj = new THREE.DirectionalLight();
	else
		this.threeobj = new THREE.PointLight();

	this.setColour(options.colour);
	this.setIntensity(options.intensity);
	this.setDistance(options.distance);
	this.setAngle(options.angle);
	this.setExponent(options.exponent);
	this.setCastShadow(options.castShadow);
	this.setShadowDarkness(options.shadowDarkness);
	this.setShadowCameraNear(options.shadowCameraNear);
	this.setShadowCameraFar(options.shadowCameraFar);
	this.setShadowCameraFOV(options.shadowCameraFOV);
	this.setShadowCameraVisible(options.shadowCameraVisible);
}

LightComponent.prototype.update = function (dt) {
	if (!this.entity.has('transform')) return;
	var transform = this.entity.get('transform');

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

LightComponent.prototype.getShadowCameraFOV = function() {
	return this.threeobj.shadowCameraFOV;
}

LightComponent.prototype.setShadowCameraFOV = function(v) {
	this.threeobj.shadowCameraFOV = v;
}

LightComponent.prototype.getShadowCameraVisible = function() {
	return this.threeobj.shadowCameraVisible;
}

LightComponent.prototype.setShadowCameraVisible = function(v) {
	this.threeobj.shadowCameraVisible = v;
}

Components.register('light', LightComponent);
