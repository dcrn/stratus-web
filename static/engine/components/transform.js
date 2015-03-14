TransformComponent = function(options) {
	this.sub = null;
	this.threeobj = new THREE.Object3D();

	this.applyOptions(options);
}

TransformComponent.prototype.applyOptions = function(options) {
	this.setScale(options.scale);
	this.setPosition(options.position);
	this.setRotation(options.rotation);
}

TransformComponent.prototype.applyTransform = function() {
	this.setPosition(this.threeobj.position);
	this.setRotation(this.threeobj.quaternion);
	this.setScale(this.threeobj.scale);
}

TransformComponent.prototype.subscribe = function(comp) {
	if (!comp.getPosition || !comp.setPosition || 
		!comp.getRotation || !comp.setRotation || 
		!comp.getScale || !comp.setScale)
		return false;

	if (window['Editor'] !== undefined) return false;

	this.sub = comp;
	this.applyTransform();
}

TransformComponent.prototype.update = function(dt) {
	if (this.sub) {
		this.threeobj.position.copy(this.getPosition());
		this.threeobj.quaternion.copy(this.getRotation());
		this.threeobj.scale.copy(this.getScale());
	}
}

TransformComponent.prototype.getPosition = function() {
	if (this.sub)
		return this.sub.getPosition();
	else
		return this.threeobj.position;
}

TransformComponent.prototype.setPosition = function(p) {
	if (this.sub)
		this.sub.setPosition(p);
	
	this.threeobj.position.copy(p);
}

TransformComponent.prototype.getRotation = function() {
	if (this.sub)
		return this.sub.getRotation();
	else
		return this.threeobj.quaternion;
}

TransformComponent.prototype.setRotation = function(q) {
	if (this.sub)
		this.sub.setRotation(q);
	
	this.threeobj.quaternion.copy(q);
}

TransformComponent.prototype.getScale = function() {
	if (this.sub)
		return this.sub.getScale();
	else
		return this.threeobj.scale;
}

TransformComponent.prototype.setScale = function(v) {
	if (this.sub)
		this.sub.setScale(v)
	
	this.threeobj.scale.copy(v);
}

Components.register('transform', TransformComponent, {
	position: {type: 'vector', default: [0, 0, 0]},
	scale: {type: 'vector', default: [1, 1, 1]},
	rotation: {type: 'quaternion', default: [0, 0, 0, 1]}
});
