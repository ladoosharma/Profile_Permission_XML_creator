import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import jsZIp from '@salesforce/resourceUrl/jszip';


export default class LoadJSzipComponent extends LightningElement {
    jsZipInitialized = false;
    profileContent ;
    @api
    profileName;
    @api
    zipContent
    @api
    initializeJSZIP() {
        if (this.jsZipInitialized) {
            this.createZip();
            return;
        }
        this.jsZipInitialized = true;

        Promise.all([
            loadScript(this, jsZIp)
        ])
            .then(() => {
                this.createZip();
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
    base64ToBlob(base64) {
        let binaryString = window.atob(base64);
        let binaryLen = binaryString.length;

        let ab = new ArrayBuffer(binaryLen);
        let ia = new Uint8Array(ab);
        for (let i = 0; i < binaryLen; i++) {
            ia[i] = binaryString.charCodeAt(i);
        }

        let bb = new Blob([ab], {type: "application/zip"});
        bb.lastModifiedDate = new Date();
        bb.name = "archive.zip";
        return bb;
    }
    createZip() {
        let blob = this.base64ToBlob(this.zipContent);
        let zip = new JSZip();
        zip.loadAsync(blob).then( (zip)=> {
            zip.files['unpackaged/profiles/'+this.profileName+'.profile'].async("string").then( (content) =>{
                console.log(content); // content is the file as a string
                this.profileContent = content
              });
        }).catch((e) => {
            console.log(e)
        });
    }
    @api
    getProfileContent(){
        return this.profileContent;
    }

}