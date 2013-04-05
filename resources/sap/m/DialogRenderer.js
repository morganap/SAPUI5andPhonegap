/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.m.DialogRenderer");jQuery.sap.require("sap.m.BarRenderer");sap.m.DialogRenderer={};
sap.m.DialogRenderer.render=function(r,c){var C=sap.ui.getCore(),l=C.byId(c.getLeftButton()),R=C.byId(c.getRightButton());r.write("<div");r.writeControlData(c);r.addClass("sapMDialog");r.addClass("sapMDialog-CTX");if(jQuery.device.is.iphone){r.addClass("sapMDialogHidden sapMDialogIPhone")}r.writeClasses();r.write(">");if(jQuery.os.ios){r.renderControl(c._getHeader())}else{r.write("<header>");r.write("<h1>");if(c._iconImage){r.renderControl(c._iconImage)}r.write("<span>");r.renderControl(c._headerTitle);r.write("</span>");r.write("</h1>");r.write("</header>")}r.write("<section id='"+c.getId()+"-cont'>");r.write("<div id='"+c.getId()+"-scroll"+"' class='sapMDialogScroll'>");var a=c.getContent();for(var i=0;i<a.length;i++){r.renderControl(a[i])}r.write("</div>");r.write("</section>");if(!jQuery.os.ios){r.write("<footer class='sapMDialogActions'>");if(l){r.write("<div class='sapMDialogAction'>");r.renderControl(l);r.write("</div>")}if(R){r.write("<div class='sapMDialogAction'>");r.renderControl(R);r.write("</div>")}r.write("</footer>")}r.write("</div>")};
