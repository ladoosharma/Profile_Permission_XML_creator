import { ShowToastEvent } from 'lightning/platformShowToastEvent';
const dummyObjectXML = '<Profile xmlns="http://soap.sforce.com/2006/04/metadata">'+
'<fieldPermissions>' +
    '<editable>{{_EDITABLE}}</editable>' +
    '<field>{{_FIELD_API_NAME}}</field>' +
    '<readable>{{_READABLE}}</readable>' +
    '</fieldPermissions>' +
    '<objectPermissions>' +
    '<allowCreate>{{_CREATE}}</allowCreate>' +
    '<allowDelete>{{_DELETE}}</allowDelete>' +
    '<allowEdit>{{_EDIT}}</allowEdit>' +
    '<allowRead>{{_READ}}</allowRead>' +
    '<modifyAllRecords>{{_MODIFY_ALL}}</modifyAllRecords>' +
    '<object>{{_OBJECT_API_NAME}}</object>' +
    '<viewAllRecords>{{_VIEW_ALL}}</viewAllRecords>' +
    '</objectPermissions>' +
    '<tabVisibilities>' +
    '<tab>{{_TAB_API_NAME}}</tab>' +
    '<visibility>{{_VISIBILITY}}</visibility>' +
    '</tabVisibilities>' +
    '</Profile>';
const createBlobData = (base64) => {
    let binaryString = window.atob(base64);
    let binaryLen = binaryString.length;

    let ab = new ArrayBuffer(binaryLen);
    let ia = new Uint8Array(ab);
    for (let i = 0; i < binaryLen; i++) {
        ia[i] = binaryString.charCodeAt(i);
    }

    let bb = new Blob([ab], { type: "application/zip" });
    bb.lastModifiedDate = new Date();
    bb.name = "archive.zip";
    return bb;
}

const getFileContent = (blob) => {
    let zip = new JSZip();
    return new Promise((resolve, reject) => {
        resolve(zip.loadAsync(blob));
    });
}

const callFunctionOnInteval = (interval, callbackFun) => {

}
const showToastMessage = (title, message, variant) => {
    this.dispatchEvent(
        new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        })
    );
}
const createDupTabVisibilityTag = (xmlTree, tabDetail) => {
    let dummyXMLDOC = new DOMParser().parseFromString(dummyObjectXML, 'text/xml');
    let tabVisibility = dummyXMLDOC.getElementsByTagName('tabVisibilities')[0];
    if(tabVisibility){
        tabVisibility.childNodes.forEach((node, index) => {
            if (node.nodeName === 'tab') {
                tabVisibility.childNodes[index].innerHTML = tabDetail.tabName;
            }
            else if (node.nodeName !== 'tab') {
                tabVisibility.childNodes[index].innerHTML = tabDetail.tabAccess;
            }
        });
    }
    return tabVisibility;
}
const createDupObjectAccessTag = (xmlTree, objectDetail, objName) => {
    let dummyXMLDOC = new DOMParser().parseFromString(dummyObjectXML, 'text/xml');
    let objectNode = dummyXMLDOC.getElementsByTagName('objectPermissions')[0];
    if(objectNode){
        objectNode.childNodes.forEach((node, index) => {
            if (node.nodeName === 'object') {
                objectNode.childNodes[index].innerHTML = objName;
            }
            if (objectDetail.accessType === node.nodeName) {
                objectNode.childNodes[index].innerHTML = objectDetail.checked;
            } else if (node.nodeName !== 'object') {
                objectNode.childNodes[index].innerHTML = false;
            }
        });
    }
    return objectNode;
}
const createDupFieldAccessTag = (xmlTree) => {
    return xmlTree
}
const prettifyXML = (xmlDoc) => {
    var xsltDoc = new DOMParser().parseFromString([
        // describes how we want to modify the XML - indent everything
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:strip-space elements="*"/>',
        '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
        '    <xsl:value-of select="normalize-space(.)"/>',
        '  </xsl:template>',
        '  <xsl:template match="node()|@*">',
        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
        '  </xsl:template>',
        '  <xsl:output indent="yes"/>',
        '</xsl:stylesheet>',
    ].join('\n'), 'application/xml');

    var xsltProcessor = new XSLTProcessor();
    xsltProcessor.importStylesheet(xsltDoc);
    var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
    var resultXml = new XMLSerializer().serializeToString(resultDoc);
    return resultXml;
}

export { callFunctionOnInteval, getFileContent, createBlobData, showToastMessage, createDupTabVisibilityTag, createDupObjectAccessTag, createDupFieldAccessTag, prettifyXML };