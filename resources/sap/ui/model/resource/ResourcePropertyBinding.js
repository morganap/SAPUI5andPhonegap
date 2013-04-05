/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.model.resource.ResourcePropertyBinding");jQuery.sap.require("sap.ui.model.PropertyBinding");
sap.ui.model.resource.ResourcePropertyBinding=function(m,p){sap.ui.model.PropertyBinding.apply(this,arguments);this.oValue=this.oModel.getProperty(p)};
sap.ui.model.resource.ResourcePropertyBinding.prototype=jQuery.sap.newObject(sap.ui.model.PropertyBinding.prototype);sap.ui.base.Object.defineClass("sap.ui.model.resource.ResourcePropertyBinding",{baseType:"sap.ui.model.PropertyBinding",publicMethods:[]});
sap.ui.model.resource.ResourcePropertyBinding.prototype.getValue=function(){return this.oValue};
