/*******************************************************************************************
* @Name         EditProfilePermissionController 
* @Author       Gaurav Sharma <gs97197@gmail.com>
* @Date         17/10/2021
* @Group        NA
* @Description  This class is controller class for all action permformed on the component
*******************************************************************************************/
/* MODIFICATION LOG
* Version          Developer          Date               Description
*-------------------------------------------------------------------------------------------
*  1.0              Gaurav Sharma      17/10/2021         Initial Creation                                                      
*******************************************************************************************/
public with sharing class EditProfilePermissionController {
    //sobject endpoint of an org
    private static final string OBJ_INFO_ENDPOINT = '/services/data/v49.0/sobjects/';
    //soap api endpoint for metadata 
    private static final String RETRIEVE_RESULT_ENDPOINT = 'services/Soap/m/50.0/';
    
    /**************************************************************************************
    * @Description  This method gets list of all sObject present in logged in org
    * @Param		None
    * @Return       String - Value retrieved as a form of JSON which will be parsed in javascript 
    * @Example     
    * EditProfilePermissionController.getAllObjects()
    */
    @AuraEnabled(cacheable= true)
    public static String getAllObjects(){
        try {
            String METADATA_LIST_XML_STRING = ProfilePermissionStaticUtils.METADATA_LIST_XML_STRING;
            //appending session id which will be of the logged in user
            METADATA_LIST_XML_STRING = METADATA_LIST_XML_STRING.replace('{{_accessToken}}', Page.SessionIDHack.getContent().toString());
            METADATA_LIST_XML_STRING = METADATA_LIST_XML_STRING.replace('{{_metadataType}}', 'CustomObject');
            METADATA_LIST_XML_STRING = METADATA_LIST_XML_STRING.replace('{{_apiVersion}}', '52.0');
            Map<String, Object> headerColumn = new Map<String, Object>();
            headerColumn.put('Content-Type', 'text/xml;charset=UTF-8');
            headerColumn.put('Accept', 'text/xml');
            headerColumn.put('SOAPAction', '""');
            //instantiation handler class for REST call
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                                                    headerColumn, METADATA_LIST_XML_STRING);
            HTTPResponse response = handler.callEndpoint('POST', true);
            return response.getBody();//returning response
        } catch (Exception e) {
            //throwing aura exception
            throw new AuraHandledException(e.getMessage());
        }
    }
    /**************************************************************************************
    * @Description  This method gets sObject describe result whih will be required in case of creating 
    *               object table on UI
    * @Param		objName (String) Object API Name 
    * @Return       String - Value retrieved as a form of JSON which will be parsed in javascript 
    * @Example     
    * EditProfilePermissionController.getObjectInfos()
    */
    @AuraEnabled
    public static String getObjectInfos(String objName){
        try {
            //instantiation handler class for REST call
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+OBJ_INFO_ENDPOINT+objName+'/describe',
                                                                                    null, '');
            
            
            HttpResponse response= handler.callEndpoint('GET', false);
            //returning response
            return response.getBody();
        } catch (Exception e) {
            //throwing aura exception
            throw new AuraHandledException(e.getMessage());
        }
    }
    /**************************************************************************************
    * @Description  This method gets all tabs which are present in the org
    * @Param		None 
    * @Return       String - Value retrieved as a form of JSON which will be parsed in javascript 
    * @Example     
    * EditProfilePermissionController.getAllTabs()
    */
    @AuraEnabled(cacheable=true)
    public static String getAllTabs (){
        try {
            //instantiation handler class for REST call
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/data/v52.0/tooling/query/?q=SELECT+Id,Name,Label+from+TabDefinition',
                                                                                    null, '');
            //returning response
            HttpResponse response= handler.callEndpoint('GET', false);
            return response.getBody();                                                                     
        } catch (Exception e) {
            //throwing aura exception
            throw new AuraHandledException(e.getMessage());
        }
    }
    /**************************************************************************************
    * @Description  This method gets all active profile or permission set available in the org
    * @Param		None 
    * @Return       String - Value retrieved as a form of XML which will be parsed in javascript 
    * @Example     
    * EditProfilePermissionController.getAllProfilePermission()
    */
    @AuraEnabled(cacheable=true)
    public static String getAllProfilePermission (){
        try {
            //adding session ID
            String METADATA_LIST_PROFILE_XML_STRING = ProfilePermissionStaticUtils.METADATA_LIST_PROFILE_XML_STRING.replace('{{_accessToken}}', Page.SessionIDHack.getContent().toString());
            Map<String, Object> headerColumn = new Map<String, Object>();
            headerColumn.put('Content-Type', 'text/xml;charset=UTF-8');
            headerColumn.put('Accept', 'text/xml');
            headerColumn.put('SOAPAction', '""');
            //instantiating handler class, this will be calling SOAP api endpoint
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                                                    headerColumn, METADATA_LIST_PROFILE_XML_STRING);
            HTTPResponse response = handler.callEndpoint('POST', true);
            return response.getBody();     
            //returning response                                                            
        } catch (Exception e) {
            //throwing error
            throw new AuraHandledException(e.getMessage());
        }
    }
    /**************************************************************************************
    * @Description  This method gets XML format of metadata for profile or permssion set
    * @Param		String apiName- API Name of profile/permssion, String typeOfMetadata - type of metadta , permissionset or profile
    * @Return       String - Value retrieved as a form of XML which will be parsed in javascript 
    * @Example     
    * EditProfilePermissionController.getProfilePermissionXML('apiName', 'type')
    */
    @AuraEnabled(cacheable=true)
    public static String getProfilePermissionXML (String apiName, String typeOfMetadata){
        try {
            String RETRIEVE_REQUEST_BODY = ProfilePermissionStaticUtils.RETRIEVE_REQUEST_BODY.replace('{{_SESSION_ID}}', Page.SessionIDHack.getContent().toString());
            //generation soap action body, fetching all object as well so field label permissions are presnet
            String allObjectstring = ProfilePermissionStaticUtils.RETRIEVE_REQUEST_ITEM.replace('{{_ELEMENT_NAME}}', 'CustomObject').replace('{{_ELEMENT_ITEM}}', '*');
            String profilePermissionString = ProfilePermissionStaticUtils.RETRIEVE_REQUEST_ITEM.replace('{{_ELEMENT_NAME}}', typeOfMetadata).replace('{{_ELEMENT_ITEM}}', apiName);
            RETRIEVE_REQUEST_BODY = RETRIEVE_REQUEST_BODY.replace('{{_REQUEST_ITEM}}', allObjectstring+profilePermissionString);
            System.debug(RETRIEVE_REQUEST_BODY);
            Map<String, Object> headerColumn = new Map<String, Object>();
            headerColumn.put('Content-Type', 'text/xml;charset=UTF-8');
            headerColumn.put('Accept', 'text/xml');
            headerColumn.put('SOAPAction', '""');
            //instatntiating the handler
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                                                    headerColumn, RETRIEVE_REQUEST_BODY);
            HTTPResponse response = handler.callEndpoint('POST', true);
            return response.getBody();                                                                 
        } catch (Exception e) {
            //throwing error
            throw new AuraHandledException(e.getMessage());
        }
    }
    /**************************************************************************************
    * @Description  This method gets called periodically and fetches the retrieve request status
    * @Param		String requestID, id of the retrieve request
    * @Return       String - Value retrieved as a form of XML which will be parsed in javascript 
    * @Example     
    * EditProfilePermissionController.checkRetrieveStatus('12345rrtsts')
    */
    @AuraEnabled
    public static String checkRetrieveStatus (String requestId){
        try {
            //generation soap action body
            String RETRIEVE_REQUEST_STATUS = ProfilePermissionStaticUtils.RETRIEVE_REQUEST_STATUS.replace('{{_SESSION_ID}}', Page.SessionIDHack.getContent().toString())
                .replace('{{_PROCESS_ID}}', requestId);
            Map<String, Object> headerColumn = new Map<String, Object>();
            headerColumn.put('Content-Type', 'text/xml;charset=UTF-8');
            headerColumn.put('Accept', 'text/xml');
            headerColumn.put('SOAPAction', '""');
            //instatntiating the handler
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                                                    headerColumn, RETRIEVE_REQUEST_STATUS);
            HTTPResponse response = handler.callEndpoint('POST', true);
            return response.getBody();                                                                 
        } catch (Exception e) {
            //throwing error
            throw new AuraHandledException(e.getMessage());
        }
    }
    /**************************************************************************************
    * @Description  This method will send deploy/validate request to org
    * @Param		String zipContent- base64 encoded zip file, String deployFlag -if validation is only needed
    * @Return       String - Request ID as a form of XML which will be parsed in javascript 
    * @Example     
    * EditProfilePermissionController.deployProfilePermission('blob base 64 data', true)
    */
    @AuraEnabled
    public static String deployProfilePermission(String zipContent, Boolean deployFlag){
        try {
        String DEPLOY_REQUEST_BOSY = ProfilePermissionStaticUtils.DEPLOY_REQUEST_XML_BODY.replace('{{_SESSION_ID}}', Page.SessionIDHack.getContent().toString())
                                .replace('{{_CHECK_ONLY}}', String.valueOf(deployFlag)).replace('{{_ZIP_CONTENT}}', zipContent);
        Map<String, Object> headerColumn = new Map<String, Object>();
        headerColumn.put('Content-Type', 'text/xml;charset=UTF-8');
        headerColumn.put('Accept', 'text/xml');
        headerColumn.put('SOAPAction', '""');
        system.debug(DEPLOY_REQUEST_BOSY);
        ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                                                    headerColumn, DEPLOY_REQUEST_BOSY);
        HTTPResponse response = handler.callEndpoint('POST', true);
        return response.getBody();  
        }catch (Exception e) {
            //throwing error
            throw new AuraHandledException(e.getMessage());
        }
    }
    /**************************************************************************************
    * @Description  This method will check deployment status
    * @Param		String deploymentId- deployment Id of the request
    * @Return       String - request status as a form of XML which will be parsed in javascript 
    * @Example     
    * EditProfilePermissionController.checkDeployStatus('salesforce 18 or 16 digit ID')
    */
    @AuraEnabled
    public static string checkDeployStatus(String deploymentId){
        try {
            String REQUEST_BODY = ProfilePermissionStaticUtils.DEPLOY_STATUS_BODY.replace('{{_SESSION_ID}}', Page.SessionIDHack.getContent().toString())
                                    .replace('{{_DEPLOY_ID}}', deploymentId);
            Map<String, Object> headerColumn = new Map<String, Object>();
            headerColumn.put('Content-Type', 'text/xml;charset=UTF-8');
            headerColumn.put('Accept', 'text/xml');
            headerColumn.put('SOAPAction', '""');
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                                                        headerColumn, REQUEST_BODY);
            HTTPResponse response = handler.callEndpoint('POST', true);
            return response.getBody();  
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}