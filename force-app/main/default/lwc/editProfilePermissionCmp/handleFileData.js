import { ShowToastEvent } from 'lightning/platformShowToastEvent';

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
    let tabVisibilityElement = xmlTree.createElement('tabVisibilities');
    let tabNameElement = xmlTree.createElement('tab');
    tabNameElement.innerHTML = tabDetail.tabName;
    let tabAccessElemnt = xmlTree.createElement('visibility');
    tabAccessElemnt.innerHTML = tabDetail.tabAccess;
    tabVisibilityElement.appendChild(tabNameElement);
    tabVisibilityElement.appendChild(tabAccessElemnt);
    return tabVisibilityElement;
}
const createDupObjectAccessTag = (xmlTree, objectDetail, objName) => {
    let objectPermissions = xmlTree.createElement('objectPermissions');
    let objectElem = xmlTree.createElement('object');
    objectElem.innerHTML = objName;
    let allowCreate = xmlTree.createElement('allowCreate');
    allowCreate.innerHTML = (objectDetail.accessType === "allowCreate") ? objectDetail.checked : 'false';
    let allowDelete = xmlTree.createElement('allowDelete');
    allowDelete.innerHTML = (objectDetail.accessType === "allowDelete") ? objectDetail.checked : 'false';
    let allowEdit = xmlTree.createElement('allowEdit');
    allowEdit.innerHTML = (objectDetail.accessType ==="allowEdit") ? objectDetail.checked : 'false';
    let allowRead = xmlTree.createElement('allowRead');
    allowRead.innerHTML = (objectDetail.accessType ==="allowRead") ? objectDetail.checked : 'false';
    let modifyAllRecords = xmlTree.createElement('modifyAllRecords');
    modifyAllRecords.innerHTML = (objectDetail.accessType ==="modifyAllRecords") ?objectDetail.checked : 'false';
    let viewAllRecords = xmlTree.createElement('viewAllRecords');
    viewAllRecords.innerHTML = (objectDetail.accessType ==="viewAllRecords") ? objectDetail.checked : 'false';
    objectPermissions.appendChild(objectElem);
    objectPermissions.appendChild(allowCreate);
    objectPermissions.appendChild(allowEdit);
    objectPermissions.appendChild(allowDelete);
    objectPermissions.appendChild(allowRead);
    objectPermissions.appendChild(modifyAllRecords);
    objectPermissions.appendChild(viewAllRecords);
    return objectPermissions;

}
const createDupFieldAccessTag = (xmlTree) => {
    return xmlTree
}

export { callFunctionOnInteval, getFileContent, createBlobData, showToastMessage, createDupTabVisibilityTag, createDupObjectAccessTag, createDupFieldAccessTag };