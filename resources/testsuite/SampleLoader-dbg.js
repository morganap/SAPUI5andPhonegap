/*!
 * @copyright@
 */

// Provides a loader that transforms UnifiedRendering(UR)/Lightspeed(LS) sample files to HTML pages
jQuery.sap.declare("sap.ui.legacy.SampleLoader");

sap.ui.legacy.SampleLoader = function() {
};

sap.ui.legacy.SampleLoader.load = function(sUrl, oUiArea) {
	this.iControlIndex = 0;
	this.sRootControlId = "";

	// TODO check whether 'xml' could be used
	var oResponse = jQuery.sap.syncGetText(sUrl);
	if (oResponse.success && oResponse.data) {

		var oXML = sap.ui.util.Script.parseXMLDocument(oResponse.data);

		var oStringBuilder = new sap.ui.util.StringBuilder();
		var oNodes = oXML.getElementsByTagName("page")[0].childNodes;
		// find the first element with a method attribute = setContent

		for (var i=0;i<oNodes.length;i++) {
			var oNode = oNodes[i];
			if ((oNode.nodeType == 1) && oNode.getAttribute("method") == "setContent") {
				oStringBuilder.append("var controls = [];\n");
				this.buildObjectTree(oNode, "", oStringBuilder);
				oStringBuilder.append("oUiArea.setRootControl(controls['"+this.sRootControlId+"'])");
				var sControlTree = oStringBuilder.toString();
				oUiArea.getRootNode().innerHTML = "";
				this.sRootControlId = null;
				eval(sControlTree);
				break;
			}
		}
	} else {
		alert("File Not found or no valid XML returned.")
	}
};

/*
 *
 */
sap.ui.legacy.SampleLoader.buildObjectTree = function(oXMLNode, sParent, oStringBuilder, oParentMetadata)
{
	var Strings = sap.ui.util.Strings;

	var sControl = oXMLNode.tagName;
	if (!sControl) {
		return;
	} //TODO: is this correct?

	sControl = Strings.charToUpperCase(sControl, 0);

	// get the controls metadata..
	var xControlClass = sap.ui.legacy[sControl];
	if ( !xControlClass ) {
		return;
	}
	new xControlClass();
	var xControlClass = sap.ui.legacy[sControl];
	var oMetadata = xControlClass.getMetadata();

	oStringBuilder.append("\n");
	var sId = oXMLNode.getAttribute("id");
	if (!sId) {
		sId = "i" + (this.iControlIndex++);
	}
	if (!this.sRootControlId) {
		this.sRootControlId = sId;
	}
	oStringBuilder.append("controls[\"" + sId + "\"] = new sap.ui.legacy." + sControl + "(\"" + sId + "\");");

	for ( var i = 0; i < oXMLNode.attributes.length; i++) {
		var sAttributeName = oXMLNode.attributes[i].nodeName;
		var sAttributeValue = oXMLNode.attributes[i].nodeValue;
		if (sAttributeName == "id") {
			continue;
		}
		if (sAttributeName.indexOf("Info") > -1) {
			continue;
		}
		if (sAttributeName == "method") {
			if (sParent) {
				var sAddAggregationMember = sAttributeValue,
					sMethod = sAddAggregationMember.substr(0,2),
					sAggregationName = sAddAggregationMember.substr(3),
					sSingularName = sAggregationName,
					bIsPluralName = Strings.endsWith(sAggregationName, "s");

				if (bIsPluralName) {
					if ( Strings.endsWith(sAggregationName, "ies") ) {
						sSingularName = sAggregationName.substr(0, sAggregationName.length - 3) + "y";
					} else {
						sSingularName = sAggregationName.substr(0, sAggregationName.length - 1);
					}
				}

				if (sMethod == "add" || bIsPluralName) {
					sMethod = "add";
				} else {
					sMethod = "set";
				}

				// Fix for inconsistent lsx files
				if (sAggregationName == "Control" && !this.getTypeFromMetadata(oParentMetadata, "Control")) {
					sAggregationName = "Content";
					sSingularName = sAggregationName;
				}
				else if (sAggregationName == "Content" && !this.getTypeFromMetadata(oParentMetadata, "Content")) {
					sAggregationName = "Control";
					sSingularName = sAggregationName;
				}

				if (this.getTypeFromMetadata(oParentMetadata, sAggregationName)) {
					oStringBuilder.append(sParent + "." + sMethod + sSingularName + "(controls[\"" + sId + "\"]);");
				}
			}
			continue;
		}
		sAttributeName = sAttributeName.substr(0,1).toUpperCase() + sAttributeName.substr(1);
		var sType = this.getTypeFromMetadata(oMetadata, sAttributeName);
		if (sType == "int" || sType == "boolean" || sType == "float") {
			oStringBuilder.append("controls[\"" + sId + "\"].set" + sAttributeName + "(" + sAttributeValue + ");");
		} else if (sType){
			oStringBuilder.append("controls[\"" + sId + "\"].set" + sAttributeName + "(\"" + sAttributeValue + "\");");
		}
	}

	var mEvents = oMetadata.getEvents();
	for (var n in mEvents) {
		var method = "attach" + Strings.charToUpperCase(n, 0);
		oStringBuilder.append("controls[\"" + sId + "\"]." + method + "(function(oEvent) {jQuery.sap.log.info(\"Legacy Control fired \" + oEvent.sId + \" on \" + oEvent.target.id + \" instance of \" + jQuery(oEvent.target).control()[0].getMetadata().getName(),\"\",\"sap.ui.core.Core\");});");
	}

	var sParentId = sId;
	for ( var i = 0; i < oXMLNode.childNodes.length; i++) {
		this.buildObjectTree(oXMLNode.childNodes[i], "controls[\"" + sParentId+ "\"]", oStringBuilder, oMetadata);
	}
};

/**
 *
 */
sap.ui.legacy.SampleLoader.getTypeFromMetadata = function(oMetadata, sMemberName)
{
	var mCandidates = oMetadata.getAllProperties();
	for (n in mCandidates) {
		var oCandidate = mCandidates[n];
		if ( oCandidate.name == sMemberName ) {
			return oCandidate.type;
		}
	}
	var mCandidates = oMetadata.getAllAggregations();
	for (n in mCandidates) {
		var oCandidate = mCandidates[n];
		if ( oCandidate.name == sMemberName ) {
			return oCandidate.type;
		}
	}
	var mCandidates = oMetadata.getAllAssociations();
	for (n in mCandidates) {
		var oCandidate = mCandidates[n];
		if ( oCandidate.name == sMemberName ) {
			return oCandidate.type;
		}
	}
	return undefined;
};