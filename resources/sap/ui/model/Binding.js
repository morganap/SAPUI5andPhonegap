/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.model.Binding");jQuery.sap.require("sap.ui.base.EventProvider");
sap.ui.model.Binding=function(m,p,c,P){sap.ui.base.EventProvider.apply(this);this.sPath=p;this.oContext=c;this.oModel=m;this.mParameters=P};
sap.ui.model.Binding.prototype=jQuery.sap.newObject(sap.ui.base.EventProvider.prototype);sap.ui.base.Object.defineClass("sap.ui.model.Binding",{baseType:"sap.ui.base.Object",publicMethods:["getPath","getContext","getModel","attachChange","detachChange"]});
sap.ui.model.Binding.prototype.getPath=function(){return this.sPath};
sap.ui.model.Binding.prototype.getContext=function(){return this.oContext};
sap.ui.model.Binding.prototype.setContext=function(c){if(this.oContext!=c){this.oContext=c;this._fireChange()}};
sap.ui.model.Binding.prototype.getModel=function(){return this.oModel};
sap.ui.model.Binding.prototype.attachChange=function(f,l){if(!this.hasListeners("_change")){this.oModel.addBinding(this)}this.attachEvent("_change",f,l)};
sap.ui.model.Binding.prototype.detachChange=function(f,l){this.detachEvent("_change",f,l);if(!this.hasListeners("_change")){this.oModel.removeBinding(this)}};
sap.ui.model.Binding.prototype._fireChange=function(a){this.fireEvent("_change",a)};
