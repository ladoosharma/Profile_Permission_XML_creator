import { api, LightningElement, track } from 'lwc';

export default class EditTabLevelAccessCmp extends LightningElement {
    /**
     * Tab selected in the parent component
     * @type {String}
     */
    @api
    tabName;
    /**
     * Existin tab access for the tab in profile
     * @type {String}
     */
    @api
    tabAccess;
    /**
     * List for generating access combobox
     * @returns {List}
     */
    get tabAccessChoice() {
        return (this.metadataType.toLowerCase() === 'profile')?[
            { value: "Hidden", label: "Hidden" },
            { value: "DefaultOn", label: "Default On" },
            { value: "DefaultOff", label: "Default Off" }
        ]:[
            { value: "Available", label: "Available" },
            { value: "None", label: "None" },
            { value: "Visible", label: "Visible" }
        ];
    }
    /**
     * type of metadata selected , like profile or permission set
     */
    @api
    metadataType;
    /**
     * This method will fire event when we change tab level access
     * @param {Event} evt 
     */
    relayDataToParent(evt) {
        this.dispatchEvent(new CustomEvent('tabaccesschange', { detail: { tabName: this.tabName, tabAccess: evt.currentTarget.value } }));
    }
    renderedCallback(){
        if(this.tabAccess){
            this.template.querySelector('lightning-combobox').value = this.tabAccess;
        }
    }
}