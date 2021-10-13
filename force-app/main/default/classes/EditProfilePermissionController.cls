public with sharing class EditProfilePermissionController {
    private static final string OBJ_INFO_ENDPOINT = '/services/data/v49.0/sobjects/';
    private static final String RETRIEVE_RESULT_ENDPOINT = 'services/Soap/m/50.0/';
    
    @AuraEnabled(cacheable= true)
    public static String getAllObjects(){
        try {
            String METADATA_LIST_XML_STRING = ProfilePermissionStaticUtils.METADATA_LIST_XML_STRING;
            METADATA_LIST_XML_STRING = METADATA_LIST_XML_STRING.replace('{{_accessToken}}', Page.SessionIDHack.getContent().toString());
            METADATA_LIST_XML_STRING = METADATA_LIST_XML_STRING.replace('{{_metadataType}}', 'CustomObject');
            METADATA_LIST_XML_STRING = METADATA_LIST_XML_STRING.replace('{{_apiVersion}}', '52.0');
            Map<String, Object> headerColumn = new Map<String, Object>();
            headerColumn.put('Content-Type', 'text/xml;charset=UTF-8');
            headerColumn.put('Accept', 'text/xml');
            headerColumn.put('SOAPAction', '""');
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                                                    headerColumn, METADATA_LIST_XML_STRING);
            HTTPResponse response = handler.callEndpoint('POST', true);
            /*
            List<String> returnList = new List<String>();
            returnList.addAll(Schema.getGlobalDescribe().keyset());*/
            return response.getBody();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled
    public static String getObjectInfos(String objName){
        try {
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+OBJ_INFO_ENDPOINT+objName+'/describe',
                                                                                    null, '');
                                                                                    

            HttpResponse response= handler.callEndpoint('GET', false);
            return response.getBody();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled(cacheable=true)
    public static String getAllTabs (){
        try {
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/data/v52.0/tooling/query/?q=SELECT+Id,Name,Label+from+TabDefinition',
                                                                                    null, '');
            HttpResponse response= handler.callEndpoint('GET', false);
            return response.getBody();                                                                     
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled(cacheable=true)
    public static String getAllProfilePermission (){
        try {
            String METADATA_LIST_PROFILE_XML_STRING = ProfilePermissionStaticUtils.METADATA_LIST_PROFILE_XML_STRING.replace('{{_accessToken}}', Page.SessionIDHack.getContent().toString());
            Map<String, Object> headerColumn = new Map<String, Object>();
            headerColumn.put('Content-Type', 'text/xml;charset=UTF-8');
            headerColumn.put('Accept', 'text/xml');
            headerColumn.put('SOAPAction', '""');
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                                                    headerColumn, METADATA_LIST_PROFILE_XML_STRING);
            HTTPResponse response = handler.callEndpoint('POST', true);
            return response.getBody();                                                                 
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled(cacheable=true)
    public static String getProfilePermissionXML (String apiName, String typeOfMetadata){
        try {
            String RETRIEVE_REQUEST_BODY = ProfilePermissionStaticUtils.RETRIEVE_REQUEST_BODY.replace('{{_SESSION_ID}}', Page.SessionIDHack.getContent().toString());
            String allObjectstring = ProfilePermissionStaticUtils.RETRIEVE_REQUEST_ITEM.replace('{{_ELEMENT_NAME}}', 'CustomObject').replace('{{_ELEMENT_ITEM}}', '*');
            String profilePermissionString = ProfilePermissionStaticUtils.RETRIEVE_REQUEST_ITEM.replace('{{_ELEMENT_NAME}}', typeOfMetadata).replace('{{_ELEMENT_ITEM}}', apiName);
            RETRIEVE_REQUEST_BODY = RETRIEVE_REQUEST_BODY.replace('{{_REQUEST_ITEM}}', allObjectstring+profilePermissionString);
            Map<String, Object> headerColumn = new Map<String, Object>();
            headerColumn.put('Content-Type', 'text/xml;charset=UTF-8');
            headerColumn.put('Accept', 'text/xml');
            headerColumn.put('SOAPAction', '""');
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                                                    headerColumn, RETRIEVE_REQUEST_BODY);
            HTTPResponse response = handler.callEndpoint('POST', true);
            return response.getBody();                                                                 
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled(cacheable=true)
    public static String checkRetrieveStatus (String requestId){
        try {
            String RETRIEVE_REQUEST_STATUS = ProfilePermissionStaticUtils.RETRIEVE_REQUEST_STATUS.replace('{{_SESSION_ID}}', Page.SessionIDHack.getContent().toString())
                                                .replace('{{_PROCESS_ID}}', requestId);
            Map<String, Object> headerColumn = new Map<String, Object>();
            headerColumn.put('Content-Type', 'text/xml;charset=UTF-8');
            headerColumn.put('Accept', 'text/xml');
            headerColumn.put('SOAPAction', '""');
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                                                    headerColumn, RETRIEVE_REQUEST_STATUS);
            HTTPResponse response = handler.callEndpoint('POST', true);
            return response.getBody();                                                                 
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}