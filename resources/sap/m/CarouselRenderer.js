/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.m.CarouselRenderer");sap.m.CarouselRenderer={};
sap.m.CarouselRenderer.render=function(r,c){if(!c.getVisible()){return}r.write("<div");r.writeControlData(c);r.addStyle("width",c.getWidth());r.addStyle("height",c.getHeight());r.writeStyles();r.addClass("sapMCrsl");r.writeClasses();r.write(">");if(c.getPageIndicatorPlacement()==sap.m.PlacementType.Top){this._renderPageIndicator(r,c)}if(!c._oSwipeView){r.write("<div id='"+c._getContentId()+"' class='sapMCrslCont'></div>")}if(c.getPageIndicatorPlacement()==sap.m.PlacementType.Bottom){this._renderPageIndicator(r,c)}r.write("</div>")};
sap.m.CarouselRenderer._renderPageIndicator=function(r,c){r.write("<ul id='"+c._getNavId()+"' class='sapMCrslIndLst'>");this.renderPageIndicatorDots(r,c);r.write("</ul>")};
sap.m.CarouselRenderer.renderPageIndicatorDots=function(r,c){r.write("<div id='"+c._getPrevBtnId()+"' class='sapMCrslIndLstBt'/>");var d=c.getPages().length;for(var i=0;i<d;i++){r.write("<li id='"+c._getNavId()+"-dot"+i+"' class='sapMCrslIndLstIt'></li>")}r.write("<div id='"+c._getNextBtnId()+"' class='sapMCrslIndLstBt'/>")};
