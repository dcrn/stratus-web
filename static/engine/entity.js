/*
 An entity in the game engine. Basically just a container for components,
 	but also handles some events for added and removed components.
*/

Entity = function() {
	this.comps = {};
}

Entity.prototype.add = function(comp) {
	// Add a component.
	this.comps[comp.id] = comp;
	this.comps[comp.id].entity = this;

	this.onComponentAdded(comp);
}

Entity.prototype.remove = function(comp) {
	// Remove a component
	delete comp.entity;
	delete this.comps[comp.id];

	this.onComponentRemoved(comp);
}

Entity.prototype.onComponentAdded = function(comp) {
	// When a component is added, tell all the components on this entity that it was added
	for (var id in this.comps) {
		if (this.comps[id].onComponentAdded)
			this.comps[id].onComponentAdded(this, comp);
	}

	// If this entity is in a scene, tell the scene that a component was just added.
	// Used to add three.js and ammo.js objects to the world
	if (this.scene)
		this.scene.onComponentAdded(this, comp);
}

Entity.prototype.onComponentRemoved = function(comp) {
	// Tell all components that a component was just removed
	for (var id in this.comps) {
		if (this.comps[id].onComponentRemoved)
			this.comps[id].onComponentRemoved(this, comp);
	}

	// Tell the scene to remove the threejs object or ammo object from the scene
	if (this.scene)
		this.scene.onComponentRemoved(this, comp);
}

Entity.prototype.update = function(dt) {
	// Update all child components on this entity
	var c, com;
	for (c in this.comps) {
		com = this.comps[c];
		if (com.update)
			com.update(dt);
	}
}

Entity.prototype.components = function() {
	return this.comps;
}

Entity.prototype.has = function(compid) {
	// Check if the entity has a component of this type
	return compid in this.comps;
}

Entity.prototype.get = function(compid) {
	// Get the component of the specified type
	return this.comps[compid];
}