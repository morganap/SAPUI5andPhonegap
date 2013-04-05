/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.model.Context");jQuery.sap.require("sap.ui.base.EventProvider");
sap.ui.model.Context=function(m,p){sap.ui.base.Object.apply(this);this.oModel=m;this.sPath=p};
sap.ui.model.Context.prototype=jQuery.sap.newObject(sap.ui.base.Object.prototype);sap.ui.base.Object.defineClass("sap.ui.model.Context",{baseType:"sap.ui.base.Object",publicMethods:["getModel","getPath","getProperty","getObject"]});
sap.ui.model.Context.prototype.getModel=function(){return this.oModel};
sap.ui.model.Context.prototype.getPath=function(){return this.sPath};
sap.ui.model.Context.prototype.getProperty=function(p){return this.oModel.getProperty(p,this)};
sap.ui.model.Context.prototype.getObject=function(){return this.oModel.getProperty(this.sPath)};
sap.ui.model.Context.prototype.toString=function(){return this.sPath};
