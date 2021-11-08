import { ShowToastEvent } from 'lightning/platformShowToastEvent';
const dummyPackageXML = '<?xml version="1.0" encoding="UTF-8"?>'+
'<Package xmlns="http://soap.sforce.com/2006/04/metadata">'+
    '<types>'+
        '<members>{{_MEMBER}}</members>'+
        '<name>{{_META_TYPE}}</name>'+
    '</types>'+
    '<version>53.0</version>'+
'</Package>';
const dummyPackageXMLForMultipleFiles = '<?xml version="1.0" encoding="UTF-8"?>'+
'<Package xmlns="http://soap.sforce.com/2006/04/metadata">'+
    '{{_MEMBERS_TAG}}'+
    '<version>53.0</version>'+
'</Package>';
const eachMetadataMembers ='<types>'+
                                '{{_MEMBERS}}'+
                                '<name>{{_META_TYPE}}</name>'+
                            '</types>';
/**
 * This will be used to generate dummy /clone tag which needs to be appended to
 * Existing XML
 * @type {String}
 */
const dummyObjectXML = '<Profile xmlns="http://soap.sforce.com/2006/04/metadata">' +
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
    '<tabSettings>' +
    '<tab>{{_TAB_API_NAME}}</tab>' +
    '<visibility>{{_VISIBILITY}}</visibility>' +
    '</tabSettings>' +
    '</Profile>';

/**
 * This method will generate the BLOB which will be used for 
 * creating ZIp file 
 * @param {String} base64 encoded string
 * @returns 
 */
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
/**
 * This method crate the zip file from the blob generated from base64 string
 * @param {Blob} blob blob object for creating zip file
 * @returns {Promise} it returns a promise which will hav file content
 */
const getFileContent = (blob) => {
    let zip = new JSZip();
    return new Promise((resolve, reject) => {
        resolve(zip.loadAsync(blob));
    });
}

const callFunctionOnInteval = (interval, callbackFun) => {

}
/**
 * This method will help generate the toast message
 * @param {String} title title of the toast
 * @param {String} message message to be displayed on toast
 * @param {String} variant variant of the toast message
 */
const showToastMessage = (title, message, variant) => {
    this.dispatchEvent(
        new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        })
    );
}
/**
 * This method will create a dummy tab access node
 * @param {XMLDocument} xmlTree 
 * @param {Object} tabDetail 
 * @param {String} metadataType
 * @returns {Node}
 */
const createDupTabVisibilityTag = (xmlTree, tabDetail, metadataType) => {
    let dummyXMLDOC = new DOMParser().parseFromString(dummyObjectXML, 'text/xml');
    let tabVisibility = dummyXMLDOC.getElementsByTagName((metadataType.toLowerCase() === 'profile') ? 'tabVisibilities' : 'tabSettings')[0];
    if (tabVisibility) {
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
/**
 * This method will create a dummy object access node
 * @param {XMLDocument} xmlTree 
 * @param {Object} objectDetail 
 * @param {String} objName 
 * @returns {Node}
 */
const createDupObjectAccessTag = (xmlTree, objectDetail, objName) => {
    let dummyXMLDOC = new DOMParser().parseFromString(dummyObjectXML, 'text/xml');
    let objectNode = dummyXMLDOC.getElementsByTagName('objectPermissions')[0];
    if (objectNode) {
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
/**
 * This method will pretty print the XML
 * @param {XMLDocument} xmlDoc 
 * @returns {String}
 */
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
/**
 * This method will compare each Custom Object in org and append access xml To parent node
 * so that when deployed to other org it will have correct acess present
 * @param {List} listOfObjects - Objects whose access needs to be compared
 * @param {XMLDocument} profileXML - XML document of XMl where we need to compare
 * @returns {List}  
 */
const compareAllObjectAndAddAcessXML = (listOfObjects, profileXML) => {
    let listOfNodesTobeAdded = [];
    let objectTags = profileXML.getElementsByTagName('objectPermissions');
    let dummyXMLNodes = new DOMParser().parseFromString(dummyObjectXML, 'text/xml');
    if (objectTags) {
        let tempList = [...listOfObjects].filter((data) => {
            if (data) {
                let elementFound = [...objectTags].find((obj) => {
                    if (obj.childNodes) {
                        let objNamePresent = [...obj.childNodes].find((child) => {
                            if (child.nodeName === 'object' && child.innerHTML.toLowerCase() === data.toLowerCase()) {
                                return true;
                            }
                        });
                        if (objNamePresent) {
                            return true;
                        }
                    }
                });
                if (!elementFound) {
                    return true;
                }
            }
        });
        return tempList.map((noAccessObj) => {
            let tempCloned = dummyXMLNodes.getElementsByTagName('objectPermissions')[0].cloneNode(true);
            [...tempCloned.childNodes].forEach((clone) => {
                if (clone.nodeName !== 'object') {
                    clone.innerHTML = false;
                } else {
                    clone.innerHTML = noAccessObj;
                }
            });
            return tempCloned
        });
    }
}
/**
 * This method will compare each Custom field per object in org and append access xml To parent node
 * so that when deployed to other org it will have correct acess present
 * @param {List} listOfAllFields - List of fields whose access needs to be compared
 * @param {XMLDocument} profileXML - XML document of XMl where we need to compare
 * @returns {List}  
 */
const compareAllFieldAndAddAcessXML = (listOfAllFields, profileXML) => {
    let listOfNodesTobeAdded = [];
}
/**
 * This method will compare each Tabs in org and append access xml To parent node
 * so that when deployed to other org it will have correct acess present
 * @param {List} listOfAllTab - List of tabs whose access needs to be compared
 * @param {XMLDocument} profileXML - XML document of XMl where we need to compare
 * @param {String} metadataType
 * @returns {List}  
 */
const compareAllTabAndAddAcessXML = (listOfAllTab, profileXML, metadataType) => {
    let tabTags = profileXML.getElementsByTagName((metadataType.toLowerCase() === 'profile') ? 'tabVisibilities' : 'tabSettings');
    let dummyXMLNodes = new DOMParser().parseFromString(dummyObjectXML, 'text/xml');
    if (tabTags) {
        let tempList = [...listOfAllTab].filter((data) => {
            let elementFound = [...tabTags].find((obj) => {
                if (obj.childNodes) {
                    let objNamePresent = [...obj.childNodes].find((child) => {
                        if (child.nodeName === 'tab' && child.innerHTML.toLowerCase() === data.toLowerCase()) {
                            return true;
                        }
                    });
                    if (objNamePresent) {
                        return true;
                    }
                }
            });
            if (!elementFound) {
                return true;
            }
        });
        return tempList.map((noAccessObj) => {
            let tempCloned = dummyXMLNodes.getElementsByTagName((metadataType.toLowerCase() === 'profile') ? 'tabVisibilities' : 'tabSettings')[0].cloneNode(true);
            [...tempCloned.childNodes].forEach((clone) => {
                if (clone.nodeName !== 'tab') {
                    clone.innerHTML = (metadataType.toLowerCase() === 'profile')?'DefaultOff':'None';
                } else {
                    clone.innerHTML = noAccessObj;
                }
            });
            return tempCloned
        });
    }
}
/**
 * This method will help generate the ZIP data which will be used for deployment/validation
 * @param {String} zipData profile/Permission set data
 * @param {String} metadataType type of metadata {profile/Permissionset}
 * @param {String} metadataName name of metadata
 * @returns {Promise} return a file generation promise
 */
const generateZipForProfile = (zipData, metadataType, metadataName) => {
    let zip = new JSZip();
    let unpackagedFolder = zip.folder('unpackaged');
    unpackagedFolder.file("package.xml", dummyPackageXML.replace('{{_MEMBER}}', metadataName).replace('{{_META_TYPE}}', metadataType));
    var metadataFolder = unpackagedFolder.folder((metadataType.toLowerCase() === 'profile') ? 'profiles' : 'permissionsets');
    metadataFolder.file(metadataName+'.' + metadataType.toLowerCase(), zipData, { base64: false });
    return new Promise((resolve, reject) => {
        resolve(zip.generateAsync({ type: "blob" }));
    });
}
/**
 * This method will generate zip for multiple Profile/Permission
 * @param {Map} zipDataMap This map will hold multiple profile/permissionset data
 * @returns {Promise} Promise object which will be used for getting zip data
 */
const generateZipForMultileProfile = (zipDataMap) => {
    let zip = new JSZip();
    let unpackagedFolder = zip.folder('unpackaged');
    let eachMembers = '<members>{{_MEMBER}}</members>';
    let XMLbody = '';
    let packageXMLMap = new Map();
    zipDataMap.
    forEach((value, key) => {
        const meta = key.split('.')[1];
        const metaVal = key.split('.')[0];
        if(packageXMLMap.has(meta)){
            packageXMLMap.get(meta).push(metaVal);
        }else{
            packageXMLMap.set(meta, [metaVal]);
        }
    });
    packageXMLMap.forEach((value, key)=>{
        let tempMember = eachMetadataMembers.replace('{{_META_TYPE}}', (key==='profile' || key ==='Profile')?'Profile':'PermissionSet');
        let tempAllMembers = value.reduce((previous, current)=>{
            return previous + eachMembers.replace('{{_MEMBER}}', current.split('.')[0]);
        },'');
        XMLbody += tempMember.replace('{{_MEMBERS}}', tempAllMembers);
    });
    unpackagedFolder.file("package.xml", dummyPackageXMLForMultipleFiles.replace('{{_MEMBERS_TAG}}', XMLbody));
    let profileFolder = unpackagedFolder.folder('profiles');
    let permissionSetFolder = unpackagedFolder.folder('permissionsets');
    zipDataMap.forEach((zipData, key)=>{
        if(key.split('.')[1].toLowerCase().includes('profile')){
            //add to profile folder
            profileFolder.file(key, prettifyXML(zipData), {base64: false});
        }else if(key.split('.')[1].toLowerCase().includes('permissionset')){
            //add to permissionset folder
            permissionSetFolder.file(key, prettifyXML(zipData), {base64: false});
        }
    });
    // var metadataFolder = unpackagedFolder.folder((metadataType.toLowerCase() === 'profile') ? 'profiles' : 'permissionsets');
    // metadataFolder.file(metadataName+'.' + metadataType.toLowerCase(), zipData, { base64: false });
    return new Promise((resolve, reject) => {
        resolve(zip.generateAsync({ type: "blob" }));
    });
}
export {
    generateZipForProfile, compareAllObjectAndAddAcessXML, compareAllTabAndAddAcessXML,
    callFunctionOnInteval, getFileContent, createBlobData, showToastMessage,
    createDupTabVisibilityTag, createDupObjectAccessTag, createDupFieldAccessTag, prettifyXML,
    generateZipForMultileProfile
};