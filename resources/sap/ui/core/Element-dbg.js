/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

// Provides the base class for all controls and UI elements.
jQuery.sap.declare("sap.ui.core.Element");

jQuery.sap.require("jquery.sap.script");
jQuery.sap.require("jquery.sap.strings");
jQuery.sap.require("sap.ui.base.EventProvider");
jQuery.sap.require("sap.ui.base.DataType");
jQuery.sap.require("sap.ui.core.ElementMetadata");
jQuery.sap.require("sap.ui.model.Model");
jQuery.sap.require("sap.ui.model.SimpleType");

/**
 * Constructs and initializes an UI Element with the given <code>sId</code> and settings.
 *
 * If the optional <code>mSettings</code> are given, they must be a JSON-like object (object literal)
 * that defines values for properties, aggregations, associations or events keyed by their name.
 *
 * <b>Valid Names:</b>
 *
 * The property (key) names supported in the object literal are exactly the (case sensitive)
 * names documented in the JSDoc for the properties, aggregations, associations and events
 * of the control and its base classes. Note that for  0..n aggregations and associations this
 * usually is the plural name, whereas it is the singular name in case of 0..1 relations.
 *
 * If a key name is ambiguous for a specific control class (e.g. a property has the same
 * name as an event), then this method prefers property, aggregation, association and
 * event in that order. To resolve such ambiguities, the keys can be prefixed with
 * <code>aggregation:</code>, <code>association:</code> or <code>event:</code>.
 * In that case the keys must be quoted due to the ':'.
 *
 * Each subclass should document the set of supported names in its constructor documentation.
 *
 * <b>Valid Values:</b>
 *
 * <ul>
 * <li>for normal properties, the value has to be of the correct simple type (no type conversion occurs)
 * <li>for 0..1 aggregations, the value has to be an instance of the aggregated control or element type
 * <li>for 0..n aggregations, the value has to be an array of instances of the aggregated type
 * <li>for 0..1 associations, an instance of the associated type or an id (string) is accepted
 * <li>0..n associations are not supported yet
 * <li>for events either a function (event handler) is accepted or an array of length 2
 *     where the first element is a function and the 2nd element is an object to invoke the method on.
 * </ul>
 *
 * @param {string} [sId] id for the new control; generated automatically if no non-empty id is given
 *      Note: this can be omitted, no matter whether <code>mSettings</code> will be given or not!
 * @param {object} [mSettings] optional map/JSON-object with initial property values, aggregated objects etc. for the new element
 *
 * @class Base Class for Elements.
 * @extends sap.ui.base.EventProvider
 * @author Martin Schaus, Daniel Brinkmann
 * @version 1.8.4
 * @public
 * @name sap.ui.core.Element
 */
sap.ui.base.EventProvider.extend("sap.ui.core.Element", {

	metadata : {
	  "abstract" : true,
	  publicMethods : [ "getId", "getMetadata", "getTooltip_AsString", "getTooltip_Text", "getModel", "setModel", "hasModel", "bindProperty", "unbindProperty", "bindAggregation", "unbindAggregation", "prop" ],
	  library : "sap.ui.core",
	  properties : {
		// TODO can't yet declare id as a property: would show up in ControlTree and applySettings would allow to modify id
		// id : {name : "id", type : "string", group : "Identification", defaultValue : '', readOnly : true}
	  },
	  aggregations : {
		tooltip : {name : "tooltip", type : "sap.ui.core.TooltipBase", altTypes : ["string"], multiple : false},
		customData : {name : "customData", type : "sap.ui.core.CustomData", multiple : true, singularName : "customData"}
	  },
	  associations : {},
	  events : {}
	},

	constructor : function(sId, mSettings) {

		sap.ui.base.EventProvider.apply(this); // no use to pass our arguments
		if (typeof(sId) != "string" && arguments.length>0) {
			// shift arguments in case sId was missing, but mSettings was given
			mSettings = sId;
			if (mSettings && mSettings.id) {
				sId = mSettings["id"];
			} else {
				sId = null;
			}
		}

		if (!sId) {
			sId = this.getMetadata().uid() || jQuery.sap.uid();
		} else {
			var preprocessor = sap.ui.core.Element._fnIdPreprocessor;
			sId = (preprocessor ? preprocessor.call(this, sId) : sId);
			var oType = sap.ui.base.DataType.getType("sap.ui.core.ID");
			if (!oType.isValid(sId)) {
				throw new Error("\"" + sId + "\" is not a valid ID.");
			}
		}
		this.sId = sId;

		// control interface
		// create an empty property bag that uses a map of defaultValues as its prototype
		this.mProperties = this.getMetadata().createPropertyBag();
		this.mAggregations = {};
		this.mAssociations = {};
		this.mMethods = {};

		// private properties
		this.oParent = null;
		this.bPrerendered = this.getDomRef() != null;
		this.aDelegates = [];
		this.aBeforeDelegates = [];
		this.iSuppressInvalidate = 0;

		// data binding
		this.oModels = {};
		this.mBindingInfos = {};
		this.sBindingPath = null;
		this.mBindingParametes = null;

		// TODO: generic concept for init hooks?
		if ( this._initCompositeSupport ) {
			this._initCompositeSupport(mSettings);
		}

		// Call init method here instead of specific Controls constructor.
		if (this.init) {
			this.init();
		}

		// apply the settings
		this.applySettings(mSettings);

		// registers the element in the Core
		this.register();

	},

	renderer : null // Element has no renderer

}, /* Metadata constructor */ sap.ui.core.ElementMetadata);

/**
 * Creates a new subclass of class sap.ui.core.Element with name <code>sClassName</code>
 * and enriches it with the information contained in <code>oClassInfo</code>.
 *
 * <code>oClassInfo</code> might contain the following:
 * <ul>
 * <li><code>metadata:</code> an (optional) object literal containing meta information about the class.
 * The information in the object literal will be wrapped by an instance of ElementMetadata
 * and might contain the following information:
 * <ul>
 * <li>all values accepted for metadata as documented for the {@link sap.ui.base.Object.extend Object.extend} method</li>
 * <li>library: {string} (optional) name of the library that contains the element/control
 * <li>properties: a map of property info objects, mapped by the property name
 *     Each info object should be a simple object literal and may contain the following information
 *     <ul>
 *     <li>type {string} optional type of the property, defaults to type "string"
 *     <li>[defaultValue] {any} default value of the property. When omitted, defaults to the default value for the type
 *     <li>group {string} optional semantic group of the property. Defaults to "Misc"
 *     </ul>
 *     If the property info object is not an object literal, it is assumed to be a string and
 *     interpreted as the type of the property. All other informations use their default values.
 * <li>aggregations: a map of aggregation info objects, mapped by the aggregation name
 *     By convention, the name should be a singular name for aggregations of cardinality 0..1 and
 *     should be a plural name for aggregations of cardinality 0..n.
 *
 *     The info object should contain the following information
 *     <ul>
 *     <li>type {string} (optional) type of the aggregated controls/elements, defaults to sap.ui.core.Control
 *     <li>altTypes {string[]} (optional) alternative primitive types that the aggregation can have (like string etc.). Defaults to no alternative types.
 *     <li>multiple {boolean} (optional) information about the cardinality, defaults to true (multiple aggregation)
 *     <li>singularName {string} (optional) singular name for 0..n aggregations. If not specified, a singular name is guessed from the plural name.
 *     </ul>
 *     If the aggregation info object is not an object literal, it is assumed to be a string and
 *     interpreted as the type of the aggregation. All other informations use their default values.
 * <li>associations: a map of association info objects, mapped by the association name
 *     By convention, the name should be a singular name for aggregations of cardinality 0..1 and
 *     should be a plural name for aggregations of cardinality 0..n.
 *
 *     The info object should contain the following information
 *     <ul>
 *     <li>type {string} type of the associated controls/elements, defaults to sap.ui.core.Control
 *     <li>multiple {boolean} (optional) information about the cardinality, defaults to false (single aggregation)
 *     <li>singularName {string} (optional) singular name for 0..n aggregations. If not specified, a singular name is guessed from the plural name.
 *     </ul>
 *     If the association info object is not an object literal, it is assumed to be a string and
 *     interpreted as the type of the aggregation. All other informations then use their default values.
 * <li>events: a map of event info objects, mapped by the event name
 *     The info object can contain the following information
 *     <ul>
 *     <li><code>allowPreventDefault:</code> {boolean} whether the control allows to prevent its default behavior for this event (defaults to false) </li>
 *     </ul>
 * </ul>
 * For all properties, aggregations, associations and events, the usual access methods are created and added to the public facade.
 * They don't need to be listed in the publicMethods array.
 * </li>
 *
 * <li><code>constructor:</code> a function that serves as a constructor function for the new element class.
 * If no constructor function is given, the framework creates a default implementation that delegates all
 * its arguments to the constructor function of the base class.
 * <b>Note:</b> most of the time, subclasses of Element don't need to specify their own constructor function.
 * They should use the symmetric {@link #init} and {@link #exit} hooks instead.
 * </li>
 *
 * <li><code>renderer:</code> definition of a renderer. This can be any of the following
 * <ul>
 * <li>the class name of a renderer class (a string)</li>
 * <li>a render function with signature <code>function(oRenderManager, oControl)</code> that implements the rendering for the new class</li>
 * <li>an object literal that contains functions/properties that should be mixed into a new render class which is
 * created as a subclass of the renderer of the current class.</li>
 * </ul>
 * <b>Note:</b> usually only controls have a renderer. But to keep the control creation APIs simple and to honor future
 * extensions of the current policy, the definition of a renderer is supported for direct subclasses of Element as well.
 * </li>
 *
 * <li><i>any-other-name:</i> any other property in the <code>oClassInfo</code> is copied into the prototype
 * object of the newly created class. Callers can thereby add methods or properties to all instances of the
 * class. But be aware that the given values are shared between all instances of the class. Usually, it doesn't
 * make sense to use primitive values here other than to declare public constants.
 *
 * All methods added this way and whose name is not 'init' nor 'exit' nor does it start with an underscore ('_')
 * nor with the prefix 'on' are assumed to be public methods and are automatically added to the list of public facade methods.
 * </ul>
 *
 * The prototype object of the newly created class uses the same prototype as instances of the base class
 * (prototype chaining).
 *
 * A metadata object is always created, even if there is no <code>metadata</code> entry in the <code>oClassInfo</code>
 * object. A getter for the metadata is always attached to the prototype and to the class (constructor function)
 * itself.
 *
 * Last but not least, with the third argument <code>FNMetaImpl</code> the constructor of a metadata class
 * can be specified. Instances of that class will be used to represent metadata for the newly created class
 * and for any subclass created from it. Typically, only frameworks will use this parameter to enrich the
 * metadata for a new class hierarchy they introduce (as done by  {@link sap.ui.core.Element Element}).
 *
 * @param {string} sClassName name of the class to be created
 * @param {object} [oClassInfo] structured object with informations about the class
 * @param {function} [FNMetaImpl] constructor function for the metadata object. If not given, it defaults to sap.ui.core.ElementMetadata.
 * @return {function} the created class / constructor function
 * @public
 * @static
 * @name sap.ui.core.Element.extend
 * @function
 * @since 1.3.1
 */

/**
 * Creates metadata for an UI Element by extending the Object Metadata.
 *
 * In addition to the entries defined by {@link sap.ui.base.Object.defineClass}, the following
 * entries can be specified in the static info object:
 *
 * <ul>
 * <li>library: {string} name of the library that contains the element/control
 * <li>properties: a map of property info objects, mapped by the property name
 *     Info object should contain the following information
 *     <ul>
 *     <li>name {string} name of the property (redundant to map key)
 *     <li>type {string} type of the property
 *     <li>[defaultValue] {any} default value of the property. Can be omitted
 *     </ul>
 * <li>aggregations: a map of aggregation info objects, mapped by the aggregation name
 *     Info object should contain the following information
 *     <ul>
 *     <li>name {string} name of the aggregation, singular for 0..1, plural for 0..n
 *     <li>type {string} type of the aggregated controls/elements
 *     <li>multiple {boolean}
 *     <li>singularName {string} singular name for 0..n aggregations
 *     </ul>
 * <li>associations: a map of association info objects, mapped by the association name
 *     Info object should contain the following information
 *     <ul>
 *     <li>name {string} name of the association, singular for 0..1, plural for 0..n
 *     <li>type {string} type of the associated controls/elements
 *     <li>multiple {boolean}
 *     <li>singularName {string} singular name for 0..n associations
 *     </ul>
 * <li>events: map from event names to event names
 * </ul>
 *
 * @see sap.ui.core.Object.defineClass
 *
 * @param {string} sClassName name of the class to build the metadata for
 * @param {object} oStaticInfo static information used to build the metadata
 * @param {function} [fnMetaImpl] constructor to be used for the metadata
 * @return {object} the created metadata
 * @static
 * @public
 * @deprecated Since 1.3.1. Use the static <code>extend</code> method of the desired base class (e.g. {@link sap.ui.core.Element.extend})
 */
sap.ui.core.Element.defineClass = function(sClassName, oStaticInfo, fnMetaImpl) {
	// create and attach metadata but with an Element specific implementation
	return sap.ui.base.Object.defineClass(sClassName, oStaticInfo, fnMetaImpl || sap.ui.core.ElementMetadata);
};

/**
 * Handles the given browser event.
 * @private
 */
sap.ui.core.Element.prototype._handleEvent = function (oEvent) {
	var sHandlerName = "on" + oEvent.type;
	this._callEventHandles(this.aBeforeDelegates, sHandlerName, oEvent);
	this._callEventHandles([this], sHandlerName, oEvent);
	this._callEventHandles(this.aDelegates, sHandlerName, oEvent);
};

/**
 * Calls event handler of the given event handles with the given browser event.
 * @private
 */
sap.ui.core.Element.prototype._callEventHandles = function (aHandles, sHandlerName, oEvent) {
	if (aHandles.length > 0) {
		for (var i = 0; i < aHandles.length; i++) {
			if (oEvent.isImmediateHandlerPropagationStopped()) {
				break;
			}
			var oHandle = aHandles[i];
			if (oHandle[sHandlerName]) {
				oHandle[sHandlerName](oEvent);
			}
		}
	}
};


// Element is granted "friend" access by Core for (de-)registration
/**
 * Registers this instance of sap.ui.core.Element with the Core.
 *
 * The implementation of this method is provided with "friend" access by Core.
 * @see sap.ui.core.Core.constructor
 *
 * @function
 * @name sap.ui.core.Element.prototype.register
 * @private
 */
//sap.ui.core.Element.prototype.register = function() {...}

/**
 * Deregisters this instance of sap.ui.core.Element from the Core.
 *
 * The implementation of this method is provided with "friend" access by Core.
 * @see sap.ui.core.Core.constructor
 *
 * @function
 * @name sap.ui.core.Element.prototype.deregister
 * @private
 */
//sap.ui.core.Element.prototype.deregister = function() {...}

/**
 * Initializes the element instance after creation.
 *
 * Applications must not call this hook method directly, it is called by the framework
 * while the constructor of an element is executed.
 *
 * Subclasses of Element should override this hook to implement any necessary initialization.
 *
 * @function
 * @name sap.ui.core.Element.prototype.init
 * @protected
 */
//sap.ui.core.Element.prototype.init = function() {};

/**
 * Cleans up the element instance before destruction.
 *
 * Applications must not call this hook method directly, it is called by the framework
 * when the element is {@link #destroy destroyed}.
 *
 * Subclasses of Element should override this hook to implement any necessary cleanup.
 *
 * @function
 * @name sap.ui.core.Element.prototype.exit
 * @protected
 */
//sap.ui.core.Element.prototype.exit = function() {};

/**
 * Creates a new Element from the given data.
 *
 * If vData is an element already, that element is returned.
 * If vData is an object (literal), then a new element is created with vData as settings.
 * The type of the element is either determined by a "Type" entry in the vData or
 * by a type information in the oKeyInfo object
 * @param {sap.ui.core.Element|object} vData the data to create the element from
 * @param {object} oKeyInfo
 * @public
 * @static
 */
sap.ui.core.Element.create = function(vData, oKeyInfo) {
	if ( !vData || vData instanceof sap.ui.core.Element || typeof vData !== "object" || vData instanceof String) {
		return vData;
	}

	function getClass(vType) {
		if ( typeof vType === "function" ) {
			return vType;
		} 
		if (typeof vType === "string" ) {
			return jQuery.sap.getObject(vType);
		}
	}

	var fnClass = getClass(vData.Type) || getClass(oKeyInfo && oKeyInfo.type);
	if ( typeof fnClass === "function" ) {
		return new fnClass(vData);
	}

	// we don't know how to create the Element from vData, so fail
	// extension points could be integrated here
	var message = "Don't know how to create an Element from " + vData + " (" + (typeof vData) + ")";
	jQuery.sap.log.fatal(message);
	throw new Error(message);
};

/**
 * A global preprocessor for the ID of an Element (used internally).
 * If set, this function will be called before the ID is applied to any Element.
 * If the original ID was empty, the hook will not be called (to be discussed).
 *
 * The expected signature is <code>function(sId)</code>, and <code>this</code> will
 * be the current Element.
 *
 * @return new ID of the Element
 * @type function
 * @private
 */
sap.ui.core.Element._fnIdPreprocessor = null;

/**
 * A global preprocessor for the settings of an Element (used internally).
 * If set, this function will be called before the settings are applied to any Element.
 * If the original settings are empty, the hook will not be called (to be discussed).
 *
 * The expected signature is <code>function(mSettings)</code>, and <code>this</code> will
 * be the current Element.
 *
 * @type function
 * @private
 */
sap.ui.core.Element._fnSettingsPreprocessor = null;

sap.ui.core.Element.runWithPreprocessors = function(fn, oPreprocessors) {
	jQuery.sap.assert(typeof fn === "function", "fn must be a function");
	jQuery.sap.assert(!oPreprocessors || typeof oPreprocessors === "object", "oPreprocessors must be an object");
	
	var oOldPreprocessors = { id : this._fnIdPreprocessor, settings : this._fnSettingsPreprocessor };
	oPreprocessors = oPreprocessors || {};

	this._fnIdPreprocessor = oPreprocessors.id; 
	this._fnSettingsPreprocessor = oPreprocessors.settings;
	
	try {
		var result = fn.call();
		this._fnIdPreprocessor = oOldPreprocessors.id; 
		this._fnSettingsPreprocessor = oOldPreprocessors.settings;
		return result;
	} catch (e) {
		this._fnIdPreprocessor = oOldPreprocessors.id; 
		this._fnSettingsPreprocessor = oOldPreprocessors.settings;
		throw e;
	}
	
};

/**
 * Sets all the properties, aggregations, associations and event handlers as given in
 * the object literal <code>mSettings</code>. If a property, aggregation, etc.
 * is not listed in <code>mSettings</code>, then its value is not changed by this method.
 *
 * For properties and 0..1 aggregations/associations, any given setting overwrites
 * the current value. For 0..n aggregations, the given values are appended; event
 * listeners are registered in addition to existing ones.
 *
 * For the possible keys and values in <code>mSettings</code> see the general
 * documentation in {@link sap.ui.core.Element} or the specific documentation
 * of the constructor of the concrete UI element class.
 *
 * @param {object} mSettings the settings to apply to this element
 * @return {sap.ui.core.Element} Returns <code>this</code> to allow method chaining
 * @public
 */
sap.ui.core.Element.prototype.applySettings = function(mSettings) {

	// PERFOPT: don't retrieve (expensive) JSONKeys if no settings are given
	if ( !mSettings || jQuery.isEmptyObject(mSettings) ) {
		return this;
	}

	var oMetadata = this.getMetadata(),
		mValidKeys = oMetadata.getJSONKeys(),
		makeControl = sap.ui.core.Element.create,
		preprocessor = sap.ui.core.Element._fnSettingsPreprocessor,
		sKey, oValue, oKeyInfo;

	// call the preprocessor if it has been defined
	preprocessor && preprocessor.call(this, mSettings); // TODO: decide whether to call for empty settings as well?

	// process all settings
	// process settings
	for(sKey in mSettings) {
		// get info object for the key
		if ( oKeyInfo = mValidKeys[sKey] ) {
			oValue = mSettings[sKey];
			switch(oKeyInfo._iKind) {
			case 0: // PROPERTY
				if (this.isBinding(oValue, oKeyInfo)) {
					var oBindingInfo = this.extractBindingInfo(oValue);
					this.bindProperty(sKey, oBindingInfo);
				} else {
					this[oKeyInfo._sMutator](oValue);
				}
				break;
			case 1: // SINGLE_AGGREGATION
				if ( oKeyInfo.altTypes && this.isBinding(oValue, oKeyInfo) ) {
					var oBindingInfo = this.extractBindingInfo(oValue);
					this.bindProperty(sKey, oBindingInfo);
				} else {
					this[oKeyInfo._sMutator](makeControl(oValue, oKeyInfo));
				}
				break;
			case 2: // MULTIPLE_AGGREGATION
				if (this.isBinding(oValue, oKeyInfo)) {
					var oBindingInfo = this.extractBindingInfo(oValue);
					this.bindAggregation(sKey, oBindingInfo);
				} else {
					if ( oValue && !jQuery.isArray(oValue) ) {
						oValue = [oValue];
					}
					if ( oValue ) {
						for(var i=0,l=oValue.length; i<l; i++) {
							this[oKeyInfo._sMutator](makeControl(oValue[i], oKeyInfo));
						}
					}
				}
				break;
			case 3: // SINGLE_ASSOCIATION
				this[oKeyInfo._sMutator](oValue);
				break;
			case 4: // MULTIPLE_ASSOCIATION
				if ( oValue && !jQuery.isArray(oValue) ) {
					oValue = [oValue];
				}
				if ( oValue ) {
					for(var i=0,l=oValue.length; i<l; i++) {
						this[oKeyInfo._sMutator](oValue[i]);
					}
				}
				break;
			case 5: // EVENT
				if ( typeof oValue == "function" ) {
					this[oKeyInfo._sMutator](oValue);
				}
				else {
					this[oKeyInfo._sMutator](oValue[0], oValue[1], oValue[2]);
				}
					//this[oKeyInfo._sMutator].apply(this, oValue); // could be replacement for line before
				break;
			default:
				break;
			}
		}
	}

	return this;
};

/**
 * Returns a simple string representation of this element.
 *
 * Mainly useful for tracing purposes.
 * @public
 * @return {string} a string descripition of this element
 */
sap.ui.core.Element.prototype.toString = function() {
	if ( this.getMetadata ) {
		return "Element " + this.getMetadata().getName() + "#" + this.sId;
	}
	else {
		return "Element {unknown class}#" + this.sId;
	}
};

/**
 * Returns the element's Id.
 *
 * @return {string} the element's Id.
 * @public
 */
sap.ui.core.Element.prototype.getId = function() {
	return this.sId;
};

/**
 * Returns the best suitable DOM node that represents this Element.
 * By default the DOM node with the same ID as this Element is returned.
 * Subclasses should override this method if the lookup via id is not sufficient.
 *
 * Note that such a DOM node does not necessarily exist in all cases.
 * Some elements or controls might not have a DOM representation at all (e.g.
 * a naive FlowLayout) while others might not have one due to their current
 * state (e.g. an initial, not yet rendered control).
 *
 * @return {DOMNode} The element's DOM reference or null
 * @protected
 */
sap.ui.core.Element.prototype.getDomRef = function() {
	return jQuery.sap.domById(this.getId());
};

/**
 * Returns the best suitable DOM node that represents this Element wrapped as jQuery object.
 * I.e. the element returned by {@link sap.ui.core.Element#getDomRef} is wrapped and returned.
 *
 * @return {jQuery} The jQuery wrapped element's DOM reference
 * @protected
 */

sap.ui.core.Element.prototype.$ = function() {
	return jQuery(this.getDomRef());
};

/**
 * Checks whether this element has an active parent.
 *
 * @type boolean
 * @return true if this element has an active parent
 * @private
 */
sap.ui.core.Element.prototype.isActive = function() {
	return this.oParent && this.oParent.isActive();
};

/**
 * This function either calls set[sPropertyName] or get[sPropertyName] with the specified property name
 * depending if an <code>oValue</code> is provided or not.
 *
 * @param {string}  sPropertyName name of the property to set
 * @param {any}     [oValue] value to set the property to
 * @return {any|sap.ui.core.Element} Returns <code>this</code> to allow method chaining in case of setter and the property value in case of getter
 * @public
 */
sap.ui.core.Element.prototype.prop = function(sPropertyName, oValue) {

	var oPropertyInfo = this.getMetadata().getJSONKeys()[sPropertyName];
	if (oPropertyInfo) {
		if (arguments.length == 1) {
			// getter
			return this[oPropertyInfo._sGetter]();
		} else {
			// setter
			this[oPropertyInfo._sMutator](oValue);
			return this;
		}
	}
};

/**
 * Sets a new value for the given property <code>sPropertyName</code> and marks
 * this UI element for redraw. If the given <code>oValue</code> equals the
 * current value, nothing happens.
 *
 * @param {string}  sPropertyName name of the property to set
 * @param {any}     oValue value to set the property to
 * @param {boolean} [bSuppressInvalidate] if true, the UI element is not marked for redraw
 * @return {sap.ui.core.Element} Returns <code>this</code> to allow method chaining
 * TODO better name bSuppressInvalidate positive, e.g. "bStayValid"
 * @protected
 */
sap.ui.core.Element.prototype.setProperty = function(sPropertyName, oValue, bSuppressInvalidate) {

	// check for a value change
	var oOldValue = this.mProperties[sPropertyName];

	// value validation
	oValue = this.validateProperty(sPropertyName, oValue);

	if (jQuery.sap.equal(oOldValue, oValue)) {
		return this;
	} // no change

	// set suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate++;
	}

	// change the property (and invalidate if the rendering should be updated)
	this.mProperties[sPropertyName] = oValue;
	if (!this.isInvalidateSuppressed()) {
		this.invalidate();
	}

	// check whether property is bound and update model in case of two way binding
	this.updateModelProperty(sPropertyName, oValue, oOldValue);

	// prototype for generic property change events
	// TODO: THINK ABOUT CONFIGURATION TO ENABLE THIS
	sap.ui.base.EventProvider.prototype.fireEvent.apply(this, ["_change", {
		"id": this.getId(),
		"name": sPropertyName,
		"oldValue": oOldValue,
		"newValue": oValue
	}]);

	// reset suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate--;
	}

	return this;
};

/**
 * Returns the value for the property with the given <code>sPropertyName</code>
 *
 * @param {string} sPropertyName the name of the property
 * @type any
 * @return the value of the property
 * @protected
 */
sap.ui.core.Element.prototype.getProperty = function(sPropertyName) {
	var oValue = this.mProperties[sPropertyName],
		oMetadata = this.getMetadata(),
		oProperty = oMetadata.getAllProperties()[sPropertyName],
		oType;

	if (!oProperty) {
		throw new Error("Property \"" + sPropertyName + "\" does not exist in " + this);
	}

	oType = sap.ui.base.DataType.getType(oProperty.type);

	// If property has an array type, clone the array to avoid modification of original data
	if (oType instanceof sap.ui.base.DataType && oType.isArrayType() && jQuery.isArray(oValue)) {
		oValue = oValue.slice(0);
	}
	
	// If proprerty is of type String instead of string, convert with valueOf()
	if (oValue instanceof String) {
		oValue = oValue.valueOf();
	}
	
	return oValue;
};

/**
 * Checks whether the given value is of the proper type for the given property name. In case null or undefined is
 * passed, the default value for this property is returned.
 *
 * @param {string} sPropertyName the name of the property
 * @param {any} oValue the value
 * @return {any} the passed value or the property's default value if null or undefined was passed
 * @throws Error if no property with the given name is found or the given value does not fit to the property type
 * @protected
 */
sap.ui.core.Element.prototype.validateProperty = function(sPropertyName, oValue) {
	var oMetadata = this.getMetadata(),
		oProperty = oMetadata.getAllProperties()[sPropertyName],
		oType;

	if (!oProperty) {
		throw new Error("Property \"" + sPropertyName + "\" does not exist in " + this);
	}

	oType = sap.ui.base.DataType.getType(oProperty.type);

	// If property has an array type, clone the array to avoid modification of original data
	if (oType instanceof sap.ui.base.DataType && oType.isArrayType() && jQuery.isArray(oValue)) {
		oValue = oValue.slice(0);
	}
	
	// In case null is passed as the value return the default value, either from the property or from the type
	if (oValue === null || oValue === undefined) {
		if (oProperty.defaultValue !== null) {
			return oProperty.defaultValue;
		} else {
			return oType.getDefaultValue();
		}
	}

	// Implicit casting for string only, other types are causing errors
	if (oType instanceof sap.ui.base.DataType) {
		if (oType.getName() == "string") {
			if (!(typeof oValue == "string" || oValue instanceof String)) {
				oValue = "" + oValue;
			}
		} else if (oType.getName() == "string[]") {
			for (var i = 0; i < oValue.length; i++) {
				if (!typeof oValue[i] == "string") {
					oValue[i] = "" + oValue[i];
				}
			}
		} else if (!oType.isValid(oValue)) {
			throw new Error("\"" + oValue + "\" is of type " + typeof oValue + ", expected " +
					oType.getName() + " for property \"" + sPropertyName + "\" of " + this);
		}
	} else if (!(oValue in oType)){ // Enumeration
		throw new Error("\"" + oValue + "\" is not a valid entry of the enumeration for property \"" + sPropertyName + "\" of " + this);
	}

	return oValue;
};

/**
 * Checks whether the given value is of the proper type for the given aggregation name. 
 *
 * @param {string} sAggregationName the name of the aggregation
 * @param {sap.ui.core.Element|any} oElement the aggregated element or a primitive value
 * @param {boolean} bMultiple whether the aggregation must have cardinality 0..n
 * @return {sap.ui.core.Element|any} the passed object
 * @throws Error if no aggregation with the given name is found or the given value does not fit to the aggregation type
 * @protected
 */
sap.ui.core.Element.prototype.validateAggregation = function(sAggregationName, oElement, bMultiple) {
	var oMetadata = this.getMetadata(),
		oAggregation = oMetadata.getAllAggregations()[sAggregationName],
		aAltTypes,
		oType,
		i;

	// undeclared aggregation 
	if (!oAggregation) {
		if(sAggregationName && oMetadata._mHiddenAggregations && oMetadata._mHiddenAggregations[sAggregationName]){
			oAggregation = oMetadata._mHiddenAggregations[sAggregationName];
		}else{
			throw new Error("Aggregation \"" + sAggregationName + "\" does not exist in " + this);
		}
	}

	// TODO should this be part of the validation (raise an error) or not?
	jQuery.sap.assert(oAggregation.multiple === bMultiple, "Aggregation '" + sAggregationName + "' of " + this + " used with wrong cardinality (declared as " + (oAggregation.multiple ? "0..n" : "0..1") + ")");
	
	//Null is a valid value for 0..1 aggregations
	if(!oAggregation.multiple && !oElement){
		return oElement;
	}
	
	oType = jQuery.sap.getObject(oAggregation.type);
	// class types
	if ( typeof oType === "function" && oElement instanceof oType ) {
		return oElement;
	}
	// interfaces 
	if ( oElement && oElement.getMetadata && oElement.getMetadata().isInstanceOf(oAggregation.type) ) {
		return oElement;
	}
	// alternative types
	aAltTypes = oAggregation.altTypes;
	if ( aAltTypes && aAltTypes.length ) {
		// for primitive types, null or undefined is valid as well 
		if ( oElement == null ) {
			return oElement;
		}
		for (i=0; i<aAltTypes.length; i++) {
			oType = sap.ui.base.DataType.getType(aAltTypes[i]);
			if (oType instanceof sap.ui.base.DataType) {
				if (oType.isValid(oElement)) {
					return oElement;
				}
			} else if (oElement in oType) { // Enumeration
				return oElement;
			}
		}
	}
	throw new Error("\"" + oElement + "\" is not valid for aggregation \"" + sAggregationName + "\" of " + this);
}

/**
 * Returns the origin info on the property value of the given property name
 *
 * @param {string} sPropertyName the name of the property
 * @return {object} a map of properties describing the origin of this property value or null
 * @public
 */
sap.ui.core.Element.prototype.getOriginInfo = function(sPropertyName) {
	var oValue = this.mProperties[sPropertyName];
	if (!(oValue instanceof String && oValue.originInfo)) {
		return null;
	}
	return oValue.originInfo;
};


// ######################################################################################################
// Associations
// ######################################################################################################

/**
 * Sets an association for the control
 *
 * @param {string}
 *            sAssociationName name of the association
 * @param {string | sap.ui.core.Element}
 *            sId the ID of the control that is set as an association, or the control itself or null
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element is not marked for redraw
 * @return {sap.ui.core.Element} Returns <code>this</code> to allow method chaining
 * @protected
 */
sap.ui.core.Element.prototype.setAssociation = function(sAssociationName, sId, bSuppressInvalidate) {
	if (sId instanceof sap.ui.core.Element) {
		sId = sId.getId();
	} else if (sId != null && typeof sId !== "string") {
		jQuery.sap.assert(false, "setAssociation(): sId must be a string, an instance of sap.ui.core.Element or null");
		return this;
	}

	if (this.mAssociations[sAssociationName] === sId) {
		return this;
	} // no change

	// set suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate++;
	}

	this.mAssociations[sAssociationName] = sId;

	if (!this.isInvalidateSuppressed()) {
		this.invalidate();
	}

	// reset suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate--;
	}

	return this;
};

/**
 * Returns an association of the control with a given sAssociationName
 *
 * @param {string} sAssociationName the name of the association
 * @param {object}
 *			  oDefaultForCreation the object that is used in case the current aggregation is empty (only null or empty array allowed)
 * @return {string | string[]} the ID of the associated control or an array of such IDs; may be null if the association has not been populated
 * @protected
 */
sap.ui.core.Element.prototype.getAssociation = function(sAssociationName, oDefaultForCreation) {
	var result = this.mAssociations[sAssociationName];

	if (!result) {
		result = this.mAssociations[sAssociationName] = oDefaultForCreation || null;
	} else {
		if (typeof result.length === 'number' && !(result.propertyIsEnumerable('length')) ) {
			// Return a copy of the array instead of the array itself as reference!!
			return result.slice();
		}
		// simple type or Element
		return result;
	}

	return result;
};

/**
 * Adds some entity with the ID <code>sId</code> to the association identified by <code>sAssociationName</code>.
 *
 * @param {string}
 *            sAssociationName the string identifying the association the element should be added to.
 * @param {string | sap.ui.core.Element}
 *            sId the ID of the element to add; if empty, nothing is added; if a <code>sap.ui.core.Element</code> is given, its ID is added
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element as well as the newly associated element is not marked for redraw
 * @return {sap.ui.core.Element} Returns <code>this</code> to allow method chaining
 * @protected
 */
sap.ui.core.Element.prototype.addAssociation = function(sAssociationName, sId, bSuppressInvalidate) {
	if (sId instanceof sap.ui.core.Element) {
		sId = sId.getId();
	} else if (typeof sId !== "string") {
	  // TODO what about empty string?
    jQuery.sap.assert(false, "addAssociation(): sId must be a string or an instance of sap.ui.core.Element");
		return this;
	}

	// set suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate++;
	}

	var aIds = this.mAssociations[sAssociationName];
	if (!aIds) {
		aIds = this.mAssociations[sAssociationName] = [sId];
	} else {
		aIds.push(sId);
	}

	if (!this.isInvalidateSuppressed()) {
		this.invalidate();
	}

	// reset suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate--;
	}

	return this;
};

/**
 * Removes an Element from the association named <code>sAssociationName</code>.
 *
 * @param {string}
 *            sAssociationName the string identifying the association the Element should be removed from.
 * @param {int | string | sap.ui.core.Element}
 *            vElement the position or ID of the Element to remove or the Element itself; if <code>vElement</code> is invalid input,
 *            a negative value or a value greater or equal than the current size of the association, nothing is removed
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element is not marked for redraw
 * @return the ID of the removed Element or null
 * @protected
 */
sap.ui.core.Element.prototype.removeAssociation = function(sAssociationName, vElement, bSuppressInvalidate) {
	var aIds = this.mAssociations[sAssociationName];
	var sId = null;

	// set suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate++;
	}

	if (typeof(vElement) == "object" && vElement.getId) { // element itself is given
		vElement = vElement.getId();
	}

	if (typeof(vElement) == "string") { // ID of the element is given or has just been retrieved
		for (var i = 0; i < aIds.length; i++) {
			if (aIds[i] == vElement) {
				vElement = i;
				break;
			}
		}
	}

	if (typeof(vElement) == "number") { // "element" is the index now
		if (vElement < 0 || vElement >= aIds.length) {
			jQuery.sap.log.warning("Element.removeAssociation called with invalid index: " + sAssociationName + ", " + vElement);
		} else {
			sId = aIds[vElement];
			aIds.splice(vElement, 1);
			if (!this.isInvalidateSuppressed()) {
				this.invalidate();
			}
		}
	}

	// reset suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate--;
	}

	return sId;
};

/**
 * Removes all the controls in the 0..n-association named <code>sAssociationName</code> (and returns them in an array).<br/>
 *
 * @param {string}
 *            sAssociationName the name of the association
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element is not marked for redraw
 * @type Array
 * @return an array with the IDs of the removed elements (might be empty)
 * @protected
 */
sap.ui.core.Element.prototype.removeAllAssociation = function(sAssociationName, bSuppressInvalidate){
	var aIds = this.mAssociations[sAssociationName];
	if (!aIds)	{
		return [];
	}

	// set suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate++;
	}

	delete this.mAssociations[sAssociationName];
	if (!this.isInvalidateSuppressed()) {
		this.invalidate();
	}

	// reset suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate--;
	}

	return aIds;
};

// ######################################################################################################
// End of Associations
// ######################################################################################################


// ######################################################################################################
// Aggregations
// ######################################################################################################
/**
 * Sets an aggregation for the control
 *
 * @param {string}
 *            sAggregationName name of the aggregation
 * @param {object}
 *            oElement the control that is set as an aggregation
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element is not marked for redraw
 * @return {sap.ui.core.Element} Returns <code>this</code> to allow method chaining
 * @protected
 */
sap.ui.core.Element.prototype.setAggregation = function(sAggregationName, oElement, bSuppressInvalidate) {
	var oOldChild = this.mAggregations[sAggregationName];
	if (oOldChild === oElement) {
		return this;
	} // no change
	// starting with 1.6: oelement = this.validateAggregation(sAggregationName, oElement, /* multiple */ true)
	jQuery.sap.assert.apply(jQuery.sap, (function(that) { 
		try { 
			that.validateAggregation(sAggregationName, oElement, /* multiple */ false); 
			return [true]; 
		} catch (e) { 
			return [false, e.message]; 
		}
	}(this)));

	// set suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate++;
	}

	if (oOldChild instanceof sap.ui.core.Element) { // remove old child
		oOldChild.setParent(null);
	}
	this.mAggregations[sAggregationName] = oElement;
	if (oElement instanceof sap.ui.core.Element) { // adopt new child
		oElement.setParent(this, sAggregationName, bSuppressInvalidate);
	} else {
		if (!this.isInvalidateSuppressed()) {
			this.invalidate();
		}
	}

	// reset suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate--;
	}

	return this;
};

/**
 * Returns an aggregation of the control with a given sAggregationName
 *
 * @param {string}
 *            sAggregationName the name of the aggregation
 * @param {sap.ui.core.Element | Array}
 *			  oDefaultForCreation the object that is used in case the current aggregation is empty
 * @type sap.ui.core.Element|Array
 * @return the aggregation array in case of 0..n-aggregations or the control or null in case of 0..1-aggregations
 * @protected
 */
sap.ui.core.Element.prototype.getAggregation = function(sAggregationName, oDefaultForCreation) {
	var aChildren = this.mAggregations[sAggregationName];
	if (!aChildren) {
		aChildren = this.mAggregations[sAggregationName] = oDefaultForCreation || null;
	}
	if (aChildren) {
		if (typeof aChildren.length === 'number' && !(aChildren.propertyIsEnumerable('length')) ) {
			// Return a copy of the array instead of the array itself as reference!!
			return aChildren.slice();
		}
		// simple type or Element
		return aChildren;
	} else {
		return null;
	}
};

/**
 * Checks for the provided control <code>oElement</code> in the aggregation
 * named <code>sAggregationName</code> and returns its index if found, or -1
 * otherwise. Returns -2 if the given named aggregation is not a multiple one
 * (and does not contain the given child).
 *
 * @param {string}
 *            sAggregationName the name of the aggregation
 * @param {sap.ui.core.Element}
 *            oElement the Control whose index is looked for.
 * @return {int} the index of the provided control in the aggregation.
 * @protected
 */
sap.ui.core.Element.prototype.indexOfAggregation = function(sAggregationName, oElement) {
	var aChildren = this.mAggregations[sAggregationName];
	if (aChildren) {
		if (aChildren.length == undefined) {
			return -2;
		} // not a multiple aggregation

		for (var i = 0; i < aChildren.length; i++) {
			if (aChildren[i] == oElement) {
				return i;
			}
		}
	}
	return -1;
};

/**
 * Inserts control <code>oElement</code> to the aggregation named <code>sAggregationName</code> at
 * position <code>iIndex</code>.
 *
 * @param {string}
 *            sAggregationName the string identifying the aggregation the control <code>oElement</code>
 *            should be inserted into.
 * @param {sap.ui.core.Element}
 *            oElement the element to add; if empty, nothing is inserted.
 * @param {int}
 *            iIndex the <code>0</code>-based index the control should be inserted at; for a negative
 *            value <code>iIndex</code>, <code>oElement</code> is inserted at position 0; for a value
 *            greater than the current size of the aggregation, <code>oElement</code> is inserted at
 *            the last position
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element as well as the added child is not marked for redraw
 * @return {sap.ui.core.Element} Returns <code>this</code> to allow method chaining
 * @protected
 */
sap.ui.core.Element.prototype.insertAggregation = function(sAggregationName, oElement, iIndex, bSuppressInvalidate) {
	if (!oElement) {
		return this;
	}
	// starting with 1.6: oElement = this.validateAggregation(sAggregationName, oElement, /* multiple */ true)
	jQuery.sap.assert.apply(jQuery.sap, (function(that) { 
		try { 
			that.validateAggregation(sAggregationName, oElement, /* multiple */ true); 
			return [true]; 
		} catch (e) { 
			return [false, e.message]; 
		}
	}(this)));

	var aChildren = this.mAggregations[sAggregationName] || (this.mAggregations[sAggregationName] = []);
	// force index into valid range 
	var i = iIndex < 0 ? 0 : (iIndex > aChildren.length ? aChildren.length : iIndex);
	if (i !== iIndex) {
		jQuery.sap.log.warning("Element.insertAggregation: index '" + iIndex + "' out of range [0," + aChildren.length + "], forced to " + i);
	}
	aChildren.splice(i, 0, oElement);
	oElement.setParent(this, sAggregationName, bSuppressInvalidate);

	return this;
};

/**
 * Adds some entity <code>oElement</code> to the aggregation identified by <code>sAggregationName</code>.
 *
 * @param {string}
 *            sAggregationName the string identifying the aggregation the element <code>oElement</code> should be added to.
 * @param {sap.ui.core.Element}
 *            oElement the element to add; if empty, nothing is added
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element as well as the added child is not marked for redraw
 * @return {sap.ui.core.Element} Returns <code>this</code> to allow method chaining
 * @protected
 */
sap.ui.core.Element.prototype.addAggregation = function(sAggregationName, oElement, bSuppressInvalidate) {
	if (!oElement) {
		return this;
	}
	// starting with 1.6: oElement = this.validateAggregation(sAggregationName, oElement, /* multiple */ true)
	jQuery.sap.assert.apply(jQuery.sap, (function(that) { 
		try { 
			that.validateAggregation(sAggregationName, oElement, /* multiple */ true); 
			return [true]; 
		} catch (e) { 
			return [false, e.message]; 
		}
	}(this)));

	var aChildren = this.mAggregations[sAggregationName];
	if (!aChildren) {
		aChildren = this.mAggregations[sAggregationName] = [oElement];
	} else {
		aChildren.push(oElement);
	}
	oElement.setParent(this, sAggregationName, bSuppressInvalidate);

	return this;
};

/**
 * Removes an element from the aggregation named <code>sAggregationName</code>.
 *
 * @param {string}
 *            sAggregationName the string identifying the aggregation the Element should be removed from
 * @param {int | string | sap.ui.core.Element}
 *            vElement the position or ID of the Element to remove or the Element itself; if <code>vElement</code> is invalid,
 *            a negative value or a value greater or equal than the current size of the aggregation, nothing is removed
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element is not marked for redraw
 * @type sap.ui.core.Element
 * @return the removed element or null
 * @protected
 */
sap.ui.core.Element.prototype.removeAggregation = function(sAggregationName, vElement, bSuppressInvalidate) {
	var aChildren = this.mAggregations[sAggregationName];
	var oChildControl = null;

	// set suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate++;
	}

	if (typeof(vElement) == "string") { // ID of the element is given
		vElement = sap.ui.getCore().byId(vElement);
	}

	if (typeof(vElement) == "object") { // the element itself is given or has just been retrieved
		for (var i = 0; i < aChildren.length; i++) {
			if (aChildren[i] == vElement) {
				vElement = i;
				break;
			}
		}
	}

	if (typeof(vElement) == "number") { // "vElement" is the index now
		if (vElement < 0 || vElement >= aChildren.length) {
			jQuery.sap.log.warning("Element.removeAggregation called with invalid index: " + sAggregationName + ", " + vElement);

		} else {
			oChildControl = aChildren[vElement];
			aChildren.splice(vElement, 1);
			oChildControl.setParent(null);
			if (!this.isInvalidateSuppressed()) {
				this.invalidate();
			}
		}
	}

	// reset suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate--;
	}

	return oChildControl;
};

/**
 * Removes all the controls in the 0..n-aggregation named <code>sAggregationName</code> (and returns them in an array).<br/>
 * Additionally unregisters them from the hosting UIArea.
 *
 * @param {string}
 *            sAggregationName the name of the aggregation
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element is not marked for redraw
 * @type Array
 * @return an array of the removed elements (might be empty)
 * @protected
 */
sap.ui.core.Element.prototype.removeAllAggregation = function(sAggregationName, bSuppressInvalidate){
	var aChildren = this.mAggregations[sAggregationName];
	if (!aChildren)	{
		return [];
	}

	// set suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate++;
	}

	delete this.mAggregations[sAggregationName];
	for (var i = 0; i < aChildren.length; i++) {
		aChildren[i].setParent(null);
	}
	if (!this.isInvalidateSuppressed()) {
		this.invalidate();
	}

	// reset suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate--;
	}

	return aChildren;
};

/**
 * Destroys (all) the control(s) in the aggregation named <code>sAggregationName</code> and afterwards empties the
 * aggregation.
 *
 * @param {string}
 *            sAggregationName the name of the aggregation
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element is not marked for redraw
 * @return {sap.ui.core.Element} Returns <code>this</code> to allow method chaining
 * @protected
 */
sap.ui.core.Element.prototype.destroyAggregation = function(sAggregationName, bSuppressInvalidate){
	var aChildren = this.mAggregations[sAggregationName];
	if (!aChildren) {
		return this;
	}

	// set suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate++;
	}

	delete this.mAggregations[sAggregationName];
	if (aChildren instanceof sap.ui.core.Element) {
		aChildren.destroy(bSuppressInvalidate);
	} else if (aChildren && jQuery.isArray(aChildren)) {
		for (var i = 0; i < aChildren.length; i++) {
			if (aChildren[i]) {
				aChildren[i].destroy(bSuppressInvalidate);
			}
		}
	}
	if (!this.isInvalidateSuppressed()) {
		this.invalidate();
	}

	// reset suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate--;
	}

	return this;
};

// ######################################################################################################
// End of Aggregations
// ######################################################################################################


/**
 * Getter for aggregation <code>customData</code>.<br/>
 *
 * @return {sap.ui.core.CustomData[]}
 * @function
 * @name sap.ui.core.Element.prototype.getCustomData
 * @public
 */

/**
 * Inserts a CustomData element into the aggregation named <code>customData</code>.
 *
 * @param {sap.ui.core.CustomData}
 *          oCustomData the customData to insert; if empty, nothing is inserted
 * @param {int}
 *             iIndex the <code>0</code>-based index the customData should be inserted at; for
 *             a negative value of <code>iIndex</code>, the customData is inserted at position 0; for a value
 *             greater than the current size of the aggregation, the customData is inserted at
 *             the last position
 * @return {sap.ui.core.Element} <code>this</code> to allow method chaining
 * @function
 * @name sap.ui.core.Element.prototype.insertCustomData
 * @public
 */

/**
 * Adds some customData element <code>oCustomData</code>
 * to the aggregation named <code>customData</code>.
 *
 * @param {sap.ui.core.CustomData}
 *            oCustomData the customData to add; if empty, nothing is inserted
 * @return {sap.ui.core.Element} <code>this</code> to allow method chaining
 * @function
 * @name sap.ui.core.Element.prototype.addCustomData
 * @public
 */

/**
 * Removes a CustomData element from the aggregation named <code>customData</code>.
 *
 * @param {int | string | sap.ui.core.CustomData} vCustomData the customData to remove or its index or id
 * @return {sap.ui.core.CustomData} the removed customData element or null
 * @function
 * @name sap.ui.core.Element.prototype.removeCustomData
 * @public
 */

/**
 * Removes all the data elements in the aggregation named <code>customData</code>.<br/>
 *
 * @return {sap.ui.core.CustomData[]} an array of the removed data elements (might be empty)
 * @function
 * @name sap.ui.core.Element.prototype.removeAllCustomData
 * @public
 */

/**
 * Checks for the provided <code>sap.ui.core.CustomData</code> in the aggregation named <code>customData</code>
 * and returns its index if found or -1 otherwise.
 *
 * @param {sap.ui.core.CustomData}
 *            oCustomData the customData whose index is looked for.
 * @return {int} the index of the provided customData element in the aggregation if found, or -1 otherwise
 * @function
 * @name sap.ui.core.Element.prototype.indexOfCustomData
 * @public
 */

/**
 * Destroys all the customData elements in the aggregation
 * named <code>customData</code>.
 * @return {sap.ui.core.Element} <code>this</code> to allow method chaining
 * @function
 * @name sap.ui.core.Element.prototype.destroyCustomData
 * @public
 */


jQuery.sap.require("sap.ui.core.Core");/// cyclic dependency
//jQuery.sap.require("sap.ui.core.TooltipBase"); /// cyclic dependency

/**
 * This triggers rerendering of itself and its children.<br/> As <code>sap.ui.core.Element</code> "bubbles up" the
 * invalidate, changes to child-<code>Elements</code> will also result in rerendering of the whole sub tree.
 * @protected
 */
sap.ui.core.Element.prototype.invalidate = function() {
	if (this.oParent) {
		this.oParent.invalidate(this);
	}
};

/**
 * This triggers immediate rerendering of its parent and thus of itself and its children.<br/> As <code>sap.ui.core.Element</code> "bubbles up" the
 * rerender, changes to child-<code>Elements</code> will also result in immediate rerendering of the whole sub tree.
 * @protected
 */
sap.ui.core.Element.prototype.rerender = function() {
	if (this.oParent) {
		this.oParent.rerender();
	}
};

/**
 * Returns whether rerendering is currently suppressed on this Element
 * @return boolean
 * @protected
 */
sap.ui.core.Element.prototype.isInvalidateSuppressed = function() {
	var bInvalidateSuppressed = this.iSuppressInvalidate > 0;
	if (this.oParent && this.oParent instanceof sap.ui.core.Element) {
		bInvalidateSuppressed = bInvalidateSuppressed || this.oParent.isInvalidateSuppressed();
	}
	return bInvalidateSuppressed;
};


/**
 * Removes the given child from this element's named aggregation.
 * @see sap.ui.core.UIArea#_removeChild
 * @see sap.ui.core.Element#setParent
 *
 * @param {sap.ui.core.Element}
 *            oChild the child element to be removed
 * @param {string}
 *            sAggregationName the name of this element's aggregation
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element is not marked for redraw
 * @protected
 */
sap.ui.core.Element.prototype._removeChild = function(oChild, sAggregationName, bSuppressInvalidate) {
	if (!sAggregationName) {
		// an aggregation name has to be specified!
		jQuery.sap.log.error("Cannot remove aggregated child without aggregation name.", null, this);
	} else {
		// set suppress invalidate flag
		if (bSuppressInvalidate) {
			this.iSuppressInvalidate++;
		}

		var iIndex = this.indexOfAggregation(sAggregationName, oChild);
		var oAggregationInfo = this.getMetadata().getJSONKeys()[sAggregationName];
		// Note: we assume that this is the given child's parent, i.e. -1 not expected!
		if (iIndex == -2) { // 0..1
			if(oAggregationInfo && this[oAggregationInfo._sMutator]) { // TODO properly deal with hidden aggregations
				this[oAggregationInfo._sMutator](null);
			}
			else {
				this.setAggregation(sAggregationName, null, bSuppressInvalidate);
			}
		} else if(iIndex > -1 ) { // 0..n
			if(oAggregationInfo && this[oAggregationInfo._sRemoveMutator]) { // TODO properly deal with hidden aggregations
				this[oAggregationInfo._sRemoveMutator](iIndex);
			}
			else {
				this.removeAggregation(sAggregationName, iIndex, bSuppressInvalidate);
			}
		} else {
			// already removed!?
			// this is the unexpected -1
			// TODO: What would be better? Explicit removeCompositeChild callback on subclass?
		}
		if (!this.isInvalidateSuppressed()) {
			this.invalidate();
		}

		// reset suppress invalidate flag
		if (bSuppressInvalidate) {
			this.iSuppressInvalidate--;
		}
	}
};

/**
 * Defines this element's new parent. If no new parent is given, the parent is
 * just reset and we assume that the old parent has removed this child from its
 * aggregation. But if a new parent is given, this child is first removed from
 * its old parent.
 *
 * @param {sap.ui.core.Element}
 *            oParent the element that becomes this element's parent
 * @param {string}
 *            sAggregationName the name of the parent element's aggregation
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element is not marked for redraw. The old parent, however, is marked for redraw.
 * @return {sap.ui.core.Element}
 *            Returns <code>this</code> to allow method chaining
 * @private
 */
sap.ui.core.Element.prototype.setParent = function(oParent, sAggregationName, bSuppressInvalidate) {
	if ( !oParent ) {
		this.oParent = null;
		this.sParentAggregationName = null;
		// Note: no need (and no way how) to invalidate
		return;
	}

	// set suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate++;
	}

	var oOldParent = this.getParent();
	if (oOldParent) { // remove this element from its old parent
		// Note: bSuppressInvalidate  by intention is not propagated to the old parent.
		// It is not sure whether the (direct or indirect) caller of setParent
		// has enough knowledge about the old parent to automatically propagate this.
		// If needed, callers can first remove the element from the oldParent (specifying a 
		// suitable value for bSuppressInvalidate there) and only then call setParent.
		oOldParent._removeChild(this, this.sParentAggregationName);  
	}
	// adopt new parent
	this.oParent = oParent;
	this.sParentAggregationName = sAggregationName;

	// update bindings
	if (this.hasModel()) {
		this.updateBindingContext();
		this.updateBindings(true);
	}

	// Only invalidate if the control already is in the HTML and has been initialized (i.e. has a parent)
	/*if((!this.bPrerendered || this.bPrerendered && oOldParent)) {
		if (!this.isInvalidateSuppressed()) {
			this.invalidate();
		}
	}*/
	
	// only the parent knows where to render us, so we have to invalidate it
	if ( oParent && !this.isInvalidateSuppressed() ) {
		oParent.invalidate(this);
	}
	
	// reset suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate--;
	}

	return this;
};

/**
 * Returns the parent control or <code>null</code> if this element hasn't been added to a parent yet.
 *
 * @return {sap.ui.core.Element} The parent control or <code>null</code>
 * @public
 */
sap.ui.core.Element.prototype.getParent = function() {
	/* Be aware that internally this.oParent is used to reduce method calls. 
	 * Check for side effects when overriding this method */
	return this.oParent;
};

/**
 * Returns the UI area of this element, if any.
 *
 * @return {sap.ui.core.UIArea} The UI area of this element or null
 * @private
 */
sap.ui.core.Element.prototype.getUIArea = function() {
	return this.oParent ? this.oParent.getUIArea() : null;
};

/**
 * Cleans up the resources associated with this element and all its children.
 *
 * After an element has been destroyed, it can no longer be used in the UI!
 *
 * Applications should call this method if they don't need the element any longer.
 *
 * @param {boolean}
 *            [bSuppressInvalidate] if true, the UI element is not marked for redraw
 * @public
 */
sap.ui.core.Element.prototype.destroy = function(bSuppressInvalidate) {
	var that = this;

	// jQuery.sap.log.debug("destroying " + this);

	// set suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate++;
	}

	if (this.exit) {
		this.exit();
	}

	// TODO: generic concept for exit hooks?
	if ( this._exitCompositeSupport ) {
		this._exitCompositeSupport();
	}

	// ensure that also our children are destroyed!!
	for(var oAggr in this.mAggregations){
		this.destroyAggregation(oAggr, bSuppressInvalidate);
	}
	this.deregister();

	// remove this child from parent aggregation
	if (this.oParent && this.sParentAggregationName) {
		this.oParent._removeChild(this, this.sParentAggregationName, bSuppressInvalidate);
	}

	// Data Binding
	jQuery.each(this.mBindingInfos, function(sName, oBindingInfo) {
		if (oBindingInfo.factory) {
			that.unbindAggregation(sName);
		} else {
			that.unbindProperty(sName);
		}
	});

	// reset suppress invalidate flag
	if (bSuppressInvalidate) {
		this.iSuppressInvalidate--;
	}

	// remove this control from DOM, e.g. if there is no parent (e.g. Dialog or already removed control) or this.sParentAggregationName is not properly set
	this.$().remove();

	// finally make the element unusable
	this.setParent = function(){
		throw Error("The control with ID "+that.getId()+" was destroyed and cannot be used anymore.");
	};

	// make visible that it's been destroyed.
	this.bIsDestroyed = true;

};

/**
 * Fires the given event and notifies all listeners. Listeners must not change
 * the content of the event.
 *
 * @param {string} sEventId the event id
 * @param {object} mParameters the parameter map
 * @return {sap.ui.core.Element} Returns <code>this</code> to allow method chaining
 * @protected
 */
sap.ui.core.Element.prototype.fireEvent = function(sEventId, mParameters) {
	// TODO 'id' is somewhat redundant to getSource(), but it is commonly used - fade out with next major release?
	mParameters = mParameters || {};
	mParameters.id = mParameters.id || this.getId();
	// 'arguments' is necessary, as the EventProvider.fireEvent signature has more parameters
	return sap.ui.base.EventProvider.prototype.fireEvent.apply(this, arguments);
};

/**
 * Adds a delegate that listens to the events of this element.
 *
 * To avoid double registrations, all registrations of the given delegate are first
 * removed and then the delegate is added.
 * @param {sap.ui.base.EventProvider} oDelegate the delegate object
 * @param {boolean} [bCallBefore] if true, the delegator event listeners are called before the event listeners of the element
 * @return {sap.ui.core.Element} Returns <code>this</code> to allow method chaining
 * @private
 */
sap.ui.core.Element.prototype.addDelegate = function (oDelegate, bCallBefore) {
	this.removeDelegate(oDelegate);
	(bCallBefore ? this.aBeforeDelegates : this.aDelegates).push(oDelegate);
	return this;
};

/**
 * Removes the given delegate from this element.
 *
 * This method will remove all registrations of the given delegate, not only one.
 * @param {sap.ui.base.EventProvider} oDelegate the delegate object
 * @return {sap.ui.core.Element} Returns <code>this</code> to allow method chaining
 * @private
 */
sap.ui.core.Element.prototype.removeDelegate = function (oDelegate) {
	for (var i=0;i<this.aDelegates.length;i++) {
		if (this.aDelegates[i]==oDelegate) {
			this.aDelegates.splice(i,1);
		}
	}
	for (var i=0;i<this.aBeforeDelegates.length;i++) {
		if (this.aBeforeDelegates[i]==oDelegate) {
			this.aBeforeDelegates.splice(i,1);
		}
	}
	return this;
};

/**
 * Returns the dom reference that should get the focus
 * To be overwritten by the specific control method
 * @type DOMNode
 * @return Returns the dom reference that should get the focus
 */
sap.ui.core.Element.prototype.getFocusDomRef = function () {
	return this.getDomRef() || null;
};

/**
 * Sets the focus to the stored focus dom reference
 * @private
 */
sap.ui.core.Element.prototype.focus = function () {
	var oFocusDomRef = this.getFocusDomRef();

	if(oFocusDomRef) {
		try {
			oFocusDomRef.focus();
		} catch (ex) { // IE8 fails on focusing certain elements; IE9+10 and all other current browsers don't fail
			// the element does not exist or is not focusable; there is no information what to focus instead
			var id = oFocusDomRef.id ? " (id: " + oFocusDomRef.id + ")" : " ";
			jQuery.sap.log.warning("DOM element" + id + " in " + this.toString() + " which should be focused cannot be focused: " + ex.message);
		}
	}
};

/**
 * Returns an object representing the serialized focus information
 * To be overwritten by the specific control method
 * @type object
 * @return an object representing the serialized focus information
 * @protected
 */
sap.ui.core.Element.prototype.getFocusInfo = function () {
	return {id:this.getId()};
};

/**
 * Applies the focus info
 * To be overwritten by the specific control method
 * @param {object} oFocusInfo
 * @protected
 */
sap.ui.core.Element.prototype.applyFocusInfo = function (oFocusInfo) {
	this.focus();
	return this;
};


/**
 * Sets a new tooltip for this object. The tooltip can either be a simple string
 * (which in most cases will be rendered as the <code>title</code> attribute of this
 * Element) or an instance of {@link sap.ui.core.TooltipBase}.
 *
 * If a new tooltip is set, any previously set tooltip is deactivated.
 *
 * @param {string|sap.ui.core.TooltipBase} oTooltip.
 * @public
 */
sap.ui.core.Element.prototype.setTooltip = function(oTooltip) {

	var oOldTooltip = this.getTooltip();
	// if the old tooltip was a Tooltip object, remove it as a delegate
	if (oOldTooltip instanceof sap.ui.core.TooltipBase){
		this.removeDelegate(oOldTooltip);
	}
	// if the new tooltip is a Tooltip object, add it as a delegate
	if (oTooltip instanceof sap.ui.core.TooltipBase){
		oTooltip._currentControl = this;
		this.addDelegate(oTooltip);
	}
	this.setAggregation("tooltip", oTooltip);

	return this;
};

/**
 * Returns the tooltip for this element if any or an undefined value.
 * The tooltip can either be a simple string or a subclass of
 * {@link sap.ui.core.TooltipBase}.
 *
 * Callers that are only interested in tooltips of type string (e.g. to render
 * them as a <code>title</code> attribute), should call the convenience method
 * {@link #getTooltip_AsString} instead. If they want to get a tooltip text no
 * matter where it comes from (be it a string tooltip or the text from a TooltipBase
 * instance) then they could call {@link #getTooltip_Text} instead.
 *
 * @return {string|sap.ui.core.TooltipBase} The tooltip for this Element.
 * @public
 */
sap.ui.core.Element.prototype.getTooltip = function() {
	return this.getAggregation("tooltip");
};

/**
 * Returns the tooltip for this element but only if it is a simple string.
 * Otherwise an undefined value is returned.
 *
 * @return {string} string tooltip or undefined
 * @public
 */
sap.ui.core.Element.prototype.getTooltip_AsString = function() {
	var oTooltip = this.getTooltip();
	if (typeof oTooltip === "string" || oTooltip instanceof String ) {
		return oTooltip;
	}
	return undefined;
};

/**
 * Returns the main text for the current tooltip or undefined if there is no such text.
 * If the tooltip is an object derived from sap.ui.core.Tooltip, then the text property
 * of that object is returned. Otherwise the object itself is returned (either a string
 * or undefined or null).
 *
 * @return {string} text of the current tooltip or undefined
 * @public
 */
sap.ui.core.Element.prototype.getTooltip_Text = function() {
	var oTooltip = this.getTooltip();
	if (oTooltip && typeof oTooltip.getText === "function" ) {
		return oTooltip.getText();
	}
	return oTooltip;
};

/**
 * Returns the runtime metadata for this UI element.
 *
 * When using the defineClass method, this function is automatically created and returns
 * a runtime representation of the design time metadata.
 *
 * @function
 * @name sap.ui.core.Element.prototype.getMetadata
 * @return {object} runtime metadata
 * @public
 */
// sap.ui.core.Element.prototype.getMetadata = sap.ui.base.Object.ABSTRACT_METHOD;

//data container

(function(){

	/**
	 * Returns the data object with the given key
	 */
	var getDataObject = function(element, key) {
		var aData = element.getAggregation("customData");
		if (aData) {
			for (var i = 0; i < aData.length; i++) {
				if (aData[i].getKey() == key) {
					return aData[i];
				}
			}
		}
		return null;
	};

	/**
	 * Contains the data modification logic
	 */
	var setData = function(element, key, value) {

		// DELETE
		if (value === null) { // delete this property
			var dataObject = getDataObject(element, key);
			if (!dataObject) {
				return;
			}

			var dataCount = element.getAggregation("customData").length;
			if (dataCount == 1) {
				element.destroyAggregation("customData", true); // destroy if there is no other data
			} else {
				element.removeAggregation("customData", dataObject, true);
				dataObject.destroy();
			}

			// ADD or CHANGE
		} else {
			var dataObject = getDataObject(element, key);
			if (dataObject) {
				dataObject.setValue(value);
			} else {
				var dataObject = new sap.ui.core.CustomData({key:key,value:value});
				element.addAggregation("customData", dataObject, true);
			}
		}
	};

	/**
	 * Attaches custom data to an Element or retrieves attached data.
	 *
	 * Usage:
	 *    data("myKey", myData)
	 * attaches myData (which can be any JS data type, e.g. a number, a string, an object, or a function) to this element, under the given key "myKey"
	 *
	 *    data("myKey")
	 * retrieves whatever data has been attached to this Element (using the key "myKey") before
	 *
	 *    data("myKey", null)
	 * removes whatever data has been attached to this Element (using the key "myKey") before
	 *
	 *    data(null)
	 * removes all data
	 *
	 *    data()
	 * returns all data, as a map
	 *
	 * @public
	 */
	sap.ui.core.Element.prototype.data = function() {
		var argLength = arguments.length;

		if (argLength == 0) {                    // return ALL data as a map
			var aData = this.getAggregation("customData"),
				result = {};
			if (aData) {
				for (var i = 0; i < aData.length; i++) {
					result[aData[i].getKey()] = aData[i].getValue();
				}
			}
			return result;

		} else if (argLength == 1) {
			var arg0 = arguments[0];

			if (arg0 === null) {                  // delete ALL data
				this.destroyAggregation("customData", true); // delete whole map
				return this;

			} else if (typeof arg0 == "string") { // return requested data element
				var dataObject = getDataObject(this, arg0);
				return dataObject ? dataObject.getValue() : null;

			} else if (typeof arg0 == "object") { // should be a map - set multiple data elements
				for (var key in arg0) { // TODO: improve performance and avoid executing setData multiple times
					setData(this, key, arg0[key]);
				}
				return this;

			} else {
				// error, illegal argument
				throw new Error("When data() is called with one argument, this argument must be a string, an object or null, but is " + (typeof arg0) + ":" + arg0 + " (on UI Element with ID '" + this.getId() + "')");
			}

		} else if (argLength == 2) {            // set or remove one data element
			setData(this, arguments[0], arguments[1]);
			return this;

		} else {
			// error, illegal arguments
			throw new Error("data() may only be called with 0-2 arguments (on UI Element with ID '" + this.getId() + "')");
		}
	};

})();


// DataBinding
/**
 * Determines whether a given object contains binding information instead of a
 * value or aggregated controls. The method is used in applySettings for processing
 * the JSON notation of properties/aggregations in the constructor.
 *
 * @param {object} oValue the value
 * @param {object} oKeyInfo the metadata of the property
 *
 * @returns {boolean} whether the value contains binding information
 *
 * @private
 */
sap.ui.core.Element.prototype.isBinding = function(oValue, oKeyInfo) {
	if (oValue && typeof oValue == "object" && oValue.path && oKeyInfo.type != "object") {
		return true;
	}
	if (typeof oValue == "string" && jQuery.sap.startsWith(oValue, "{") && jQuery.sap.endsWith(oValue, "}")) {
		return true;
	}
	return false;
};

/**
 * Extracts the binding info from the given value. There are two possible notations
 * for binding information in the JSON notation of the control constructor:
 * - property: "{path}"
 *   This is used for property binding and can only contain the path.
 * - property:{path:"path", template:oTemplate}
 *   This is used for aggregation binding, where a template is required or can
 *   be used for property binding when additional data is required (e.g. formatter).
 *
 * @param {object} oValue
 *
 * @returns {object} the binding info object, containing at least a path property
 *                   and, dependant of the binding type, additional properties
 *
 * @private
 */
sap.ui.core.Element.prototype.extractBindingInfo = function(oValue) {
	var oBindingInfo;
	// property:{path:"path", template:oTemplate}
	if (oValue && typeof oValue == "object") {
		oBindingInfo = oValue;
	}
	// property:"{path}"
	if (typeof oValue == "string") {
		oBindingInfo = {};
		oBindingInfo.path = oValue.substr(1, oValue.length - 2);
	}
	return oBindingInfo;
};

/**
 * Returns the binding infos for the given property or aggregation. The binding info contains information about path, binding object, format options,
 * sorter, filter etc. for the property or aggregation.
 *
 * @param {string} sName the name of the property or aggregation
 *
 * @returns {object} the binding info object, containing at least a path property
 *                   and, dependant of the binding type, additional properties
 *
 * @protected
 */
sap.ui.core.Element.prototype.getBindingInfo = function(sName) {
	return this.mBindingInfos[sName];
};

/**
 * Bind the element to the referenced entity in the model, which is used as the binding context
 * to resolve bound properties or aggregations of the element itself and all of its children
 * relatively to the given path.
 * If a relative binding path is used, this will be applied whenever the parent context changes.
 * @param {string} sPath the binding path
 * @param {object} [mParameters] map of additional parameters for this binding
 *
 * @return {sap.ui.core.Element} reference to the instance itself
 * @public
 */
sap.ui.core.Element.prototype.bindElement = function(sPath, mParameters) {
	this.sBindingPath = sPath;
	this.mBindingParameters = mParameters;
	this.updateBindingContext();
	return this;
};

/**
 * Deprecated, please use bindElement instead.
 * @deprecated
 * @param {string} sPath the binding path
 * @return {sap.ui.core.Element} reference to the instance itself
 * @public
 */
sap.ui.core.Element.prototype.bindContext = function(sPath) {
	this.bindElement(sPath);
	return this;
};

/**
 * Removes the defined binding context of this element, all bindings will now resolve
 * relative to the parent context again.
 *
 * @return {sap.ui.core.Element} reference to the instance itself
 * @public
 */
sap.ui.core.Element.prototype.unbindContext = function() {
	this.sBindingPath = null;
	this.oBindingContext = null;
	this.updateBindingContext();
	return this;
};


/**
 * Bind a property to the model.
 * The Setter for the given property will be called with the value retrieved
 * from the data model.
 * This is a generic method which can be used to bind any property to the
 * model. A control may flag properties in the metamodel with
 * bindable="bindable" to get typed bind methods for a property.
 *
 * @param {string} sName the name of the property
 * @param {object} oBindingInfo the binding information
 * @param {string} oBindingInfo.path the binding path
 * @param {string} [oBindingInfo.model] the model identifier
 * @param {function} [oBindingInfo.formatter] the formatter function or sap.ui.model.Type
 * @param {sap.ui.model.Type} [oBindingInfo.type] the sap.ui.model.Type for this binding
 * @param {sap.ui.model.BindingMode} [oBindingInfo.mode=Default] the binding mode to be used for this property binding (e.g. one way)
 * @param {object} [oBindingInfo.parameters] a map of parameters which is passed to the binding
 *
 * @return {sap.ui.core.Element} reference to the instance itself
 * @public
 */
sap.ui.core.Element.prototype.bindProperty = function(sName, oBindingInfo) {
	var sPath,
		oFormat,
		sMode,
		sModelName,
		iSeparatorPos,
		fnFormatter,
		oType,
		iSeparatorPos;
		
	// old API compatbility (sName, sPath, oFormat, sMode)
	if (typeof oBindingInfo == "string") {
		sPath = arguments[1];
		oFormat = arguments[2];
		sMode = arguments[3];
		// if a model separator is found in the path, extract model name and path
		if (iSeparatorPos > 0) {
			sModelName = sPath.substr(0, iSeparatorPos);
			sPath = sPath.substr(iSeparatorPos + 1);
		}
		// find out whether formatter or type has been provided
		if (typeof oFormat == "function") {
			fnFormatter = oFormat;
		}
		else if (oFormat instanceof sap.ui.model.SimpleType) {
			oType = oFormat;
		}
		oBindingInfo = {path: sPath, formatter: fnFormatter, type: oType, model: sModelName, mode: sMode};
	}

	// if a model separator is found in the path, extract model name and path
	iSeparatorPos = oBindingInfo.path.indexOf(">");
	if (iSeparatorPos > 0) {
		oBindingInfo.model = oBindingInfo.path.substr(0, iSeparatorPos);
		oBindingInfo.path = oBindingInfo.path.substr(iSeparatorPos + 1);
	}
	// if property is already bound, unbind it first
	if (this.isBound(sName)){
		this.unbindProperty(sName);
	}
	// store binding info to create the binding, as soon as the model is available, or when the model is changed
	this.mBindingInfos[sName] = oBindingInfo;

	// if the model is already available, create the binding
	if (this.getModel(oBindingInfo.model)) {
		this._bindProperty(sName, oBindingInfo);
	}
	return this;
};

sap.ui.core.Element.prototype._bindProperty = function(sName, oBindingInfo) {
	var oModel = this.getModel(oBindingInfo.model),
		oContext,
		oBinding,
		oPropertyInfo = this.getMetadata().getJSONKeys()[sName], // TODO fix handling of hidden entitites?
		fnFormatter = oBindingInfo.formatter,
		oType = oBindingInfo.type,
		sInternalType = oPropertyInfo.type,
		that = this,
		fModelChangeHandler = function() {
			var oValue = oBinding.getValue();
			if (fnFormatter) {
				oValue = fnFormatter.apply(that, [oValue]);
			}
			if (oType) {
				try {
					oValue = oType.formatValue(oValue, sInternalType);
					oBindingInfo.skipModelUpdate = true;
					that[oPropertyInfo._sMutator](oValue);
					oBindingInfo.skipModelUpdate = false;
				}catch (oException) {
					if (oException instanceof sap.ui.model.FormatException) {
						sap.ui.getCore().fireFormatError({element : that, property : sName, type : oType, newValue : oValue, oldValue : that.getProperty(sName), exception: oException});
					}else {
						throw oException;
					}
				}
			}else {
				oBindingInfo.skipModelUpdate = true;
				that[oPropertyInfo._sMutator](oValue);
				oBindingInfo.skipModelUpdate = false;
			}
		};

	// Only use context for bindings on the primary model
	oContext = oBindingInfo.model ? null : this.getBindingContext();

	// Create binding object
	oBinding = oModel.bindProperty(oBindingInfo.path, oContext, oBindingInfo.parameters);

	// Set additional information on the binding info
	oBindingInfo.skipModelUpdate = false;
	oBindingInfo.binding = oBinding;
	oBindingInfo.modelChangeHandler = fModelChangeHandler;

	if (!oBindingInfo.mode || !oModel.isBindingModeSupported(oBindingInfo.mode)) {
		oBindingInfo.mode = oModel.getDefaultBindingMode();
	}

	// Attach to the change event of the binding and initialize value
	if (oBindingInfo.mode != sap.ui.model.BindingMode.OneTime) {
		oBinding.attachChange(fModelChangeHandler);
	}
	fModelChangeHandler();
};

/**
 * Unbind the property from the model
 *
 * @param {String} sName the name of the property
 * @return {sap.ui.core.Element} reference to the instance itself
 * @public
 */
sap.ui.core.Element.prototype.unbindProperty = function(sName){
	var oBindingInfo = this.mBindingInfos[sName];
	if(oBindingInfo) {
		if (oBindingInfo.binding) {
			oBindingInfo.binding.detachChange(oBindingInfo.modelChangeHandler);
		}
		delete this.mBindingInfos[sName];
	}
	return this;
};

/**
 * Update the property in the model if two way data binding mode is enabled
 *
 * @param sName the name of the property to update
 * @param oValue the new value to set for the property in the model
 * @private
 */
sap.ui.core.Element.prototype.updateModelProperty = function(sName, oValue, oOldValue){
	if (this.isBound(sName)){
		var oBindingInfo = this.mBindingInfos[sName],
			oBinding = oBindingInfo.binding,
			oPropertyInfo = this.getMetadata().getJSONKeys()[sName], // TODO fix handling of hidden entitites?
			oType = oBindingInfo.type,
			sInternalType = oPropertyInfo.type;
		if (oBindingInfo.mode == sap.ui.model.BindingMode.TwoWay
				&& oBinding
				&& !oBindingInfo.skipModelUpdate
				&& !oBindingInfo.formatter) {
			if (oType) {
				try {
					oValue = oType.parseValue(oValue, sInternalType);
					oType.validateValue(oValue);
					oBindingInfo.binding.setValue(oValue);
					sap.ui.getCore().fireValidationSuccess({element : this, property : sName, type : oType, newValue : oValue, oldValue : oOldValue});
				}
				catch (oException) {
					if (oException instanceof sap.ui.model.ParseException) {
						sap.ui.getCore().fireParseError({element : this, property : sName, type : oType, newValue : oValue, oldValue : oOldValue, exception: oException});
					}else if (oException instanceof sap.ui.model.ValidateException) {
						sap.ui.getCore().fireValidationError({element : this, property : sName, type : oType, newValue : oValue, oldValue : oOldValue, exception: oException});
					}
					else {
						throw oException;
					}
				}
			}else {
				oBindingInfo.binding.setValue(oValue);
			}
		}
	}
};

/**
 * Bind an aggregation to the model.
 * The bound aggregation will use the given template, clone it for each element
 * which exists in the bound list and set the appropriate binding context.
 * This is a generic method which can be used to bind any aggregation to the
 * model. A control may flag aggregations in the metamodel with
 * bindable="bindable" to get typed bind methods for an aggregation.
 *
 * @param {string} sName the aggregation to bind
 * @param {object} oBindingInfo the binding info
 * @param {string} oBindingInfo.path the binding path
 * @param {sap.ui.core.Element} oBindingInfo.template the template
 * @param {function} oBindingInfo.factory the factory function
 * @param {sap.ui.model.Sorter} [oBindingInfo.oSorter] the initial sort order (optional)
 * @param {array} [oBindingInfo.filters] the predefined filters (sap.ui.model.Filter) for this aggregation (optional)
 * @param {object} [oBindingInfo.parameters] a map of parameters which is passed to the binding
 *
 * @return {sap.ui.core.Element} reference to the instance itself
 * @public
 */
sap.ui.core.Element.prototype.bindAggregation = function(sName, oBindingInfo) {
	var sPath,
		oTemplate,
		oSorter,
		aFilters;
	
	// Old API compatibility (sName, sPath, oTemplate, oSorter, aFilters)
	if (typeof oBindingInfo == "string") {
		sPath = arguments[1];
		oTemplate = arguments[2];
		oSorter = arguments[3];
		aFilters = arguments[4];
		oBindingInfo = {path: sPath, sorter: oSorter, filters: aFilters};
		// allow either to pass the template or the factory function as 3rd parameter
		if (oTemplate instanceof sap.ui.core.Element) {
			oBindingInfo.template = oTemplate;
		} else if (typeof oTemplate === "function") {
			oBindingInfo.factory = oTemplate;
		}
	}
	
	// if aggregation is already bound, unbind it first
	if (this.isBound(sName)){
		this.unbindAggregation(sName);
	}
	
	// check whether a template has been provided, which is required for proper processing of the binding
	if (!(oBindingInfo.template || oBindingInfo.factory)) {
		throw new Error("Missing template or factory function for aggregation " + sName + " of control id " + this.getId() + " !");
	}
	
	// if we have a template we will create a factory function
	if (oBindingInfo.template) {
		oBindingInfo.factory = function(sId) {
			return oBindingInfo.template.clone(sId);
		} 
	}
	
	// store binding info to create the binding, as soon as the model is available, or when the model is changed
	this.mBindingInfos[sName] = oBindingInfo;

	// if the model is already available create the binding
	if (this.getModel()) {
		this._bindAggregation(sName, oBindingInfo);
	}
	return this;
};

sap.ui.core.Element.prototype._bindAggregation = function(sName, oBindingInfo) {
	var that = this,
		oBinding,
		fModelChangeHandler = function(oEvent){
			var sUpdater = "update" + sName.substr(0,1).toUpperCase() + sName.substr(1);
			if (that[sUpdater]) {
				that[sUpdater]();
			} else {
				that.updateAggregation(sName);
			}
		};
		if (this.isTreeBinding(sName)) {
			oBinding = this.getModel().bindTree(oBindingInfo.path, this.getBindingContext(), oBindingInfo.filters, oBindingInfo.parameters);		
		} else {
			oBinding = this.getModel().bindList(oBindingInfo.path, this.getBindingContext(), oBindingInfo.sorter, oBindingInfo.filters, oBindingInfo.parameters);
		}
		
	oBindingInfo.binding = oBinding;
	oBindingInfo.modelChangeHandler = fModelChangeHandler;

	oBinding.attachChange(fModelChangeHandler);
	fModelChangeHandler();
};

/**
 * Unbind the aggregation from the model
 *
 * @param {String} sName the name of the aggregation
 * @return {sap.ui.core.Element} reference to the instance itself
 * @public
 */
sap.ui.core.Element.prototype.unbindAggregation = function(sName){
	var oBindingInfo = this.mBindingInfos[sName];
	if(oBindingInfo) {
		if (oBindingInfo.binding) {
			oBindingInfo.binding.detachChange(oBindingInfo.modelChangeHandler);
		}
		delete this.mBindingInfos[sName];
	}
	return this;
};

/**
 *  This method is used internally and should only be overridden by a tree control which utilizes the tree binding.
 *  In this case and if the aggregation is a tree node the overridden method should then return true.
 *  If true is returned the tree binding will be used instead of the list binding.
 *
 *  @param {string} sName the aggregation to bind (e.g. nodes for a tree control)
 *  @return {boolean} whether tree binding should be used or list binding. Default is false. Override method to change this behavior.
 *
 *  @protected
 */
sap.ui.core.Element.prototype.isTreeBinding = function(sName) {
	return false;
};

/**
 * Create bindings in case the model was not available at the time
 * bindProperty or bindAggregation was called
 *
 * @private
 */
sap.ui.core.Element.prototype.updateBindings = function(bUpdateAll, sModelName, bRecreate) {
	var that = this;

	// create property and aggregation bindings if they don't exist yet
	jQuery.each(this.mBindingInfos, function(sName, oBindingInfo) {
		if (that.getModel(oBindingInfo.model) && (bUpdateAll || (oBindingInfo.model == sModelName && (!oBindingInfo.binding || oBindingInfo.binding.getModel() !== that.getModel(sModelName))))) {
			if ( bRecreate && oBindingInfo.binding ) {
				oBindingInfo.binding.detachChange(oBindingInfo.modelChangeHandler);
				delete oBindingInfo.binding;
			}
			if (!oBindingInfo.binding) {
				if (oBindingInfo.factory) {
					that._bindAggregation(sName, oBindingInfo);
				} else {
					that._bindProperty(sName, oBindingInfo);
				}
			}
		}
	});
	// also update bindings in all child elements
	jQuery.each(this.mAggregations, function(sName, oAggregation) {
		if (oAggregation instanceof sap.ui.core.Element) {
			oAggregation.updateBindings(bUpdateAll, sModelName, bRecreate);
		} else if (oAggregation instanceof Array) {
			for (var i = 0; i < oAggregation.length; i++) {
				oAggregation[i].updateBindings(bUpdateAll, sModelName, bRecreate);
			}
		}
	});

};

/**
 * Generic method which is called, whenever an aggregation binding is changed.
 * This method deletes all elements in this aggregation and recreates them
 * according to the data model.
 * In case a control needs special handling for a aggregation binding, it can create
 * a typed update-method (e.g. "updateRows") which will be used instead of the
 * default behaviour.
 *
 * @private
 */
sap.ui.core.Element.prototype.updateAggregation = function(sName) {
	var oBindingInfo = this.mBindingInfos[sName],
		oBinding = oBindingInfo.binding,
		fnFactory = oBindingInfo.factory,
		oAggregationInfo = this.getMetadata().getJSONKeys()[sName],  // TODO fix handling of hidden aggregations
		oClone,
		that = this;
	this[oAggregationInfo._sDestructor]();
	if (this.isTreeBinding(sName)) {
		var iNodeIndex = 0,
			update = function(aContexts, fnFactory, oBinding, oParent){
			jQuery.each(aContexts, function(iIndex, oContext) {
				var sId = that.getId() + "-" + iNodeIndex++;
				oClone = fnFactory(sId, oContext);
				oClone.setBindingContext(oContext);
				oParent[oAggregationInfo._sMutator](oClone); // also sets the Parent
				update(oBinding.getNodeContexts(oContext), fnFactory, oBinding, oClone);
			});
		};
		update(oBinding.getRootContexts(), fnFactory, oBinding, this);
	} 
	else {
		jQuery.each(oBinding.getContexts(), function(iIndex, oContext) {
			var sId = that.getId() + "-" + iIndex;
			oClone = fnFactory(sId, oContext);
			oClone.setBindingContext(oContext);
			that[oAggregationInfo._sMutator](oClone);
		});
	}
};

/**
 * Find out whether a property or aggregation is bound
 *
 * @param {String} sName the name of the property or aggregation
 * @return {boolean} whether a binding exists for the given name
 * @public
 */
sap.ui.core.Element.prototype.isBound = function(sName){
	return (sName in this.mBindingInfos);
};

/**
 * Get the binding object for a specific aggregation/property
 *
 * @param {String} sName the name of the property or aggregation
 * @return {Binding} the binding for the given name
 * @public
 */
sap.ui.core.Element.prototype.getBinding = function(sName){
	return this.mBindingInfos[sName] && this.mBindingInfos[sName].binding;
};

/**
 * Get the binding path for a specific aggregation/property
 *
 * @param {String} sName the name of the property or aggregation
 * @return {String} the binding path for the given name
 * @protected
 */
sap.ui.core.Element.prototype.getBindingPath = function(sName){
	return this.mBindingInfos[sName] && this.mBindingInfos[sName].path;
};

/**
 * Set the binding context for this element.
 *
 * @param {Object} oContext the new binding context for this element
 *
 * @return {sap.ui.core.Element} reference to the instance itself
 * @public
 */
sap.ui.core.Element.prototype.setBindingContext = function(oContext){
	this.oBindingContext = oContext;
	this.updateBindingContext();
	return this;
};

/**
 * Update the binding context in this element and all children
 * @private
 */
sap.ui.core.Element.prototype.updateBindingContext = function(bSkipLocal){

	var oModel = this.getModel(),
		oParentContext,
		that = this;

	if (this.sBindingPath && !bSkipLocal) {
		if (this.oParent && oModel == this.oParent.getModel()) {
			oParentContext= this.oParent.getBindingContext(); 
		}
		if (oModel) {
			oModel.createBindingContext(this.sBindingPath, oParentContext, this.mBindingParameters, function(oContext) {
				that.oBindingContext = oContext;
				that.updateBindingContext(true);
			});
		} else {
			this.oBindingContext = undefined;
		}
		return;
	}

	var oContext = this.getBindingContext();

	// update context in existing bindings, but only for the primary model
	jQuery.each(this.mBindingInfos, function(sName, oBindingInfo) {
		var oBinding = oBindingInfo.binding;
		if (oBinding && oBinding.getModel() == oModel) {
			oBinding.setContext(oContext);
		}
	});

	// also update context in all child elements
	jQuery.each(this.mAggregations, function(sName, oAggregation) {
		if (oAggregation instanceof sap.ui.core.Element) {
			oAggregation.updateBindingContext();
		} else if (oAggregation instanceof Array) {
			for (var i = 0; i < oAggregation.length; i++) {
				oAggregation[i].updateBindingContext();
			}
		}
	});

};


/**
 * Get the binding context of this element
 * If the element does not have a binding context set on itself and has no own Model set, it will ask
 * the parent element for its binding context
 *
 * @return {Object} the binding context of this element
 * @public
 */
sap.ui.core.Element.prototype.getBindingContext = function(){
	var oModel = this.getModel();
	
	if (this.oBindingContext) {
		return this.oBindingContext;
	} else if (oModel && this.oParent && oModel != this.oParent.getModel()) {
		return undefined;
	} else { 
		return this.oParent && this.oParent.getBindingContext();
	}
};

/**
 * Set the model for databinding
 * @param {sap.ui.model.Model} oModel
 * @param {string} [sName]
 * @return {sap.ui.core.Element} <code>this</code> to allow method chaining
 * @public
 */
sap.ui.core.Element.prototype.setModel = function(oModel, sName) {
	if ( oModel !== this.oModels[sName] ) { 
		this.oModels[sName] = oModel;
		// update binding context, for primary model only
		if (!sName){this.updateBindingContext();}
		// if the model changes, all bindings have to be recreated (at least those to the previous model)
		this.updateBindings(false, sName, true);
	}
	return this;
};

/**
 * Get the model for databinding
 * If the element does not have a model set on itself, it will ask
 * the parent element for the model to use
 * @param {string} [sName]
 * @return {sap.ui.model.Model} oModel
 * @public
 */
sap.ui.core.Element.prototype.getModel = function(sName) {
	return this.oModels[sName] || (this.oParent && this.oParent.getModel(sName));
};

/**
 * Check if a Model is set to the Element or to one of its Parents (including UIArea and Core)
 * @return {boolean} true or false
 * @public
 */
sap.ui.core.Element.prototype.hasModel = function() {
	if (!jQuery.isEmptyObject(this.oModels) || (this.oParent && this.oParent.hasModel())) {
		return true;
	} else {
		return false;
	}
};

/**
 * Clones a tree of elements starting with the element on which clone is called first (root element).
 * 
 * The ids within the newly created clone tree are derived from the original ids by appending
 * the given <code>sIdSuffix</code> (if no suffix is given, one will be created; it will be 
 * unique across multiple clone calls).
 *  
 * For each cloned element the following settings are cloned based on the metadata of the element:
 * <ul>
 * <li>all properties; the values are used by reference, they are not cloned
 * <li>all aggregated controls; they are all cloned recursively using the same <code>sIdSuffix</code>
 * <li>all associated controls; when an association points to a control inside the cloned element tree,
 *     then the cloned association will be modified to that it points to the clone of the target element.
 *     When the association points to a control outside of the cloned element tree, then its 
 *     target won't be changed.</li>  
 * <li>all models set via setModel(); used by reference </li>
 * <li>all property and aggregation bindings; the pure binding infos (path, model name) are 
 *     cloned, but all other information like template control or factory function, 
 *     data type or formatter function are copied by reference. The bindings themselves 
 *     are created anew as they are specific for the combination (element, property, model).
 *     As a result, any later changes to a binding of the original element are not reflected 
 *     in the clone, but changes to e.g the type or template etc. are.</li> 
 * </ul>
 *
 * Each clone is created by first collecting the above mentioned settings and then creating 
 * a new instance with the normal constructor function. As a result, any side effects of 
 * mutator methods (setProperty etc.) or init hooks are repeated during clone creation. 
 * There is no need to override <code>clone()</code> just to reproduce these internal settings!
 * 
 * Custom controls however can override <code>clone()</code> to implement additional clone steps. 
 * They usually will first call <code>clone()</code> on the super class and then modify the   
 * returned clone accordingly.  
 * 
 * Applications <b>must never provide</b> the second parameter <code>aLocaleIds</code>. 
 * It is determined automatically for the root element (and its non-existance also serves as 
 * an indicator for the root element). Specifying it will break the implementation of <code>clone()</code>. 
 * 
 * @param {String} [sIdSuffix] a suffix to be appended to the cloned element id
 * @param {Array} [aLocalIds] an array of local IDs within the cloned hierarchy (internally used)
 * @return {sap.ui.core.Element} reference to the newly created clone
 * @protected
 */
sap.ui.core.Element.prototype.clone = function(sIdSuffix, aLocalIds){
	// if no id suffix has been provided use a generated UID
	if (!sIdSuffix) {
		sIdSuffix = sap.ui.core.ElementMetadata.uid("clone") || jQuery.sap.uid();
	}
	// if no local ID array has been passed, collect IDs of all contained elements to
	// be able to properly adapt associations, which are within the cloned element hierarchy
	if (!aLocalIds) {
		aLocalIds = jQuery.map(this.findElements(true), function(oElement) {return oElement.getId();});
	}

	var oMetadata = this.getMetadata(),
		oClass = oMetadata._oClass,
		sId = this.getId() + "-" + sIdSuffix,
		mSettings = {},
		mProps = this.mProperties,
		sKey,
		oClone;

	// Clone properties (only those with non-default value)
	for(sKey in mProps) {
		if ( mProps.hasOwnProperty(sKey) ) {
			mSettings[sKey] = mProps[sKey];
		}
	}
	
	// Clone aggregations
	jQuery.each(this.mAggregations, function(sName, oAggregation) {
		if (oMetadata.hasAggregation(sName)) {
			if (oAggregation instanceof sap.ui.core.Element) {
				mSettings[sName] = oAggregation.clone(sIdSuffix, aLocalIds);
			} else if (jQuery.isArray(oAggregation)) {
				mSettings[sName] = [];
				for (var i = 0; i < oAggregation.length; i++) {
					mSettings[sName].push(oAggregation[i].clone(sIdSuffix, aLocalIds));
				}
			} else {
				// must be an alt type
				mSettings[sName] = oAggregation;
			}
		}
	});

	// Clone associations
	jQuery.each(this.mAssociations, function(sName, oAssociation) {
		// Check every associated ID against the ID array, to make sure associations within
		// the template are properly converted to associations within the clone
		if (jQuery.isArray(oAssociation)) {
			oAssociation = oAssociation.slice(0);
			for (var i = 0; i < oAssociation.length; i++) {
				if (jQuery.inArray(oAssociation[i], aLocalIds) >= 0) {
					oAssociation[i] += "-" + sIdSuffix;
				}
			}
		} else if (jQuery.inArray(oAssociation, aLocalIds) >= 0) {
			oAssociation += "-" + sIdSuffix;
		}
		mSettings[sName] = oAssociation;
	});

	// Create clone instance
	oClone = new oClass(sId, mSettings);

	// Clone events
	jQuery.each(this.mEventRegistry, function(sName, aListeners) {
		oClone.mEventRegistry[sName] = aListeners.slice();
	});

	// Clone models
	jQuery.each(this.oModels, function(sName, oModel) {
		oClone.setModel(oModel, sName);
	});

	// Clone bindings
	jQuery.each(this.mBindingInfos, function(sName, oBindingInfo) {
		var oCloneBindingInfo = jQuery.extend({}, oBindingInfo);
		delete oCloneBindingInfo.binding; // remove the runtime binding info (otherwise the property will not be connected again!)
		if (oBindingInfo.factory) {
			oClone.bindAggregation(sName, oCloneBindingInfo);
		} else {
			oClone.bindProperty(sName, oCloneBindingInfo);
		}
	});

	return oClone;
};

/**
 * Maps the given aggregation with name <code>sOldAggrName</code>
 * on aggregation <code>sNewAggrName</code> (When calling an accessor function
 * of the old aggregation the call is forwarded to the corresponding accessor
 * function of the new aggregation).
 *
 * This function should help to perform a smooth transition for users of a control
 * when an aggregation must be renamed.
 *
 * Both aggregations must have a mutiple cardinality (0..n) and must have the same
 * aggregated type!
 *
 * @param {object}
 *			oPrototype Control/Element prototype for which a mapping should be defined
 * @param {string}
 *			sOldAggrName Name of the old deprecated aggregation
 * @param {string}
 *			sNewAggrName Name of the new aggregation
 * @deprecated
 */
sap.ui.core.Element._mapAggregation = function(oPrototype, sOldAggrName, sNewAggrName){
	var mKeys = oPrototype.getMetadata().getJSONKeys(); // TODO fix handling of hidden entitites?
	var oOldAggrInfo = mKeys[sOldAggrName];
	var oNewAggrInfo = mKeys[sNewAggrName];

	//Check whether aggregations exist and are multiple.
	if(!oOldAggrInfo || !oNewAggrInfo || oOldAggrInfo._iKind != 2 || oNewAggrInfo._iKind != 2) {
		return;
	}

	var mFunc = {"insert" : true, "add" : true, "remove" : true, "removeAll" : false, "indexOf" : true, "destroy" : false, "get" : false};

	function method(sPrefix, sName) {
		return sPrefix + sName.substring(0,1).toUpperCase() + sName.substring(1);
	}

	function fAggrDelegator(sFuncName){
		return function() {
			return this[sFuncName].apply(this, arguments);
		};
	}

	for(var sPrefix in mFunc){
		var sOldFuncName = method(sPrefix, mFunc[sPrefix] ? oOldAggrInfo.singularName : oOldAggrInfo._sName);
		var sNewFuncName = method(sPrefix, mFunc[sPrefix] ? oNewAggrInfo.singularName : oNewAggrInfo._sName);
		oPrototype[sOldFuncName] = fAggrDelegator(sNewFuncName);
	}
};

/**
 * Searches and returns an array of child elements and controls which are
 * referenced within an aggregation or aggregations of child elements/controls.
 * This can be either done recursive or not.
 * <br>
 * <b>Take care: this operation might be expensive.</b>
 * @param {boolean}
 *          bRecursive true, if all nested children should be returned.
 * @return {sap.ui.core.Element[]} array of child elements and controls
 * @public
 */
sap.ui.core.Element.prototype.findElements = function(bRecursive) {

	var aControls = [];
	function fFindElements(oControl) {
		for (var n in oControl.mAggregations) {
			var a = oControl.mAggregations[n];
			if (jQuery.isArray(a)) {
				for (var i = 0; i < a.length; i++) {
					aControls.push(a[i]);
					if (bRecursive) {
						fFindElements(a[i]);
					}
				}
			} else if (a instanceof sap.ui.core.Element) {
				aControls.push(a);
				if (bRecursive) {
					fFindElements(a);
				}
			}
		}
	}
	fFindElements(this);
	return aControls;

};
