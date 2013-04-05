/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.m.SwitchRenderer");sap.m.SwitchRenderer={};
sap.m.SwitchRenderer.render=function(r,s){var S=s.getState(),a=(S)?s._sOn:s._sOff;if(!s.getVisible()){return}r.write('<div');r.writeControlData(s);r.addClass('sapMSwt');(S)?r.addClass('sapMSwtOn'):r.addClass('sapMSwtOff');if(!s.getEnabled()){r.addClass('sapMSwtDisabled')}r.writeClasses();r.write('>');if(jQuery.os.ios){r.write('<span class="sapMSwtTextOn">');r.write(s._sOn);r.write('</span>');r.write('<span class="sapMSwtTextOff">');r.write(s._sOff);r.write('</span>')}r.write('<input type="checkbox"');if(s.getName()!==""){r.writeAttributeEscaped("name",s.getName())}r.writeAttribute("id",s.getId()+"-input");if(S){r.writeAttribute('checked','checked')}if(!s.getEnabled()){r.writeAttribute('disabled','disabled')}r.writeAttribute('value',a);r.write('/>');r.write('<div class="sapMSwtBtn"');r.writeAttribute('data-sap-ui-swt',a);r.write('></div>');r.write("</div>")};
