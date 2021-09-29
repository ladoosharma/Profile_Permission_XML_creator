import { api, LightningElement, track } from 'lwc';

export default class EditTabLevelAccessCmp extends LightningElement {
    @api
    tabName;
    @api
    tabAccess;
    tabAccessChoice = [
        { value: "Hidden", label: "Hidden" },
        { value: "DefaultOn", label: "Default On" },
        { value: "DefaultOff", label: "Default Off" }
    ];

    relayDataToParent(evt) {
        this.dispatchEvent(new CustomEvent('tabaccesschange', { detail: { tabName: this.tabName, tabAccess: evt.currentTarget.value } }));
    }
}