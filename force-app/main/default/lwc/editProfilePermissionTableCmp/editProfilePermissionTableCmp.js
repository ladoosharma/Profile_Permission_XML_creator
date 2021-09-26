import { api, LightningElement, track } from 'lwc';

export default class EditProfilePermissionTableCmp extends LightningElement {

    allFieldsMapOfObj;
    @api
    fieldAccessXMLList;
    @api
    objectAccessXMLList;
    @api
    currentObjSelected;
    @track
    renderTable;
    @track
    listOfFldColumn;

    @api
    prePopulateObjectAccess(objAccess) {
        let tablesectionDiv = this.template.querySelector("[data-id='tableSection']");
        let createAccess = this.template.querySelector("[data-id='allowCreate']");
        let editAccess = this.template.querySelector("[data-id='allowEdit']");
        let readAccess = this.template.querySelector("[data-id='allowRead']");
        let deleteAccess = this.template.querySelector("[data-id='allowDelete']");
        let modifyAllAccess = this.template.querySelector("[data-id='modifyAllRecords']");
        let viewAllAccess = this.template.querySelector("[data-id='viewAllRecords']");
        this.objectAccessXMLList = objAccess;
        if (Object.keys(objAccess).length !== 0) {
            for (let [accessType, accessValue] of Object.entries(objAccess)) {
                switch (accessType) {
                    case 'allowCreate':

                        createAccess.checked = (accessValue === 'true') ? true : false;

                        break;
                    case 'allowEdit':

                        editAccess.checked = (accessValue === 'true') ? true : false;

                        break;
                    case 'allowRead':

                        readAccess.checked = (accessValue === 'true') ? true : false;

                        break;
                    case 'allowDelete':

                        deleteAccess.checked = (accessValue === 'true') ? true : false;

                        break;
                    case 'modifyAllRecords':

                        modifyAllAccess.checked = (accessValue === 'true') ? true : false;

                        break;
                    case 'viewAllRecords':

                        viewAllAccess.checked = (accessValue === 'true') ? true : false;

                        break;
                }
            }
        } else {
            createAccess.checked = false;
            editAccess.checked = false;
            readAccess.checked = false;
            deleteAccess.checked = false;
            modifyAllAccess.checked = false;
            viewAllAccess.checked = false;
        }

        tablesectionDiv.classList.remove('slds-hide');

    }
    @api
    prePopulateFieldAccess(fieldXMLList) {
        this.fieldAccessXMLList = fieldXMLList;
        this.listOfFldColumn = this.recreateTableRowsOnSearch('');
    }
    @api
    setFieldMap(data) {
        this.allFieldsMapOfObj = data;
    }
    mapNewPermission(checkboxElem) {
        let checkBoxDom = checkboxElem.currentTarget;
        let readChecbox = this.template.querySelector("[data-fld='" + checkBoxDom.dataset.fld + "'][data-accesstype='readable']");
        let editChecbox = this.template.querySelector("[data-fld='" + checkBoxDom.dataset.fld + "'][data-accesstype='editable']");
        let relayDataObj = { fldName: checkBoxDom.dataset.fld, checked: checkBoxDom.checked, accessType: checkBoxDom.dataset.accesstype };
        if(this.fieldAccessXMLList[checkBoxDom.dataset.fld]){
            this.fieldAccessXMLList[checkBoxDom.dataset.fld][checkBoxDom.dataset.accesstype] = checkBoxDom.checked;
        }else{
            this.fieldAccessXMLList[checkBoxDom.dataset.fld] = {readable:false, editable:false};
        }
        this.fieldAccessXMLList[checkBoxDom.dataset.fld][checkBoxDom.dataset.accesstype] = checkBoxDom.checked;
        if (checkBoxDom.dataset.accesstype === "editable") {
            if (checkBoxDom.checked) {
                if (!readChecbox.checked) {
                    readChecbox.checked = true;
                    let relayDataObjDependent = { fldName: checkBoxDom.dataset.fld, checked: true, accessType: "readable" };
                    this.fieldAccessXMLList[checkBoxDom.dataset.fld]['readable'] = true;
                    this.dispatchEvent(new CustomEvent('fieldaccesschange', { detail: relayDataObjDependent }));
                }
            }
        } else if (checkBoxDom.dataset.accesstype === "readable") {
            if (!checkBoxDom.checked) {
                if (editChecbox.checked) {
                    editChecbox.checked = false;
                    let relayDataObjDependent = { fldName: checkBoxDom.dataset.fld, checked: false, accessType: "editable" };
                    this.fieldAccessXMLList[checkBoxDom.dataset.fld]['editable'] = false;
                    this.dispatchEvent(new CustomEvent('fieldaccesschange', { detail: relayDataObjDependent }));
                }
            }
        }
        this.dispatchEvent(new CustomEvent('fieldaccesschange', { detail: relayDataObj }));

    }
    mapObjAccess(checkBoxElem) {
        let checkBoxDom = checkBoxElem.currentTarget;
        let relayDataObj = { checked: checkBoxDom.checked, accessType: checkBoxDom.dataset.id };
        this.dispatchEvent(new CustomEvent('objaccesschange', { detail: relayDataObj }));
    }
    searchFld(evt) {
        this.listOfFldColumn = this.recreateTableRowsOnSearch(evt.currentTarget.value);
    }
    recreateTableRowsOnSearch(searchKey) {
        let listOfFldColumn = [];
        let fieldXMLList = this.fieldAccessXMLList;
        if (this.allFieldsMapOfObj) {
            this.allFieldsMapOfObj.forEach((element, key) => {
                let tempElement = Object.assign({}, element);
                tempElement.updateable = !tempElement.updateable;
                key = key.toLowerCase();
                //there i need to change all the keys to lowecase
                if (!searchKey || key.toLowerCase().startsWith(searchKey.toLowerCase())) {
                    if (fieldXMLList[key]) {
                        fieldXMLList[key] = { editable: (fieldXMLList[key].editable === 'true') ? true : false, readable: (fieldXMLList[key].readable === 'true') ? true : false };
                        listOfFldColumn.push(Object.assign({}, fieldXMLList[key], tempElement, { name: key }));
                    } else {
                        listOfFldColumn.push(Object.assign({}, { "editable": false, "readable": false }, tempElement, { name: key }));
                    }
                }

            });
        }
        return listOfFldColumn;
    }
}