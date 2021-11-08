import { LightningElement, track, wire, api } from 'lwc';
import getAllObjects from '@salesforce/apex/EditProfilePermissionController.getAllObjects';
import getSelectedObjInfo from '@salesforce/apex/EditProfilePermissionController.getObjectInfos';
import getAllTabs from '@salesforce/apex/EditProfilePermissionController.getAllTabs';
import getAllProfilePermission from '@salesforce/apex/EditProfilePermissionController.getAllProfilePermission'
import getProfilePermissionXML from '@salesforce/apex/EditProfilePermissionController.getProfilePermissionXML'
import deployProfilePermission from '@salesforce/apex/EditProfilePermissionController.deployProfilePermission'
import checkDeployStatus from '@salesforce/apex/EditProfilePermissionController.checkDeployStatus'
import checkRetrieveStatus from '@salesforce/apex/EditProfilePermissionController.checkRetrieveStatus'
import jsZIp from '@salesforce/resourceUrl/jszip';
import { loadScript } from 'lightning/platformResourceLoader';
import {
    generateZipForProfile, getFileContent, createBlobData, showToastMessage, compareAllTabAndAddAcessXML, createDupObjectAccessTag, prettifyXML, createDupTabVisibilityTag, compareAllObjectAndAddAcessXML,
    generateZipForMultileProfile
} from './handleFileData'

export default class EditProfilePermissionCmp extends LightningElement {
    /**
     * @type {String}
     * type of metadata selected , either permission or profile
     */
    @track
    metadataType = 'Profile';
    /**
     * Picklist option for tab or object
     */
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
     * getter for active sections
     */
    get activeSections() {
        return ['A', 'B'];
    }
    /**
     * This variable will store multiple profile/Permission xml which will be 
     * used for extraction
     */
    @track
    multipleMetadataXMLMap;
    /**
     * This will let enable/Disable option for end user to retrieve multiple 
     * Profile or permission at a time
     * @param {HTMLBodyElement} dom element of the clicked element
     */
    changeRetrieveOption(element) {
        let combobox = this.template.querySelectorAll('lightning-combobox');
        let dualList = this.template.querySelector('lightning-dual-listbox');
        let retrievemultipleButton = this.template.querySelector("[data-id='retrievemultiple']");
        if (element.currentTarget.checked) {
            combobox.forEach((combo) => {
                combo.classList.add('slds-hide');
                combo.classList.remove('slds-show');
            });
            dualList.classList.add('slds-show');
            dualList.classList.remove('slds-hide');
            retrievemultipleButton.classList.remove('slds-hide');
            retrievemultipleButton.classList.add('slds-show');
        } else {
            combobox.forEach((combo) => {
                combo.classList.add('slds-show');
                combo.classList.remove('slds-hide');
            });
            dualList.classList.add('slds-hide');
            dualList.classList.remove('slds-show');
            retrievemultipleButton.classList.add('slds-hide');
            retrievemultipleButton.classList.remove('slds-show');
        }
    }
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
                    if (node.childNodes && node.childNodes[0].nodeValue.toLowerCase() !== 'personaccount') {
                        //creating picklist object list
                        return { value: node.childNodes[0].nodeValue, label: node.childNodes[0].nodeValue };
                    }
                }
            }).filter((val) => {
                if (val) {
                    return true;
                } else {
                    return false;
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
            let tempList = [...xmlDoc.getElementsByTagName('result')].map((node) => {
                if (node) {
                    const profileName = [...node.getElementsByTagName('fullName')][0];
                    const type = [...node.getElementsByTagName('type')][0];
                    if (profileName && type) {
                        return { value: profileName.innerHTML, label: profileName.innerHTML + '-' + type.innerHTML, type: type.innerHTML };
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
     * This method will retrieve multiple profile /permission selected in the 
     * duallist box
     * @param {documentElement} element clicked button element
     */
    retrieveMultipleMetadata(element) {
        let value = this.template.querySelector('lightning-dual-listbox').value;
        //this will create stringified object for selected metadata type
        let metadataObj = Array.from(this.template.querySelector('lightning-dual-listbox').value).reduce((previous, current) => {
            var foundItem = this.profileOptionList.find((data) => {
                if (current.toLowerCase() === data.value.toLowerCase()) {
                    return true;
                }
            });
            if (foundItem) {
                if (previous.has(foundItem.type)) {
                    previous.get(foundItem.type).push(current);
                    return previous;
                } else {
                    return previous.set(foundItem.type, [current]);
                }
            }
        }, new Map());
        if (value) {
            this.showHideSpinner(true);
            getProfilePermissionXML({ metadataComponentMaps: this.reduceMapToStr(metadataObj) })
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
                            this.retrieveRequestHandler(retrieveRequestId, metadataObj);
                        }
                    }
                    console.log(data);
                })
                .catch((error) => {
                    //logging error
                    console.log(error);
                })
        } else {
            alert('select atleast one item!!!')
        }
    }
    /**
     * This method calls the SOAP Api endpoints for getting metadata 
     * related to the selected profile/permissionset as a zip file as string
     * which will be later converted to zip file and read using JSZIp extension
     * @param {Event} evt 
     */
    getProfilePermission(evt) {
        const fieldValue = evt.currentTarget;
        this.showHideSpinner(true);
        this.template.querySelector('[data-id="deploy"]').disabled = true;
        const typeObj = this.profileOptionList.find((data) => {
            if (data.value === fieldValue.value) {
                return true;
            }
        })
        this.metadataType = (typeObj) ? typeObj.type : '';
        if (fieldValue.value && this.jsZipInitialized) {
            /**
             * Calling apex method and passing Profile/Permission
             * name and type of metadata as parameter
             */
            getProfilePermissionXML({ metadataComponentMaps: this.reduceMapToStr(new Map().set(typeObj.type, [fieldValue.value])) })
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
                });
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
                    const state = (zipXML.getElementsByTagName('done')[0]) ? zipXML.getElementsByTagName('done')[0].childNodes[0].nodeValue : '';
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
                                if (typeof fieldValue.value === 'string' && fieldValue) {
                                    zip.files['unpackaged/' + ((this.metadataType.toLowerCase() === 'profile') ? 'profiles' : 'permissionsets') + '/' + fieldValue.value + '.' + this.metadataType.toLowerCase()].async("string").then((content) => {
                                        this.showContent(content);
                                        this.showHideSpinner(false);
                                        this.fileName = fieldValue.value + '.' + this.metadataType.toLowerCase();
                                        console.log(content);
                                    });
                                } else if (typeof fieldValue === 'map' || typeof fieldValue === 'object') {
                                    this.multipleMetadataXMLMap = new Map();
                                    zip.folder('unpackaged/profiles').forEach((relativePath, file) => {
                                        console.log(relativePath);
                                        file.async('string').then((data) => {
                                            let xmlFile = new DOMParser().parseFromString(data, 'text/xml');
                                            compareAllObjectAndAddAcessXML(this.objectList.map((data)=>{return data.value}), xmlFile).forEach((objAccess) => {
                                                const exitingObjIfAny = [...xmlFile.getElementsByTagName('objectPermissions')][0];
                                                (exitingObjIfAny) ? xmlFile.documentElement.insertBefore(objAccess, exitingObjIfAny) : xmlFile.documentElement.appendChild(objAccess);
                                            });
                                            compareAllTabAndAddAcessXML(this.tabList.map((eachObj) => { return eachObj.value }), xmlFile, 'profile').forEach((objAccess) => {
                                                const exitingTabIfAny = [...xmlFile.getElementsByTagName('tabVisibilities')][0];
                                                (exitingTabIfAny) ? xmlFile.documentElement.insertBefore(objAccess, exitingTabIfAny) : xmlFile.documentElement.appendChild(objAccess);
                                            });
                                            this.multipleMetadataXMLMap.set(relativePath, xmlFile);                                      
                                        });
                                    });
                                    zip.folder('unpackaged/permissionsets').forEach((relativePath, file) => {
                                        console.log(relativePath);
                                        file.async('string').then((data) => {
                                            let xmlFile = new DOMParser().parseFromString(data, 'text/xml');
                                            compareAllObjectAndAddAcessXML(this.objectList.map((data)=>{return data.value}), xmlFile).forEach((objAccess) => {
                                                const exitingObjIfAny = [...xmlFile.getElementsByTagName('objectPermissions')][0];
                                                (exitingObjIfAny) ? xmlFile.documentElement.insertBefore(objAccess, exitingObjIfAny) : xmlFile.documentElement.appendChild(objAccess);
                                            });
                                            compareAllTabAndAddAcessXML(this.tabList.map((eachObj) => { return eachObj.value }), xmlFile, 'permissionset').forEach((objAccess) => {
                                                const exitingTabIfAny = [...xmlFile.getElementsByTagName('tabSettings')][0];
                                                (exitingTabIfAny) ? xmlFile.documentElement.insertBefore(objAccess, exitingTabIfAny) : xmlFile.documentElement.appendChild(objAccess);
                                            });
                                            this.multipleMetadataXMLMap.set(relativePath, xmlFile);
                                        });
                                    });
                                    this.showHideSpinner(false);
                                }

                            }).catch((e) => {
                                //showing any error
                                console.log(e)
                                this.showHideSpinner(false);
                                alert(e.message)
                            });
                        //hiding spinner
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
        this.appendAccessXMlForRemainingObjTab();
        let addedTabAccess = compareAllTabAndAddAcessXML(this.tabList.map((eachObj) => { return eachObj.value }), this.parseDocument(false), this.metadataType);
        addedTabAccess.forEach((objAccess) => {
            const exitingTabIfAny = [...this.existingXMLDoc.getElementsByTagName((this.metadataType.toLowerCase() === 'profile') ? 'tabVisibilities' : 'tabSettings')][0];
            (exitingTabIfAny) ? this.existingXMLDoc.documentElement.insertBefore(objAccess, exitingTabIfAny) : this.existingXMLDoc.documentElement.appendChild(objAccess);
        });
    }
    appendAccessXMlForRemainingObjTab() {
        let objectNewAccess = compareAllObjectAndAddAcessXML(this.objectList.map((eachObj) => { return eachObj.value }), this.parseDocument(true));
        objectNewAccess.forEach((objAccess) => {
            const exitingObjIfAny = [...this.existingXMLDoc.getElementsByTagName('objectPermissions')][0];
            (exitingObjIfAny) ? this.existingXMLDoc.documentElement.insertBefore(objAccess, exitingObjIfAny) : this.existingXMLDoc.documentElement.appendChild(objAccess);
        });
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
            getSelectedObjInfo({ objName: /*(this.objectSelected.endsWith('__c') || this.objectSelected.endsWith('__mdt')) ? 'Bisapp1__' + this.objectSelected : */this.objectSelected })
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
        let xmlTree = this.parseDocument(false);
        if (xmlTree && _tabName) {
            //getting all tab visibility tag
            let tabAccessNode = xmlTree.getElementsByTagName((this.metadataType.toLowerCase() === 'profile') ? 'tabVisibilities' : 'tabSettings');
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
     * @param {Boolean}  newParsingFlag flag to be used for new parsing of document
     * @returns {XMLDocument}
     */
    parseDocument(newParsingFlag) {
        let text, parser, xmlDoc;
        text = this.permissionFileContent;
        parser = new DOMParser();
        xmlDoc = (newParsingFlag) ? parser.parseFromString(text, 'text/xml') : this.existingXMLDoc;
        if (newParsingFlag) {
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
            let xmlDoc = this.parseDocument(false);//parsed document
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
            if (objNodeList[0]) {
                xmlTree.documentElement.insertBefore(newObjAccessNode, objNodeList[0]);
            } else {
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
        let downloadMultiple = this.template.querySelector('[data-id="retrievemultiplecheck"]');

        if (this.existingXMLDoc && !downloadMultiple.checked) {
            generateZipForProfile(prettifyXML(this.existingXMLDoc), this.metadataType,
                ([...this.template.querySelectorAll('lightning-combobox')].find((elem) => { return elem.name === 'profilePermissionPicklist' }).value))
                .then(content => {
                    this.downloadFileHandler(content);
                })
                .catch(error => {
                    alert('Error in downloading the file !!!!');
                })
        } else if (downloadMultiple.checked && this.multipleMetadataXMLMap) {
            //generate renewed XML with tab access and object access addition
            generateZipForMultileProfile(this.multipleMetadataXMLMap)
                .then((content) => {
                    this.downloadFileHandler(content);
                })

        } else {
            alert('No file to be dowloaded!!!!');
        }

    }
    /**
     * This method will generate the download file
     * @param {Blob} blobData Blob data which will be downloaded 
     * @returns 
     */
    downloadFileHandler(blobData) {
        let reader = new FileReader();
        reader.readAsDataURL(blobData);
        reader.onloadend = () => {
            let element = document.createElement('a');
            element.setAttribute('href', reader.result);
            element.setAttribute('download', 'unpackaged.zip');

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
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
                let existingTabVisiblities = xmlTree.getElementsByTagName((this.metadataType.toLowerCase() === 'profile') ? 'tabVisibilities' : 'tabSettings');
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
                    [...xmlTree.getElementsByTagName((this.metadataType.toLowerCase() === 'profile') ? 'tabVisibilities' : 'tabSettings')].forEach((node, index) => {
                        if (node.childNodes) {
                            let tabAccess = [...node.childNodes].find((child) => {
                                if (child.nodeName === 'tab' && child.innerHTML.toLowerCase() === evt.detail.tabName.toLocaleLowerCase()) {
                                    return true;
                                }
                            });
                            if (tabAccess) {
                                [...[...xmlTree.getElementsByTagName((this.metadataType.toLowerCase() === 'profile') ? 'tabVisibilities' : 'tabSettings')][index].childNodes].forEach((child, indexVar) => {
                                    if (child.nodeName === 'visibility') {
                                        [...[...xmlTree.getElementsByTagName((this.metadataType.toLowerCase() === 'profile') ? 'tabVisibilities' : 'tabSettings')][index].childNodes][indexVar].innerHTML = evt.detail.tabAccess;
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
                    let tabVisibilityElement = createDupTabVisibilityTag(undefined, evt.detail, this.metadataType);
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
        /**
         * This method will validate the profile/Permission against logged in ORG
         */
        validateFile() {
            if (this.existingXMLDoc) {
                this.showHideSpinner(true);
                this.genericDeployRequest(true);
            }
        }
        /**
         * This method will call apex periodically to check the status of deployment request
         * @param {String} deploymentId this is the deployment/validation ID of which 
         * we need to check status on 5 sec interval 
         */
        checkPeriodicDeployStatus(deploymentId) {
            let counter = 0;
            let periodicCall = setInterval(() => {
                checkDeployStatus({ deploymentId: deploymentId })
                    .then((data) => {
                        console.log(data)
                        const result = [...((new DOMParser().parseFromString(data, 'text/xml')).getElementsByTagName('result'))][0];
                        if (result) {
                            const isDone = [...result.getElementsByTagName('done')][0];
                            if (isDone.innerHTML === 'true') {
                                this.showHideSpinner(false);
                                //check for status 
                                const status = [...result.getElementsByTagName('status')][0].innerHTML;
                                if (status) {
                                    //show success message
                                    alert(`Validation ${status}!!!!`);
                                    clearInterval(periodicCall);
                                    this.processDeployMessage(result);
                                    (status === 'Succeeded') ? this.template.querySelector('[data-id="deploy"]').disabled = false : '';
                                }
                            }
                        }
                        if (counter === 3) {
                            clearInterval(periodicCall);
                        }
                        counter = counter + 1;
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            }, 3000);
        }
        /**
         * This method is generic method fro doing deploy/validate call
         * @param {Boolean} checkOnlyFlag  flag based on that validation or deployment will be done
         * @param {Boolean} hasMultipleFile This flag will denote that we have mutiple file to validate
         */
        genericDeployRequest(checkOnlyFlag) {
            generateZipForProfile(prettifyXML(this.existingXMLDoc), this.metadataType,
                ([...this.template.querySelectorAll('lightning-combobox')].find((elem) => { return elem.name === 'profilePermissionPicklist' }).value))
                .then((fileContent) => {
                    let reader = new FileReader();
                    reader.readAsDataURL(fileContent);
                    reader.onloadend = () => {
                        let base64data = reader.result.replace('data:application/zip;base64,', '');
                        deployProfilePermission({ zipContent: base64data, deployFlag: checkOnlyFlag })
                            .then((data) => {
                                let response = new DOMParser().parseFromString(data, 'text/xml');
                                let state = response.getElementsByTagName('state');
                                let deployID = response.getElementsByTagName('id');
                                let done = response.getElementsByTagName('done');
                                if (response && [...done][0].innerHTML === 'false' && [...state][0].innerHTML === 'Queued') {
                                    this.checkPeriodicDeployStatus([...deployID][0].innerHTML);
                                }
                            })
                            .catch((error) => {
                                console.log(error);
                                alert(error);
                            })
                    }
                })
                .catch((error) => {
                    console.log(error)
                })
        }
        /**
         * This method will do deploy request to the logged in ORG
         */
        deployMetadata() {
            if (this.existingXMLDoc) {
                this.showHideSpinner(true);
                this.genericDeployRequest(false);
            }
        }
        /**
         * This method will process the deploy request response
         * @param {XMLDocument} status this is XML doc which will hold the response of deploy call
         */
        processDeployMessage(result) {
            let errorMessage = [...result.getElementsByTagName('componentFailures')].reduce((fullMessage, currentMessage, index) => {
                return fullMessage + '<br>' + '<p  style="color: red;">' + [...currentMessage.getElementsByTagName('fileName')][0].innerHTML + '---' + [...currentMessage.getElementsByTagName('problem')][0].innerHTML + '</p>';
            }, '');
            let successMessage = [...result.getElementsByTagName('componentSuccesses')].reduce((fullMessage, currentMessage, index) => {
                return fullMessage + '<br>' + '<p  style="color: green;">' + [...currentMessage.getElementsByTagName('fileName')][0].innerHTML + '</p>';
            }, '');
            this.template.querySelector('[data-id="Success"]').value = successMessage;
            this.template.querySelector('[data-id="Error"]').value = errorMessage;
        }
        /**
         * This method converts the map to string
         * @param {Map} mapData map which needs to be stringified in form of key pair object
         * @returns {String} stringified map
         */
        reduceMapToStr(mapData) {
            return JSON.stringify(Array.from(mapData).reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {}))
        }
    }