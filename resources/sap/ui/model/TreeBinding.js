/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.model.TreeBinding");jQuery.sap.require("sap.ui.model.Binding");
sap.ui.model.TreeBinding=function(m,p,c,f,P){sap.ui.model.Binding.call(this,m,p,c,P);this.aFilters=f};
sap.ui.model.TreeBinding.prototype=jQuery.sap.newObject(sap.ui.model.Binding.prototype);sap.ui.base.Object.defineClass("sap.ui.model.TreeBinding",{baseType:"sap.ui.model.Binding",publicMethods:["getRootContexts","getNodeContexts","filter"]});
sap.ui.model.TreeBinding.prototype.attachFilter=function(f,l){this.attachEvent("_filter",f,l)};
sap.ui.model.TreeBinding.prototype.detachFilter=function(f,l){this.detachEvent("_filter",f,l)};
sap.ui.model.TreeBinding.prototype._fireFilter=function(a){this.fireEvent("_filter",a)};
