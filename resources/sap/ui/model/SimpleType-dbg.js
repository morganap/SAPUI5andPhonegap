/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

// Provides the base implementation for all model implementations
jQuery.sap.declare("sap.ui.model.SimpleType");
jQuery.sap.require("sap.ui.model.Type");
jQuery.sap.require("sap.ui.model.ParseException");
jQuery.sap.require("sap.ui.model.ValidateException");
jQuery.sap.require("sap.ui.model.FormatException");


/**
 * Constructor for a new SimpleType.
 *
 * @class
 * This is an abstract base class for simple types.
 * @abstract
 *
 * @extends sap.ui.model.Type
 *
 * @author SAP AG
 * @version 1.8.4
 *
 * @constructor
 * @public
 */
sap.ui.model.SimpleType = function(oFormatOptions, oConstraints) {
	sap.ui.model.Type.apply(this, arguments);
	this.setFormatOptions(oFormatOptions || {});
	this.setConstraints(oConstraints || {});
	this.sName = "SimpleType";
};

// chain the prototypes
sap.ui.model.SimpleType.prototype = jQuery.sap.newObject(sap.ui.model.Type.prototype);

/*
 * Describe the sap.ui.model.SimpleType.
 * Resulting metadata can be obtained via sap.ui.model.SimpleType.getMetadata();
 */
sap.ui.base.Object.defineClass("sap.ui.model.SimpleType", {

  // ---- object ----
  baseType : "sap.ui.model.Type",
  publicMethods : [
    // methods
    "setConstraints", "setFormatOptions", "formatValue", "parseValue", "validateValue"
  ]

});

/**
 * Format the given value in model representation to an output value in the given
 * internal type. This happens according to the format options, if target type is 'string'.
 * If oValue is not defined or null, null will be returned.
 *
 * @function
 * @name sap.ui.model.SimpleType.prototype.formatValue
 * @param {any} oValue the value to be formatted
 * @param {string} sInternalType the target type
 * @return {any} the formatted output value
 *
 * @public
 */

/**
 * Parse a value of an internal type to the expected value of the model type.
 *
 * @function
 * @name sap.ui.model.SimpleType.prototype.parseValue
 * @param {any} oValue the value to be parsed
 * @param {string} sInternalType the source type
 * @return {any} the parse result
 *
 * @public
 */

/**
 * Validate whether a given value in model representation is valid and meets the
 * defined constraints (if any).
 *
 * @function
 * @name sap.ui.model.SimpleType.prototype.validateValue
 * @param {any} oValue the value to be validated
 *
 * @public
 */

/**
 * Sets constraints for this type. This is meta information used when validating the
 * value, to ensure it meets certain criteria, e.g. maximum length, minimal amount
 *
 * @param {object} oConstraints the constraints to set for this type
 */
sap.ui.model.SimpleType.prototype.setConstraints = function(oConstraints) {
	this.oConstraints = oConstraints;
};

/**
 * Set format options for this type. This is meta information used when formatting and
 * parsing values, such as patterns for number and date formatting or maximum length
 *
 * @param {object} oFormatOptions the options to set for this type
 */
sap.ui.model.SimpleType.prototype.setFormatOptions = function(oFormatOptions) {
	this.oFormatOptions = oFormatOptions;
};