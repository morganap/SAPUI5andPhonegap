/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.model.Type");jQuery.sap.require("sap.ui.base.Object");
sap.ui.model.Type=function(){sap.ui.base.Object.apply(this,arguments);this.sName="Type"};
sap.ui.model.Type.prototype=jQuery.sap.newObject(sap.ui.base.Object.prototype);sap.ui.base.Object.defineClass("sap.ui.model.Type",{baseType:"sap.ui.base.Object",publicMethods:["getName"]});
sap.ui.model.Type.prototype.getName=function(){return this.sName};
