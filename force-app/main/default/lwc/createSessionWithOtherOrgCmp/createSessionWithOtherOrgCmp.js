import { LightningElement, track } from 'lwc';

export default class CreateSessionWithOtherOrgCmp extends LightningElement {
    /**
     * This variable will store the user and org information
     */
    @track
    orgInfo= {userName:'', password:'', orgId:'', environment:'https://test.salesforce.com'};
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
    closeModal(){
        this.closeModalEventDispathcher();
    }
    /**
     * This method will call apex and remove any session available for the current user
     * for other org
     */
    disconnectAndRemoveSId(){

    }
    /**
     * This method will call apex and create session information for the user for the org
     * where user want to connect externally
     */
    connectAndAddSid(){

    }
    /**
     * Generic method for firing close modal event
     */
    closeModalEventDispathcher(){
        this.dispatchEvent(new CustomEvent('closemodal'));
    }
}