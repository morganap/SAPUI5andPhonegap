/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.require("sap.ui.core.Core");jQuery.sap.declare("sap.ui.core.AppCacheBuster",false);(function(){this.oConfiguration=sap.ui.getCore().getConfiguration();if(this.oConfiguration.getAppCacheBuster()){var u="sap-ui-cachebuster-info.json?sap-ui-language="+this.oConfiguration.getLanguage();var r=jQuery.sap.sjax({url:u,dataType:"json"});this.mIndex=r&&r.data||{};var g=function(){return this.mIndex};var a=jQuery.ajax;jQuery.ajax=function ajax(b,o){var i=g();if(i){var u=b.url;if(u&&u.slice(0,2)==="./"){u=u.slice(2)}var t=i[u];if(t){b.url="~"+t+"~/"+u}}return a.apply(this,arguments)}}}());
