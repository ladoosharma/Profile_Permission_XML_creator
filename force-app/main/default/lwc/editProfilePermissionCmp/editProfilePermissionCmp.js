import { LightningElement, track, wire, api } from 'lwc';
import getAllObjects from '@salesforce/apex/EditProfilePermissionController.getAllObjects';
import getSelectedObjInfo from '@salesforce/apex/EditProfilePermissionController.getObjectInfos';
import getAllTabs from '@salesforce/apex/EditProfilePermissionController.getAllTabs';
import getAllProfilePermission from '@salesforce/apex/EditProfilePermissionController.getAllProfilePermission'
import getProfilePermissionXML from '@salesforce/apex/EditProfilePermissionController.getProfilePermissionXML'
import checkRetrieveStatus from '@salesforce/apex/EditProfilePermissionController.checkRetrieveStatus'
import jsZIp from '@salesforce/resourceUrl/jszip';
import { loadScript } from 'lightning/platformResourceLoader';
import { getFileContent, createBlobData, showToastMessage, createDupObjectAccessTag } from './handleFileData'

export default class EditProfilePermissionCmp extends LightningElement {
    tabOrObjPicklists = [{ label: 'Tab', value: 'tab' }, { label: 'Custom/Standard Object', value: 'object' }];
    renderedCallback() {
        if (this.jsZipInitialized) {
            return;
        }

        Promise.all([
            loadScript(this, jsZIp)
        ])
            .then(() => {
                this.jsZipInitialized = true;
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error loading JS zip',
                        message: error.message,
                        variant: 'error'
                    })
                );
            });
    }
    @wire(getAllObjects, {})
    allObjectApiList({ data, error }) {
        //this.currentObjectInfos = value;

        if (data) {

            var xmlDoc = new DOMParser().parseFromString(data, 'text/xml');
            let tempList = [...xmlDoc.getElementsByTagName('fullName')].map((node) => {
                if (node) {
                    if (node.childNodes) {
                        return { value: node.childNodes[0].nodeValue, label: node.childNodes[0].nodeValue };
                    }
                }
            });
            /*data.forEach(element => {
                tempList.push({ value: element, label: element });
            });*/
            this.objectList = tempList;
        }
        if (error) {
            //this.handleErrorInFetchingOnj(error);
        }
    }
    @wire(getAllProfilePermission, {})
    allProfilePermissionApiList({ data, error }) {
        if (data) {
            var xmlDoc = new DOMParser().parseFromString(data, 'text/xml');
            let tempList = [...xmlDoc.getElementsByTagName('fullName')].map((node) => {
                if (node) {
                    if (node.childNodes) {
                        return { value: node.childNodes[0].nodeValue, label: node.childNodes[0].nodeValue };
                    }
                }
            });
            this.profileOptionList = tempList;
        }
        if (error) {
            //this.handleErrorInFetchingOnj(error);
        }
    }
    @wire(getAllTabs, {})
    allTabApiList({ data, error }) {
        //this.currentObjectInfos = value;

        if (data) {
            let tempList = [];
            const recordData = JSON.parse(data);
            if (recordData) {
                recordData.records.forEach(element => {
                    tempList.push({ value: element.Name, label: element.Label });
                });
            }
            this.tabList = tempList;
        }
        if (error) {
            //this.handleErrorInFetchingOnj(error);
        }
    }
    jsZipInitialized;
    @track
    profilePermissionSetelected;
    @track
    isProfile;
    @track
    profileOptionList;
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
    @track
    tabList;
    @track
    objectList;
    @track
    isObject;
    handleObjectData(data) {

    }
    handleErrorInFetchingOnj(error) {

    }
    getProfilePermission(evt) {
        const fieldValue = evt.currentTarget;
        let jsZipComponent = this.template.querySelector('c-load-j-szip-component');
        jsZipComponent.initializeJSZIP();
        this.showHideSpinner(true)
        if (fieldValue.value && jsZipComponent) {
            getProfilePermissionXML({ apiName: fieldValue.value, typeOfMetadata: 'Profile' })
                .then((data) => {
                    let xmlData = new DOMParser().parseFromString(data, 'text/xml');
                    if (xmlData) {
                        const retrieveRequestId = xmlData.getElementsByTagName('id')[0].childNodes[0].nodeValue;
                        const status = xmlData.getElementsByTagName('state')[0].childNodes[0].nodeValue;
                        if (status && retrieveRequestId) {
                            this.retrieveRequestHandler(retrieveRequestId, fieldValue);
                        }
                    }
                    console.log(data);
                })
                .catch((error) => {
                    console.log(error);
                })
        }
    }
    retrieveRequestHandler(requestId, fieldValue) {
        let requestCheck = 0;
        let checkIntervalRequest = setInterval(() => {
            checkRetrieveStatus({ requestId: requestId })
                .then((xmlData) => {
                    const zipXML = new DOMParser().parseFromString(xmlData, 'text/xml');
                    const state = zipXML.getElementsByTagName('done')[0].childNodes[0].nodeValue;

                    if (state === 'true') {
                        const zipContent = zipXML.getElementsByTagName('zipFile')[0].childNodes[0].nodeValue;
                        clearInterval(checkIntervalRequest);
                        getFileContent(createBlobData(zipContent))
                            .then((zip) => {
                                zip.files['unpackaged/profiles/' + fieldValue.value + '.profile'].async("string").then((content) => {
                                    this.showContent(content);
                                    console.log(content);
                                });
                            }).catch((e) => {
                                console.log(e)
                                alert(e.message)
                            });
                        this.showHideSpinner(false);
                    } else if (requestCheck === 10) {
                        this.showHideSpinner(false);
                        clearInterval(checkIntervalRequest);
                        alert('There is issue with retrieving profile/permission , please try to refresh the page and try again!!!')
                    }
                    ++requestCheck;
                })
                .catch((error) => {
                    console.log(error)
                    alert(error.message)
                })
        }, 3000);
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
        //this.template.querySelector("[data-id='objects']").disabled = false;
        this.template.querySelector("[data-id='taborobjects']").disabled = false;
        this.permissionFileContent = reader;//reader.result;
    }
    /**
     * 
     * @param {event} evt 
     */
    fetchObjMetadata(evt) {
        let element = evt.currentTarget;
        let tabOrObjectDom = this.template.querySelector("[data-id='taborobjects']");

        if (element.name === 'objects' && tabOrObjectDom.value === 'object') {
            this.objectSelected = element.value;
            getSelectedObjInfo({ objName: (this.objectSelected.endsWith('__c') || this.objectSelected.endsWith('__mdt')) ? 'Bisapp1__' + this.objectSelected : this.objectSelected })
                .then((data) => {
                    //this.isObject = true;
                    this.currentObjectInfos = JSON.parse(data);
                    this.compareXMLandCreateTable();
                    this.template.querySelector("[data-id='profileTable']").style.display = 'inline';
                    this.template.querySelector("[data-id='tabTable']").style.display = 'none';
                })
                .catch((error) => {

                })
        } else if (tabOrObjectDom.value === 'tab') {
            this.template.querySelector("[data-id='profileTable']").style.display = 'none';
            this.template.querySelector("[data-id='tabTable']").style.display = 'inline';
            this.generateTabAccess(element.value);
        }

    }
    /**
     * This method will compare the XML tree and generate the table which will show the 
     * Tab level access 
     * @param {String} _tabName 
     * @returns 
     */
    generateTabAccess(_tabName) {
        let childTabComponent = this.template.querySelector('c-edit-tab-level-access-cmp');
        let xmlTree = this.parseDocument();
        if (xmlTree && _tabName) {
            let tabAccessNode = xmlTree.getElementsByTagName('tabVisibilities');
            if (tabAccessNode) {
                let givenTabAccess = [...tabAccessNode].filter((node) => {
                    if (node.childNodes) {
                        let child = node.childNodes;
                        let tabAccess = [...child].filter((child) => {
                            if (child.nodeName === 'tab' && child.innerHTML.toLowerCase() === _tabName.toLocaleLowerCase()) {
                                return true;
                            }
                        });
                        return (tabAccess.length > 0);
                    }
                });
                if (childTabComponent) {
                    childTabComponent.tabName = _tabName;
                    childTabComponent.tabAccess = (givenTabAccess.length > 0) ? [...givenTabAccess[0].childNodes].filter((node) => { return (node.nodeName === 'visibility'); })[0].innerHTML : 'Hidden';
                }
            } else if (childTabComponent) {
                childTabComponent.tabName = _tabName;
                childTabComponent.tabAccess = 'Hidden';
            }
        }
    }
    /**
     * 
     * @returns {Object}
     */
    parseDocument() {
        let text, parser, xmlDoc, fieldMap;
        text = this.permissionFileContent;
        parser = new DOMParser();
        xmlDoc = (!this.existingXMLDoc) ? parser.parseFromString(text, 'text/xml') : this.existingXMLDoc;
        if (!this.existingXMLDoc) {
            this.existingXMLDoc = xmlDoc;
        }
        return xmlDoc;
    }
    compareXMLandCreateTable() {
        if (this.currentObjectInfos && this.permissionFileContent) {
            let xmlDoc = this.parseDocument();
            let fieldMap = new Map();
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
            let newObjAccessNode = createDupObjectAccessTag(xmlTree, evt.detail);
            /*if (newObjAccessNode) {
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

            }*/
            if( objNodeList[0]){
                xmlTree.documentElement.insertBefore(newObjAccessNode, objNodeList[0]);
            }else{
                xmlTree.documentElement.appendChild(newObjAccessNode);
            }
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
            });
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
        if (this.existingXMLDoc) {
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
    tabOrObjects(evt) {
        if (evt.currentTarget) {
            this.template.querySelector("[data-id='objects']").disabled = false;
            if (evt.currentTarget.value === 'object') {
                this.allObjOptions = this.objectList;
            } else if (evt.currentTarget.value === 'tab') {
                this.allObjOptions = this.tabList;
            }
        }
    }
    handleTabVisibility(evt) {
        let xmlTree = this.existingXMLDoc;
        //let evtData = evt.dat
        if (xmlTree && evt.detail) {
            let existingTabVisiblities = xmlTree.getElementsByTagName('tabVisibilities');
            let changedTabVisibilty = [...existingTabVisiblities].filter((node) => {
                if (node.childNodes) {
                    let child = node.childNodes;
                    let tabAccess = [...child].filter((child) => {
                        if (child.nodeName === 'tab' && child.innerHTML.toLowerCase() === evt.detail.tabName.toLocaleLowerCase()) {
                            return true;
                        }
                    });
                    return (tabAccess.length > 0);
                }
            });
            if (changedTabVisibilty.length > 0) {
                [...xmlTree.getElementsByTagName('tabVisibilities')].forEach((node, index) => {
                    if (node.childNodes) {
                        let tabAccess = [...node.childNodes].filter((child) => {
                            if (child.nodeName === 'tab' && child.innerHTML.toLowerCase() === evt.detail.tabName.toLocaleLowerCase()) {
                                return true;
                            }
                        });
                        if (tabAccess) {
                            [...[...xmlTree.getElementsByTagName('tabVisibilities')][index].childNodes].forEach((child, indexVar) => {
                                if (child.nodeName === 'visibilty') {
                                    [...[...xmlTree.getElementsByTagName('tabVisibilities')][index].childNodes][indexVar].innerHTML = evt.detail.tabAccess;
                                }
                            });
                        }
                    }
                });
            } else if (existingTabVisiblities.length > 0) {
                let clonedAccess = existingTabVisiblities[0].cloneNode(true);
                [...clonedAccess.childNodes].forEach((node, indx) => {
                    if (node.nodeName === 'tab') {
                        clonedAccess.childNodes[indx].innerHTML = evt.detail.tabName;
                    }
                    if (node.nodeName === 'visibility') {
                        clonedAccess.childNodes[indx].innerHTML = evt.detail.tabAccess;
                    }
                });
                xmlTree.documentElement.insertBefore(clonedAccess, existingTabVisiblities[0]);

            } else {
                let tabVisibilityElement = xmlTree.createElement('tabVisibilities');
                let tabNameElement = xmlTree.createElement('tab');
                tabNameElement.innerHTML = evt.detail.tabName;
                let tabAccessElemnt = xmlTree.createElement('visibility');
                tabAccessElemnt.innerHTML = evt.detail.tabAccess;
                tabVisibilityElement.appendChild(tabNameElement);
                tabVisibilityElement.appendChild(tabAccessElemnt);
                xmlTree.documentElement.insertBefore(tabVisibilityElement, xmlTree.getElementsByTagName('fieldPermissions')[0]);
            }
            this.existingXMLDoc = xmlTree;

        }
    }
    showHideSpinner(flag) {
        let spinner = this.template.querySelector('lightning-spinner');
        if (spinner) {
            spinner.classList = [];
            (flag) ? spinner.classList.add('slds-show') : spinner.classList.add('slds-hide');
        }
    }
}