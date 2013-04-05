/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.model.type.DateTime");jQuery.sap.require("sap.ui.model.type.Date");
sap.ui.model.type.DateTime=function(){sap.ui.model.type.Date.apply(this,arguments);this.sName="DateTime"};
sap.ui.model.type.DateTime.prototype=jQuery.sap.newObject(sap.ui.model.type.Date.prototype);sap.ui.base.Object.defineClass("sap.ui.model.type.DateTime",{baseType:"sap.ui.model.type.Date",publicMethods:[]});
sap.ui.model.type.DateTime.prototype.setFormatOptions=function(f){this.oFormatOptions=f;this.oOutputFormat=sap.ui.core.format.DateFormat.getDateTimeInstance(this.oFormatOptions);if(this.oFormatOptions.source){this.oInputFormat=sap.ui.core.format.DateFormat.getDateTimeInstance(this.oFormatOptions.source)}};
