/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.m.PopoverRenderer");sap.m.PopoverRenderer={};
sap.m.PopoverRenderer.render=function(r,c){var I=c.getId(),i=0,a=c.getContent(),f=c.getFooter(),h;if(c.getShowHeader()){h=c._getAnyHeader()}r.write("<div");r.writeControlData(c);r.addClass("sapMPopover");if(h){r.addClass("sapMPopoverWithBar")}else{r.addClass("sapMPopoverWithoutBar")}if(c._hasNavContent()){r.addClass("sapMPopoverNav")}if(f){r.addClass("sapMPopoverWithFooter")}if(c.getPlacement()===sap.m.PlacementType.Top){r.addClass("sapMPopoverPlacedTop")}r.writeClasses();r.write(">");if(!jQuery.os.ios){r.write("<span");r.writeAttribute("id",I+"-arrow");r.addClass("sapMPopoverArr");r.writeClasses();r.write("></span>")}if(h){r.renderControl(c._getAnyHeader())}r.write("<div");r.writeAttribute("id",I+"-cont");r.addClass("sapMPopoverCont");r.writeClasses();r.write(">");for(i=0;i<a.length;i++){r.renderControl(a[i])}r.write("</div>");if(f){f._context='footer';r.renderControl(f)}if(jQuery.os.ios){r.write("<span");r.writeAttribute("id",I+"-arrow");r.addClass("sapMPopoverArr");r.writeClasses();r.write("></span>")}r.write("</div>")};
