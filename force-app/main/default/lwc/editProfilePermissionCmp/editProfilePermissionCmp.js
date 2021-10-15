import { LightningElement, track, wire, api } from 'lwc';
import getAllObjects from '@salesforce/apex/EditProfilePermissionController.getAllObjects';
import getSelectedObjInfo from '@salesforce/apex/EditProfilePermissionController.getObjectInfos';
import getAllTabs from '@salesforce/apex/EditProfilePermissionController.getAllTabs';
import getAllProfilePermission from '@salesforce/apex/EditProfilePermissionController.getAllProfilePermission'
import getProfilePermissionXML from '@salesforce/apex/EditProfilePermissionController.getProfilePermissionXML'
import checkRetrieveStatus from '@salesforce/apex/EditProfilePermissionController.checkRetrieveStatus'
import jsZIp from '@salesforce/resourceUrl/jszip';
import { loadScript } from 'lightning/platformResourceLoader';
import { getFileContent, createBlobData, showToastMessage, createDupObjectAccessTag, prettifyXML, createDupTabVisibilityTag } from './handleFileData'

export default class EditProfilePermissionCmp extends LightningElement {
    tabOrObjPicklists = [{ label: 'Tab', value: 'tab' }, { label: 'Custom/Standard Object', value: 'object' }];
    /**
     * boolean variable for tracking jsZIp instantiation
     * @type {Boolean}
     */
    jsZipInitialized;
    /**
     * Selected profile/Permission set name
     * @type {String}
     */
    @track
    profilePermissionSelected;
    /**
     * for tracking if selected element is profile or permissinSet
     * @type {Boolean}
     */
    @track
    isProfile;
    /**
     * choice list for profile combobox
     * @type {object}
     */
    @track
    profileOptionList;
    /**
     * selected object in the dropdown
     * @type {String}
     */
    @api
    objectSelected = 'Account';
    /**
     * This list will contain all tab as well as object data 
     * as a picklist option
     * @type {List}
     */
    @track
    allObjOptions;
    /**
     * current object info which is fetched from apex class via describe object API
     */
    @track
    currentObjectInfos;
    /**
     * file content of the profile/permission data
     * @type {String}
     */
    @track
    permissionFileContent;
    /**
     * selected object describe XML
     * @type {XMLDocument}
     */
    @track
    existingObjAccessXML;
    /**
     * Existing Object field XML Object
     * @type {XMLDocument}
     */
    @track
    existingObjFldAccessXML;
    /**
     * Existing Profile data as an XML document
     * @type {XMLDocument}
     */
    @track
    existingXMLDoc;
    /**
     * Name of file uploaded
     * @type {String}
     */
    @track
    fileName;
    /**
     * List of tab fetched from apex
     * @type {List}
     */
    @track
    tabList;
    /**
     * List of all object fetched from apex
     * @type {List}
     */
    @track
    objectList;
    /**
     * Boolean to track if selected item is object or tab
     * @type {Boolean}
     */
    @track
    isObject;
    /**
     * This is system method which get called by lightning framework when rendering is 
     * completed
     * @param
     * @returns 
     */
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
    /**
     * This method is wired , and gets all object list after calling metadata api
     * @param {*}  
     */
    @wire(getAllObjects, {})
    allObjectApiList({ data, error }) {
        if (data) {
            //parsing the xml response
            var xmlDoc = new DOMParser().parseFromString(data, 'text/xml');
            let tempList = [...xmlDoc.getElementsByTagName('fullName')].map((node) => {
                if (node) {
                    if (node.childNodes) {
                        //creating picklist object list
                        return { value: node.childNodes[0].nodeValue, label: node.childNodes[0].nodeValue };
                    }
                }
            });
            //setting the value
            this.objectList = tempList;
        }
        if (error) {
            //handling error
            this.handleErrorInFetchingOnj(error);
        }
    }
    /**
     * This method gets all profile as well as permission set
     * available in the current org using SOAP API
     * @param {*} 
     */
    @wire(getAllProfilePermission, {})
    allProfilePermissionApiList({ data, error }) {
        if (data) {
            //parsing document
            var xmlDoc = new DOMParser().parseFromString(data, 'text/xml');
            let tempList = [...xmlDoc.getElementsByTagName('fullName')].map((node) => {
                if (node) {
                    if (node.childNodes) {
                        return { value: node.childNodes[0].nodeValue, label: node.childNodes[0].nodeValue };
                    }
                }
            });
            //setting value
            this.profileOptionList = tempList;
        }
        if (error) {
            //handling error
            this.handleErrorInFetchingOnj(error);
        }
    }
    /**
     * getting all the tabs avaialble in the current org by using Tooling API
     * @param {*} 
     */
    @wire(getAllTabs, {})
    allTabApiList({ data, error }) {
        if (data) {
            let tempList = [];
            //parsing the JSON
            const recordData = JSON.parse(data);
            if (recordData) {
                recordData.records.forEach(element => {
                    tempList.push({ value: element.Name, label: element.Label });
                });
            }
            //setting the value
            this.tabList = tempList;
        }
        if (error) {
            //handling error
            this.handleErrorInFetchingOnj(error);
        }
    }

    handleObjectData(data) {

    }
    handleErrorInFetchingOnj(error) {

    }
    /**
     * This method calls the SOAP Api endpoints for getting metadata 
     * related to the selected profile/permissionset as a zip file as string
     * which will be later converted to zip file and read using JSZIp extension
     * @param {Event} evt 
     */
    getProfilePermission(evt) {
        const fieldValue = evt.currentTarget;
        this.showHideSpinner(true)
        if (fieldValue.value && this.jsZipInitialized) {
            /**
             * Calling apex method and passing Profile/Permission
             * name and type of metadata as parameter
             */
            getProfilePermissionXML({ apiName: fieldValue.value, typeOfMetadata: 'Profile' })
                .then((data) => {
                    //parsing the XML response from apex
                    let xmlData = new DOMParser().parseFromString(data, 'text/xml');
                    if (xmlData) {
                        //generating state as well as retrieve ID which we received from apex
                        const retrieveRequestId = xmlData.getElementsByTagName('id')[0].childNodes[0].nodeValue;
                        const status = xmlData.getElementsByTagName('state')[0].childNodes[0].nodeValue;
                        if (status && retrieveRequestId) {
                            /**
                             * If status and retreive request ID is not null calling 
                             * method to handle recurring apex call to get zip content
                             * passing request ID as well as Profile/Permissionset Name
                             */
                            this.retrieveRequestHandler(retrieveRequestId, fieldValue);
                        }
                    }
                    console.log(data);
                })
                .catch((error) => {
                    //logging error
                    console.log(error);
                })
        }
    }
    /**
     * This method will call apex method on a repetetive interval
     * to check the status of retrieve request 
     * @param {String} requestId , request Id of retrieval
     * @param {Object} fieldValue , api Name of the profile/Permssionset
     */
    retrieveRequestHandler(requestId, fieldValue) {
        let requestCheck = 0;
        //calling setInterval for repetetive call to apex
        let checkIntervalRequest = setInterval(() => {
            /**
             * calling apex class where we will be passing 
             * request id and metadata type of the component selected
             */
            checkRetrieveStatus({ requestId: requestId })
                .then((xmlData) => {
                    //parsing the response
                    const zipXML = new DOMParser().parseFromString(xmlData, 'text/xml');
                    const state = zipXML.getElementsByTagName('done')[0].childNodes[0].nodeValue;
                    //if state is true , it means the zip has been created and put in the xml
                    //<zipFile> tag
                    if (state === 'true') {
                        //getting zip file data as a base64 encoded text
                        const zipContent = zipXML.getElementsByTagName('zipFile')[0].childNodes[0].nodeValue;
                        //clearing setInterval method 
                        clearInterval(checkIntervalRequest);
                        /**
                         * this method will generate blob from the base64 encoded text
                         * and then call the JSZIP method to create the ZIP file
                         */
                        getFileContent(createBlobData(zipContent))
                            .then((zip) => {
                                //handling the async promise which will return the zip content of the retrieved request
                                zip.files['unpackaged/profiles/' + fieldValue.value + '.profile'].async("string").then((content) => {
                                    this.showContent(content);
                                    console.log(content);
                                });
                            }).catch((e) => {
                                //showing any error
                                console.log(e)
                                alert(e.message)
                            });
                            //hiding spinner
                        this.showHideSpinner(false);
                    } else if (requestCheck === 10) {
                        //if after 30 sec the request is incomplete the closing the setinterval loop
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
    /**
     * This method will handle file upload 
     * Its not been used now 
     * @param {Event} event 
     */
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
    /**
     * This method will set the profile content as a varibale value
     * @param {String} reader 
     */
    showContent(reader) {
        this.template.querySelector("[data-id='taborobjects']").disabled = false;
        this.permissionFileContent = reader;
    }
    /**
     * This method will call apex class and fetch the object metadata info
     * Using metadata api describe call
     * @param {Event} evt 
     */
    fetchObjMetadata(evt) {
        let element = evt.currentTarget;
        let tabOrObjectDom = this.template.querySelector("[data-id='taborobjects']");

        if (element.name === 'objects' && tabOrObjectDom.value === 'object') {
            this.objectSelected = element.value;
            //this line needs to be changed beore creating a unmangaed package
            getSelectedObjInfo({ objName: (this.objectSelected.endsWith('__c') || this.objectSelected.endsWith('__mdt')) ? 'Bisapp1__' + this.objectSelected : this.objectSelected })
                .then((data) => {
                    //setting the object info data after parsing
                    this.currentObjectInfos = JSON.parse(data);
                    //calling method to generate the table based on the object information and profile 
                    //information
                    this.compareXMLandCreateTable();
                    this.template.querySelector("[data-id='profileTable']").style.display = 'inline';
                    this.template.querySelector("[data-id='tabTable']").style.display = 'none';
                })
                .catch((error) => {

                })
        } else if (tabOrObjectDom.value === 'tab') {
            //this will get executed when we have selected tab
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
        //child component holding tab access table which will show data
        let childTabComponent = this.template.querySelector('c-edit-tab-level-access-cmp');
        let xmlTree = this.parseDocument();
        if (xmlTree && _tabName) {
            //getting all tab visibility tag
            let tabAccessNode = xmlTree.getElementsByTagName('tabVisibilities');
            if (tabAccessNode) {
                //checking if the tab node is present already
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
                //sending the data to chlld component
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
     * This method will convert the existing profile data to XML document
     * @returns {XMLDocument}
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
    /**
     * This method will compare the profile XMl and object data 
     * and based on that it will create a tabular format of data which 
     * will be shown in the child component
     */
    compareXMLandCreateTable() {
        if (this.currentObjectInfos && this.permissionFileContent) {
            let xmlDoc = this.parseDocument();//parsed document
            let fieldMap = new Map();
            this.currentObjectInfos.fields.forEach((field) => {
                fieldMap.set(field.name, { label: field.label, updateable: field.updateable });
            });
            //getiing existing object permission as well as field permsission tags
            let objPermissions = xmlDoc.getElementsByTagName('objectPermissions');
            let fieldPermissions = xmlDoc.getElementsByTagName('fieldPermissions');
            let objPermissionMap = {};
            let fieldPermissionMap = {};
            //filtering the object XML tag
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
            //setting existing object permission value
            this.existingObjAccessXML = objPermission;
            //filtering field XML tag for the current object
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
            this.existingObjFldAccessXML = fieldPermission;//setiing field permission XML list
            //creating object accaess map
            if (objPermission.length > 0) {
                [...objPermission[0].childNodes].forEach(eachNode => {
                    if (eachNode.nodeName !== 'text' && eachNode.nodeName !== '#text') {
                        objPermissionMap[eachNode.nodeName] = eachNode.innerHTML;
                    }
                });
            }
            //creating field access map
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
                    fieldPermissionMap[fieldAPIName] = {};
                    
                    [...eachFldNode.childNodes].forEach((node) => {
                        if (node.nodeName !== 'field' && node.nodeName !== '#text') {
                            fieldPermissionMap[fieldAPIName][node.nodeName] = node.innerHTML;
                        }
                    });


                });
            }

            let child = this.template.querySelector('c-edit-profile-permission-table-cmp');
            //sending data to child component for table creation
            if (child) {
                child.setFieldMap(fieldMap);
                child.prePopulateObjectAccess(objPermissionMap);
                child.prePopulateFieldAccess(fieldPermissionMap);
            }

        }
    }
    /**
     * This method is called when we change any access on the child compoent 
     * edit-profile-permission-table-cmp where table is rendered
     * 
     * @param {Event} evt this is the data sent via Custom Event from child cmp
     */
    modifyObjAccess(evt) {
        let xmlTree = this.existingXMLDoc;
        //finding the existing xml tag for selcted obj
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
        //loop executed if object access tag is present in profile
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
            let newObjAccessNode = createDupObjectAccessTag(xmlTree, evt.detail, this.objectSelected);
            if( objNodeList[0]){
                xmlTree.documentElement.insertBefore(newObjAccessNode, objNodeList[0]);
            }else{
                xmlTree.documentElement.appendChild(newObjAccessNode);
            }
        }
        this.existingXMLDoc = xmlTree;

    }
    /**
     * This method is called when we change any field access on the child component 
     * edit-profile-permission-table-cmp where table is rendered
     * @param {CustomEvent} evt this is the data sent via Custom Event from child cmp
     */
    modifyFldAccess(evt) {
        let xmlTree = this.existingXMLDoc;
        let field = this.objectSelected + '.' + evt.detail.fldName;
        let allFieldNode = [...xmlTree.getElementsByTagName('fieldPermissions')];
        //finding the field XML tag where access is changed on child component
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
        //loop executed if field XML found
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
            //cloning any existing field XML tag to append in the XML
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
            //inserting node in the existing XML
            if (firstNodeWithThisObj) {
                xmlTree.documentElement.insertBefore(clonedAccess, firstNodeWithThisObj);
            } else {
                xmlTree.documentElement.insertBefore(clonedAccess, allFieldNode[0]);
            }
        }
        this.existingXMLDoc = xmlTree;
    }
    /**
     * This method will download the existing XML document as a profile file
     * @param {Event} evt 
     */
    downloadFile(evt) {
        if (this.existingXMLDoc) {
            let fileText = prettifyXML(this.existingXMLDoc.documentElement);
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
    /**
     * This method checks if we need to render object picklist or tab picklist
     * @param {Event} evt 
     */
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
    /**
     * This method will handle tab access change for existing tab or new tab
     * @param {CustomEvent} evt Custom event send from child component
     */
    handleTabVisibility(evt) {
        let xmlTree = this.existingXMLDoc;
        if (xmlTree && evt.detail) {
            let existingTabVisiblities = xmlTree.getElementsByTagName('tabVisibilities');
            //finding the existing tag
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
            //if found then changing the access in XML
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
                //if not found cloning any existing tag and changing innerhtml
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
                //if tag not present in profile creating a new one and appendning 
                let tabVisibilityElement = createDupTabVisibilityTag(undefined, evt.detail);
                xmlTree.documentElement.appendChild(tabVisibilityElement);
            }
            this.existingXMLDoc = xmlTree;

        }
    }
    /**
     * Generic method to show hide spinner
     * @param {Boolean} flag 
     */
    showHideSpinner(flag) {
        let spinner = this.template.querySelector('lightning-spinner');
        if (spinner) {
            spinner.classList = [];
            (flag) ? spinner.classList.add('slds-show') : spinner.classList.add('slds-hide');
        }
    }
}