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
     * @type {List}
     */
    tabAccessChoice = [
        { value: "Hidden", label: "Hidden" },
        { value: "DefaultOn", label: "Default On" },
        { value: "DefaultOff", label: "Default Off" }
    ];
    /**
     * This method will fire event when we change tab level access
     * @param {Event} evt 
     */
    relayDataToParent(evt) {
        this.dispatchEvent(new CustomEvent('tabaccesschange', { detail: { tabName: this.tabName, tabAccess: evt.currentTarget.value } }));
    }
}