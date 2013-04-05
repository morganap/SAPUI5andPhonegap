/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.model.odata.Filter");jQuery.sap.require("sap.ui.model.FilterOperator");
sap.ui.model.odata.Filter=function(p,v,a){this.sPath=p;this.aValues=v;this.bAND=a==undefined?true:a};
sap.ui.model.odata.Filter.prototype=jQuery.sap.newObject(sap.ui.base.Object.prototype);
