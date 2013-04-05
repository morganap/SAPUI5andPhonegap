/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.m.SliderRenderer");sap.m.SliderRenderer={};
sap.m.SliderRenderer.render=function(r,s){var m=s.getMin(),M=s.getMax(),S=s.getStep(),n=s.getName(),e=s.getEnabled();if(!s.getVisible()){return}r.write("<div");r.addClass("sapMSldCont");r.addStyle("width",s.getWidth());r.writeClasses();r.writeStyles();r.writeControlData(s);r.write(">");r.write('<input type="range"');if(!e){r.write("disabled")}if(n!==""){r.writeAttributeEscaped("name",n)}r.writeAttribute("min",m);r.writeAttribute("max",M);r.writeAttribute("step",S);r.writeAttribute("value",s.getValue());r.write("/>");r.writeClasses();r.write('<div');r.addClass("sapMSld");if(s.getProgress()){r.addClass("sapMSldProgress");r.addStyle("-webkit-background-size",s.iProgressValue+s._sBackgroundSizeRemainder)}if(!e){r.addClass("sapMSldDisabled")}r.writeClasses();r.writeStyles();r.write(">");r.write('<span class="sapMSldThumb"');r.addStyle("left",s.iProgressValue+"%");r.writeStyles();r.write('><span></span></span>');r.write("</div>");r.write("</div>")};
