import { LightningElement, track } from 'lwc';
import createSessionWithExternalOrg from '@salesforce/apex/EditProfilePermissionController.createSessionWithExternalOrg'
import removeLoggedInSession from '@salesforce/apex/EditProfilePermissionController.removeLoggedInSession'

export default class CreateSessionWithOtherOrgCmp extends LightningElement {
    /**
     * This variable will store the user and org information
     */
    orgInfo = { userName: '', password: '', orgId: '', environment: 'https://test.salesforce.com' };
    /**
     * Disable all input field when session is acquired
     * @type {Boolean}
     */
    @track
    fieldDisabled = false;
    /**
     * getter for the radiobutton
     */
    get orgOptions() {
        return [{ value: 'https://test.salesforce.com', label: "Test" },
        { value: 'https://login.salesforce.com', label: "Production" }];
    }
    /**
     * This method will fire and event for closing the modal
     */
    closeModal() {
        this.closeModalEventDispathcher();
    }
    /**
     * This method will call apex and remove any session available for the current user
     * for other org
     */
    disconnectAndRemoveSId() {
        removeLoggedInSession()
        .then(data=>{
            this.fieldDisabled = false;
            alert('Session cleared for external org!!');
            this.dispatchEvent(new CustomEvent('sessiondetail', { detail: undefined }));
            [...this.template.querySelectorAll('lightning-input')].forEach((element) => {
                element.value = '';
            });
        })
        .catch(error=>{
            alert(error.message);
        })
    }
    /**
     * This method will call apex and create session information for the user for the org
     * where user want to connect externally
     */
    connectAndAddSid() {
        let data = [...this.template.querySelectorAll('lightning-input')].reduce((previous, current) => {
            previous[current.name] = current.value;
            return previous;
        }, {});
        let valid = true;
        data['environment'] = this.template.querySelector('lightning-radio-group').value;
        [...this.template.querySelectorAll('lightning-input')].forEach((element) => {
            if (valid) {
                valid = element.reportValidity();
            }
        });
        if (!valid) {
            alert('Populate required data!!!');
            //here toast message will be put
            return
        }
        createSessionWithExternalOrg({ orgInfoString: JSON.stringify(data) })
            .then((data) => {
                if (data) {
                    this.fieldDisabled = true;
                    this.dispatchEvent(new CustomEvent('sessiondetail', { detail: data }));
                    alert('Session Acquired!!!!!');
                }
            })
            .catch((error) => {
                let errorXML = new DOMParser().parseFromString(error.message, 'text/xml');
                alert([...errorXML.getElementsByTagName('faultstring')][0].innerHTML);
            })
    }
    /**
     * Generic method for firing close modal event
     */
    closeModalEventDispathcher() {
        this.dispatchEvent(new CustomEvent('closemodal'));
    }
}