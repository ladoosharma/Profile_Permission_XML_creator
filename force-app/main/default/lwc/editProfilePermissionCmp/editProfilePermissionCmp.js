import { LightningElement, track, wire, api } from 'lwc';
import getAllObjects from '@salesforce/apex/EditProfilePermissionController.getAllObjects';
import getSelectedObjInfo from '@salesforce/apex/EditProfilePermissionController.getObjectInfos';

export default class EditProfilePermissionCmp extends LightningElement {

    @wire(getAllObjects, {})
    allObjectApiList({ data, error }) {
        //this.currentObjectInfos = value;

        if (data) {
            let tempList = [];
            data.forEach(element => {
                tempList.push({ value: element, label: element });
            });
            this.allObjOptions = tempList;
        }
        if (error) {
            //this.handleErrorInFetchingOnj(error);
        }
    }
    @api
    objectSelected = 'Account';
    @track
    allObjOptions;
    @track
    currentObjectInfos;
    @track
    permissionFileContent;
    @track
    existingObjAccessXML;
    @track
    existingObjFldAccessXML;
    @track
    existingXMLDoc;
    @track
    fileName;
    handleObjectData(data) {

    }
    handleErrorInFetchingOnj(error) {

    }
    handleUploadFinished(event) {

        let file = event.target.files;
        let regex = new RegExp('.+\.(profile|permission)').exec(file[0].name);
        this.fileName = file[0].name;
        if (regex) {
            let reader = new FileReader();
            reader.onload = this.showContent.bind(this, reader);
            reader.onerror = this.showError.bind(this, reader);
            reader.readAsText(event.target.files[0]);
        } else {
            alert('Invalid file type, please select file with .profile or . permission extensions!!!');
        }

    }
    showError(reader) {

    }
    showContent(reader) {
        this.template.querySelector("[data-id='objects']").disabled = false;
        this.permissionFileContent = reader.result;
    }
    fetchObjMetadata(evt) {
        let element = evt.currentTarget;
        if (element.name === 'objects') {
            this.objectSelected = element.value;
            getSelectedObjInfo({ objName: this.objectSelected })
                .then((data) => {
                    this.currentObjectInfos = JSON.parse(data);
                    this.compareXMLandCreateTable();
                })
                .catch((error) => {

                })
        }

    }
    compareXMLandCreateTable() {
        if (this.currentObjectInfos && this.permissionFileContent) {
            //do all work here 
            let text, parser, xmlDoc, fieldMap;
            text = this.permissionFileContent;
            parser = new DOMParser();
            xmlDoc = (!this.existingXMLDoc) ? parser.parseFromString(text, 'text/xml') : this.existingXMLDoc;
            if (!this.existingXMLDoc) {
                this.existingXMLDoc = xmlDoc;
            }
            fieldMap = new Map();
            this.currentObjectInfos.fields.forEach((field) => {
                fieldMap.set(field.name, { label: field.label, updateable: field.updateable });
            });
            let objPermissions = xmlDoc.getElementsByTagName('objectPermissions');
            let fieldPermissions = xmlDoc.getElementsByTagName('fieldPermissions');
            let objPermissionMap = {};
            let fieldPermissionMap = {};
            let objPermission = [...objPermissions].filter((node) => {
                if (node.childNodes) {
                    let childs = node.childNodes;
                    let objPermInXML = [...childs].filter((childNode) => {
                        if (childNode.nodeName === 'object' && childNode.innerHTML === this.objectSelected) {
                            return true;
                        }

                    });
                    if (objPermInXML.length > 0) {
                        return true;
                    }
                }
            });
            this.existingObjAccessXML = objPermission;
            let fieldPermission = [...fieldPermissions].filter((node) => {
                if (node.childNodes) {
                    let childs = node.childNodes;
                    let fldPermsInXML = [...childs].filter((childNode) => {
                        if (childNode.nodeName === 'field' && childNode.innerHTML.startsWith(this.objectSelected + '.')) {
                            return true;
                        }
                    });
                    if (fldPermsInXML.length > 0) {
                        return true;
                    }
                }
            });
            this.existingObjFldAccessXML = fieldPermission;
            if (objPermission.length > 0) {
                [...objPermission[0].childNodes].forEach(eachNode => {
                    if (eachNode.nodeName !== 'text' && eachNode.nodeName !== '#text') {
                        objPermissionMap[eachNode.nodeName] = eachNode.innerHTML;
                    }
                });
            }
            if (fieldPermission.length > 0) {
                [...fieldPermission].forEach((eachFldNode) => {
                    let fieldAPIName = '';
                    let field = [...eachFldNode.childNodes].find((node) => {
                        if (node.nodeName === 'field') {
                            return true;
                        }
                    });
                    fieldAPIName = field.innerHTML.split(this.objectSelected + '.')[1];
                    fieldAPIName = fieldAPIName.toLowerCase();
                    //let tempObj = {}
                    fieldPermissionMap[fieldAPIName] = {};
                    //fieldPermissionMap.push(tempObj[fieldAPIName]);
                    [...eachFldNode.childNodes].forEach((node) => {
                        if (node.nodeName !== 'field' && node.nodeName !== '#text') {
                            fieldPermissionMap[fieldAPIName][node.nodeName] = node.innerHTML;
                        }
                    });


                });
            }

            let child = this.template.querySelector('c-edit-profile-permission-table-cmp');
            if (child) {
                //child.prePopulateObjectAccess({one:'1', two:'2' });
                child.setFieldMap(fieldMap);
                child.prePopulateObjectAccess(objPermissionMap);
                child.prePopulateFieldAccess(fieldPermissionMap);
            }

        }
    }
    modifyObjAccess(evt) {
        let xmlTree = this.existingXMLDoc;
        let existingObjXML = [...xmlTree.getElementsByTagName('objectPermissions')].find((element) => {
            let nodeFound = [...element.childNodes].find((child) => {
                if (child.nodeName === 'object' && child.innerHTML === this.objectSelected) {
                    return true;
                }

            });
            if (nodeFound) {
                return true;
            }

        });
        if (this.existingObjAccessXML.length > 0 || existingObjXML) {
            //mofiy the existing one
            [...xmlTree.getElementsByTagName('objectPermissions')].forEach((eachObj, count) => {
                if (eachObj.childNodes) {
                    let item = [...eachObj.childNodes].find((child) => {
                        if (child.nodeName === 'object' && child.innerHTML === this.objectSelected) {
                            return true;
                        }
                    });
                    if (item) {
                        [...[...xmlTree.getElementsByTagName('objectPermissions')][count].childNodes].forEach((access, counter) => {
                            if (access.nodeName === evt.detail.accessType) {
                                [...[...xmlTree.getElementsByTagName('objectPermissions')][count].childNodes][counter].innerHTML = evt.detail.checked;
                            }
                        });
                    }
                }
            });

        } else {
            //append new node in XML tree
            let objNodeList = [...xmlTree.getElementsByTagName('objectPermissions')];
            let newObjAccessNode = objNodeList[0].cloneNode(true);
            if (newObjAccessNode) {
                newObjAccessNode.childNodes.forEach((node, index) => {
                    if (node.nodeName === 'object') {
                        newObjAccessNode.childNodes[index].innerHTML = this.objectSelected;
                    }
                    if (evt.detail.accessType === node.nodeName) {
                        newObjAccessNode.childNodes[index].innerHTML = evt.detail.checked;
                    } else if (node.nodeName !== 'object') {
                        newObjAccessNode.childNodes[index].innerHTML = false;
                    }
                });

            }
            xmlTree.documentElement.insertBefore(newObjAccessNode, objNodeList[0]);
        }
        this.existingXMLDoc = xmlTree;

    }
    modifyFldAccess(evt) {
        let xmlTree = this.existingXMLDoc;
        let field = this.objectSelected + '.' + evt.detail.fldName;
        let allFieldNode = [...xmlTree.getElementsByTagName('fieldPermissions')];
        let fieldNode = allFieldNode.find((node) => {
            let seletedFldNode = [...node.childNodes].find((child) => {
                if (child.nodeName === 'field' && child.innerHTML === field) {
                    return true;
                }
            });
            if (seletedFldNode) {
                return true;
            }
        });
        if (fieldNode) {
            [...xmlTree.getElementsByTagName('fieldPermissions')].forEach((node, index) => {
                let nodeSelected = [...node.childNodes].find((child) => {
                    if (child.nodeName === 'field' && child.innerHTML === field) {
                        return true;
                    }
                });
                if (nodeSelected) {
                    [...[...xmlTree.getElementsByTagName('fieldPermissions')][index].childNodes].forEach((access, indx) => {
                        if (access.nodeName === evt.detail.accessType) {
                            [...[...xmlTree.getElementsByTagName('fieldPermissions')][index].childNodes][indx].innerHTML = evt.detail.checked;
                        }
                    });
                }
            });
        } else {
            let clonedAccess = allFieldNode[0].cloneNode(true);
            [...clonedAccess.childNodes].forEach((node, indx) => {
                if (node.nodeName === 'field') {
                    clonedAccess.childNodes[indx].innerHTML = field;
                }
                if (node.nodeName !== 'field' && node.nodeName === evt.detail.accessType) {
                    clonedAccess.childNodes[indx].innerHTML = evt.detail.checked;
                }
            })
            let firstNodeWithThisObj = allFieldNode.find((eachNode) => {
                let objFld = [...eachNode.childNodes].find((child) => {
                    if (child.nodeName === 'field' && child.innerHTML.startsWith(this.objectSelected)) {
                        return true;
                    }

                });
                if (objFld) {
                    return true;
                }
            });
            if (firstNodeWithThisObj) {
                xmlTree.documentElement.insertBefore(clonedAccess, firstNodeWithThisObj);
            } else {
                xmlTree.documentElement.insertBefore(clonedAccess, allFieldNode[0]);
            }
        }
        this.existingXMLDoc = xmlTree;
    }
    downloadFile(evt) {
        if (this.fileName) {
            let fileText = new XMLSerializer().serializeToString(this.existingXMLDoc.documentElement);
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileText));
            element.setAttribute('download', this.fileName);

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        } else {
            alert('Please select file !!!!')
        }

    }

}