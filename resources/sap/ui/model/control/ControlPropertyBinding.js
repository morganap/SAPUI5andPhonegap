/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.model.control.ControlPropertyBinding");jQuery.sap.require("sap.ui.model.PropertyBinding");
sap.ui.model.control.ControlPropertyBinding=function(m,p,c){sap.ui.model.PropertyBinding.apply(this,arguments);this.oValue=this._getValue()};
sap.ui.model.control.ControlPropertyBinding.prototype=jQuery.sap.newObject(sap.ui.model.PropertyBinding.prototype);sap.ui.base.Object.defineClass("sap.ui.model.control.ControlPropertyBinding",{baseType:"sap.ui.model.PropertyBinding",publicMethods:[]});
sap.ui.model.control.ControlPropertyBinding.prototype.getValue=function(){return this.oValue};
sap.ui.model.control.ControlPropertyBinding.prototype._getValue=function(){return this.oContext.getProperty(this.sPath)};
sap.ui.model.control.ControlPropertyBinding.prototype.setContext=function(c){this.oContext=c;this.checkUpdate()};
sap.ui.model.control.ControlPropertyBinding.prototype.checkUpdate=function(){var v=this._getValue();if(v!==this.oValue){this.oValue=v;this._fireChange()}};
