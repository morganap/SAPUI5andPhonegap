/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.model.Filter");jQuery.sap.require("sap.ui.model.FilterOperator");
sap.ui.model.Filter=function(p,o,v,V){this.sPath=p;this.sOperator=o;this.oValue1=v;this.oValue2=V};
sap.ui.model.Filter.prototype=jQuery.sap.newObject(sap.ui.base.Object.prototype);
