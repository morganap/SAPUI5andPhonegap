/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.model.SimpleType");jQuery.sap.require("sap.ui.model.Type");jQuery.sap.require("sap.ui.model.ParseException");jQuery.sap.require("sap.ui.model.ValidateException");jQuery.sap.require("sap.ui.model.FormatException");
sap.ui.model.SimpleType=function(f,c){sap.ui.model.Type.apply(this,arguments);this.setFormatOptions(f||{});this.setConstraints(c||{});this.sName="SimpleType"};
sap.ui.model.SimpleType.prototype=jQuery.sap.newObject(sap.ui.model.Type.prototype);sap.ui.base.Object.defineClass("sap.ui.model.SimpleType",{baseType:"sap.ui.model.Type",publicMethods:["setConstraints","setFormatOptions","formatValue","parseValue","validateValue"]});
sap.ui.model.SimpleType.prototype.setConstraints=function(c){this.oConstraints=c};
sap.ui.model.SimpleType.prototype.setFormatOptions=function(f){this.oFormatOptions=f};
