/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

// Provides an abstraction for model bindings
jQuery.sap.declare("sap.ui.model.Context");
jQuery.sap.require("sap.ui.base.EventProvider");

/**
 * Constructor for Context class.
 *
 * @class
 * The Context is a pointer to an object in the model data, which is used to 
 * allow definition of relative bindings, which are resolved relative to the
 * defined object.
 * Context elements are created either by the ListBinding for each list entry
 * or by using createBindingContext.
 *
 * @param {sap.ui.model.Model} the model
 * @param {String} sPath the path
 * @param {Object} oContext the context object
 * @abstract
 * @public
 */
sap.ui.model.Context = function(oModel, sPath){
	sap.ui.base.Object.apply(this);

	this.oModel = oModel;
	this.sPath = sPath;

};
sap.ui.model.Context.prototype = jQuery.sap.newObject(sap.ui.base.Object.prototype);

/*
 * Describe the sap.ui.model.Binding.
 * Resulting metadata can be obtained via sap.ui.model.Binding.getMetadata();
 */
sap.ui.base.Object.defineClass("sap.ui.model.Context", {

  // ---- object ----
  baseType : "sap.ui.base.Object",
  publicMethods : [
	// methods
	"getModel", "getPath", "getProperty", "getObject"
  ]

});

// Getter
/**
 * Getter for model
 * @public
 * @return {sap.ui.core.Model} the model
 */
sap.ui.model.Context.prototype.getModel = function() {
	return this.oModel;
};

/**
 * Getter for path
 * @public
 * @return {String} the binding path
 */
sap.ui.model.Context.prototype.getPath = function() {
	return this.sPath;
};

/**
 * Gets the property with the given relative binding path
 * @public
 * @param {String} sPath the binding path
 * @return {any} the property value
 */
sap.ui.model.Context.prototype.getProperty = function(sPath) {
	return this.oModel.getProperty(sPath, this);
};

/**
 * Gets the (model dependent) object the context points to
 * @public
 * @return {object} the context object
 */
sap.ui.model.Context.prototype.getObject = function() {
	return this.oModel.getProperty(this.sPath);
};

/** 
 * toString method returns path for compatbility
 */
sap.ui.model.Context.prototype.toString = function() {
	return this.sPath;
};
