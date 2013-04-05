/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.model.PropertyBinding");jQuery.sap.require("sap.ui.model.Binding");
sap.ui.model.PropertyBinding=function(m,p,c,P){sap.ui.model.Binding.apply(this,arguments)};
sap.ui.model.PropertyBinding.prototype=jQuery.sap.newObject(sap.ui.model.Binding.prototype);sap.ui.base.Object.defineClass("sap.ui.model.PropertyBinding",{baseType:"sap.ui.model.Binding",publicMethods:["getValue","setValue"]});
