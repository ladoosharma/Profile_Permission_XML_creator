import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const createBlobData = (base64) => {
    let binaryString = window.atob(base64);
    let binaryLen = binaryString.length;

    let ab = new ArrayBuffer(binaryLen);
    let ia = new Uint8Array(ab);
    for (let i = 0; i < binaryLen; i++) {
        ia[i] = binaryString.charCodeAt(i);
    }

    let bb = new Blob([ab], { type: "application/zip" });
    bb.lastModifiedDate = new Date();
    bb.name = "archive.zip";
    return bb;
}

const getFileContent = (blob) =>{
    let zip = new JSZip();
    return new Promise((resolve, reject)=> {
        resolve(zip.loadAsync(blob));
      });
}

const callFunctionOnInteval = (interval, callbackFun)=>{

}
const showToastMessage= (title, message, variant)=>{
    this.dispatchEvent(
        new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        })
    );
}

export{ callFunctionOnInteval, getFileContent, createBlobData, showToastMessage };