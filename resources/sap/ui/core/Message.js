/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.core.Message");jQuery.sap.require("sap.ui.core.library");jQuery.sap.require("sap.ui.core.Element");sap.ui.core.Element.extend("sap.ui.core.Message",{metadata:{publicMethods:["getDefaultIcon"],library:"sap.ui.core",properties:{"text":{type:"string",group:"Misc",defaultValue:null},"timestamp":{type:"string",group:"Misc",defaultValue:null},"icon":{type:"sap.ui.core.URI",group:"Misc",defaultValue:null},"level":{type:"sap.ui.core.MessageType",group:"Misc",defaultValue:sap.ui.core.MessageType.None}}}});jQuery.sap.require("sap.ui.core.theming.Parameters");
sap.ui.core.Message.prototype.getDefaultIcon=function(s){var m=jQuery.sap.getModulePath("sap.ui.core",'/');var t="themes/"+sap.ui.getCore().getConfiguration().getTheme();var i="/img/message/";if(s&&s=="32x32"){i+="32x32/"}else{i+="16x16/"}var u="";switch(this.getProperty("level")){case sap.ui.core.MessageType.Error:u=m+t+i+"Message_Icon_Error.png";break;case sap.ui.core.MessageType.Information:u=m+t+i+"Message_Icon_Information.png";break;case sap.ui.core.MessageType.Warning:u=m+t+i+"Message_Icon_Warning.png";break;case sap.ui.core.MessageType.Success:u=m+t+i+"Message_Icon_Success.png";break;case sap.ui.core.MessageType.None:default:u=this.getProperty("icon");break}return u};
