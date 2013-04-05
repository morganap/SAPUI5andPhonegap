/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

// Provides the base implementation for all model implementations
jQuery.sap.declare("sap.ui.model.Type");
jQuery.sap.require("sap.ui.base.Object");

/**
 * Constructor for a new Type.
 *
 * @class
 * This is an abstract base class for type objects.
 * @abstract
 *
 * @extends sap.ui.base.Object
 *
 * @author SAP AG
 * @version 1.8.4
 *
 * @constructor
 * @public
 */
sap.ui.model.Type = function () {
	sap.ui.base.Object.apply(this, arguments);
	this.sName = "Type";
};

// chain the prototypes
sap.ui.model.Type.prototype = jQuery.sap.newObject(sap.ui.base.Object.prototype);

/*
 * Describe the sap.ui.model.Type.
 * Resulting metadata can be obtained via sap.ui.model.Type.getMetadata();
 */
sap.ui.base.Object.defineClass("sap.ui.model.Type", {

  // ---- object ----
  baseType : "sap.ui.base.Object",
  publicMethods : [
    // methods
    "getName"
  ]

});


/**
 * Returns the name of this type.
 *
 * @return {String} the name of this type
 * @public
 */
sap.ui.model.Type.prototype.getName = function() {
	return this.sName;
};