/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.m.StandardListItemRenderer");jQuery.sap.require("sap.ui.core.Renderer");jQuery.sap.require("sap.m.ListItemBaseRenderer");sap.m.StandardListItemRenderer=sap.ui.core.Renderer.extend(sap.m.ListItemBaseRenderer);
sap.m.StandardListItemRenderer.renderLIAttributes=function(r,l){r.addClass("sapMSLI")};
sap.m.StandardListItemRenderer.renderLIContent=function(r,l){if(l.getIcon()){if(l.getIconInset()){r.renderControl(l._getImage((l.getId()+"-img"),"sapMSLIImg",l.getIcon(),l.getIconDensityAware()))}else{r.renderControl(l._getImage((l.getId()+"-img"),"sapMSLIImgThumb",l.getIcon(),l.getIconDensityAware()))}}var i=l.getTitle()&&l.getDescription();if(i){r.write("<div");r.addClass("sapMSLIDiv");r.writeClasses();r.write(">")}r.write("<h1");if(i){r.addClass("sapMSLITitle")}else{r.addClass("sapMSLIDiv");r.addClass("sapMSLITitleOnly")}r.writeClasses();r.write(">");r.writeEscaped(l.getTitle());r.write("</h1>");if(i){r.write("<p");r.addClass("sapMSLIDescription");r.writeClasses();r.write(">");r.writeEscaped(l.getDescription());r.write("</p>")}if(i){r.write("</div>")}};
