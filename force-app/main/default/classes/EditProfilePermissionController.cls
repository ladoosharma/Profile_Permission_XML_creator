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
            //instantiation handler class for REST call
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                                    generateHeader(), METADATA_LIST_XML_STRING);
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
            //instantiating handler class, this will be calling SOAP api endpoint
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                    generateHeader(), METADATA_LIST_PROFILE_XML_STRING);
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
    @AuraEnabled
    public static String getProfilePermissionXML (/*String apiName, String typeOfMetadata,*/ string metadataComponentMaps){
        try {
            String RETRIEVE_REQUEST_BODY = ProfilePermissionStaticUtils.RETRIEVE_REQUEST_BODY.replace('{{_SESSION_ID}}', Page.SessionIDHack.getContent().toString());
            //generation soap action body, fetching all object as well so field label permissions are presnet
            String allObjectstring = ProfilePermissionStaticUtils.RETRIEVE_REQUEST_ITEM.replace('{{_ELEMENT_NAME}}', 'CustomObject').replace('{{_ELEMENT_ITEM}}', '*');
            String allRetrievedItem = '';
            String allItems;
            Map<String, List<String>> metadataMap = (Map<String, List<String>>)JSON.deserialize(metadataComponentMaps, Map<String, List<String>>.class);
            System.debug(metadataComponentMaps);
            for(String metaType : metadataMap.keyset()){
                allRetrievedItem += ProfilePermissionStaticUtils.RETRIEVE_MULTIPLE_REQUEST_ITEM.replace('{{_ELEMENT_NAME}}', metaType);
                allItems = '';
                for(String metaName : metadataMap.get(metaType)){
                    allItems += ProfilePermissionStaticUtils.MEMBER_TAG.replace('{{_ELEMENT_ITEM}}', metaName);
                }
                allRetrievedItem = allRetrievedItem.replace('{{_ELEMENT_ITEM}}', allItems);
            }
            System.debug(allRetrievedItem);
            // String profilePermissionString = ProfilePermissionStaticUtils.RETRIEVE_REQUEST_ITEM.replace('{{_ELEMENT_NAME}}', typeOfMetadata).replace('{{_ELEMENT_ITEM}}', apiName);
            // RETRIEVE_REQUEST_BODY = RETRIEVE_REQUEST_BODY.replace('{{_REQUEST_ITEM}}', allObjectstring+allRetrievedItem);
            //instatntiating the handler
            RETRIEVE_REQUEST_BODY = RETRIEVE_REQUEST_BODY.replace('{{_REQUEST_ITEM}}', allObjectstring+allRetrievedItem);
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                        generateHeader(), RETRIEVE_REQUEST_BODY);
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
            //instatntiating the handler
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId() ,
                                                    generateHeader(), RETRIEVE_REQUEST_STATUS);
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
    * @Param		Boolean useExternalOrg- this flag will determine if deploy or validate request to be sent to other org
    * @Return       String - Request ID as a form of XML which will be parsed in javascript 
    * @Example     
    * EditProfilePermissionController.deployProfilePermission('blob base 64 data', true)
    */
    @AuraEnabled
    public static String deployProfilePermission(String zipContent, Boolean deployFlag, Boolean useExternalOrg){
        try {
        Map<String, String> sessionInfo;
        if(useExternalOrg){
            sessionInfo = getOtherOrgSession();
        }
        String DEPLOY_REQUEST_BOSY = ProfilePermissionStaticUtils.DEPLOY_REQUEST_XML_BODY.replace('{{_SESSION_ID}}', (useExternalOrg)?sessionInfo.get('sessionId'):Page.SessionIDHack.getContent().toString())
                                .replace('{{_CHECK_ONLY}}', String.valueOf(deployFlag)).replace('{{_ZIP_CONTENT}}', zipContent);
        ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler((useExternalOrg)?sessionInfo.get('metadataServerUrl'):(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId()) ,
                                                generateHeader(), DEPLOY_REQUEST_BOSY);
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
    public static string checkDeployStatus(String deploymentId, Boolean useExternalOrg){
        try {
            
            Map<String, String> sessionInfo;
            if(useExternalOrg){
                sessionInfo = getOtherOrgSession();
            }
            String REQUEST_BODY = ProfilePermissionStaticUtils.DEPLOY_STATUS_BODY.replace('{{_SESSION_ID}}', (useExternalOrg)?sessionInfo.get('sessionId'):Page.SessionIDHack.getContent().toString())
                                    .replace('{{_DEPLOY_ID}}', deploymentId);
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler((useExternalOrg)?sessionInfo.get('metadataServerUrl'):(URL.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/m/52.0/'+UserInfo.getOrganizationId()) ,
                                                    generateHeader(), REQUEST_BODY);
            HTTPResponse response = handler.callEndpoint('POST', true);
            return response.getBody();  
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    /**************************************************************************************
    * @Description  This method will connect with external org and create a session in the logged in org
    * @Param		String orgInfoString- Stringified JSON object of the external org info
    * @Return       String - request status as a form of XML which will be parsed in javascript 
    * @Example     
    * EditProfilePermissionController.createSessionWithExternalOrg('{object as a string}')
    */
    @AuraEnabled
    public static Map<String, String> createSessionWithExternalOrg(String orgInfoString){
            Map<String, String> orgInfoObj = (Map<String, String>) JSON.deserialize(orgInfoString, Map<String, String>.class);
            String loginBody = ProfilePermissionStaticUtils.LOGIN_REQUEST_BODY.replace('{{_USERNAME}}', orgInfoObj.get('userName')).replace('{{_PASSWORD}}', orgInfoObj.get('password'));
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(orgInfoObj.get('environment')+'/services/Soap/u/52.0/'+ orgInfoObj.get('orgId') ,
                                                        generateHeader(), loginBody);
            Map<String, String> responsedata = new Map<String, String>();
            HTTPResponse response = handler.callEndpoint('POST', true);
            Dom.Document doc = response.getBodyDocument();
            System.debug(response.getBody());
            //Retrieve the root element for this document.
            Dom.XMLNode sessionDetails = doc.getRootElement();
            Dom.XmlNode results = sessionDetails.getChildElements()[0].getChildElements()[0].getChildElements()[0];
            if(response.getStatusCode() == 200){
                for(Dom.XmlNode node : results.getChildElements()){
                    if(node.getName() == 'userInfo'){
                        for(Dom.XmlNode uInfoNode: node.getChildElements()){
                            if(uInfoNode.getName() =='userName' || uInfoNode.getName() =='userEmail' && uInfoNode.getName() == 'organizationId'){
                                responsedata.put(uInfoNode.getName(), uInfoNode.getText());
                            }
                        }
                        continue;
                    }
                    responsedata.put(node.getName(), node.getText());
                }
            }else{
                //message will change here
                throw new CalloutException((String)response.getBody());
            } 
            if(responsedata.containsKey('sessionId') && responsedata.containsKey('userId')){
                createOtherOrgSessionRecord(responsedata);
                responsedata.remove('sessionId');
            }
            return responsedata;
        
    }
    /**************************************************************************************
    * @Description  This method will create SOAP header
    * @Return       Map<String, Object> - header map
    * @Example     
    * generateHeader()
    */
    private static Map<String, Object> generateHeader(){
        Map<String, Object> headerColumn = new Map<String, Object>();
        headerColumn.put('Content-Type', 'text/xml;charset=UTF-8');
        headerColumn.put('Accept', 'text/xml');
        headerColumn.put('SOAPAction', '""');
        return headerColumn;
    }
    /**************************************************************************************
    * @Description  This method will create session in session cache
    * @Param		Map<String, String> sessionInfo- session information as a map
    * @Return       None
    * @Example     
    * generateHeader()
    */
    private static void createOtherOrgSessionRecord(Map<String, String> sessionInfo){
        if(!sessionInfo.isEmpty()){
            
                Cache.Session.getPartition('local.ProfileDeployment').put(UserInfo.getUserId(), sessionInfo);
        }
    }
    /**************************************************************************************
    * @Description  This method will return active external org session
    * @Param		String sessionId- session information 
    * @Return       None
    * @Example     
    * getOtherOrgSessionData()
    */
    private static Map<String, String> getOtherOrgSession(){
        if(Cache.Session.getPartition('local.ProfileDeployment').contains(UserInfo.getUserId())){
            Map<String, String> sessionMap = (Map<String, String>)Cache.Session.getPartition('local.ProfileDeployment').get(UserInfo.getUserId());
            return sessionMap;
        }
        throw new CalloutException('Session doesnt exist for the user.');
    }
    /**************************************************************************************
    * @Description  This method will remove any logged in session infor for the logged in USer
    * @Param		None
    * @Return       None
    * @Example     
    * EditProfilePermissionController.removeLoggedInSession()
    */
    @AuraEnabled
    public static Boolean removeLoggedInSession(){
        if(Cache.Session.getPartition('local.ProfileDeployment').contains(UserInfo.getUserId())){
            Cache.Session.getPartition('local.ProfileDeployment').remove(UserInfo.getUserId());
            return true;
        }
        throw new AuraHandledException('Session Id for this user not found!!');
    }
    /**************************************************************************************
    * @Description  This method will create remote site setting asynchronosly if there is no info available for connected org
    * @Param		String endpoint endpoint which needs to be connected 
    * @Param		String orgId organization Id of the new org(this will be api Name of the org) 
    * @Return       None
    * @Example     
    * EditProfilePermissionController.createRemoteSiteSetting('https://test.salesforce.com', '010010011cdfx')
    */
    // @future(Callout = true)
    // public static void createRemoteSiteSetting(String endpoint, string orgId){
    //     //instantiation handler class for REST call
    //     ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+
    //     '/services/data/v52.0/tooling/query/?q=SELECT+Id,EndpointUrl+from+RemoteProxy+where+EndpointUrl=\''+endpoint+'\'',
    //     null, '');
    //     //returning response
    //     HttpResponse response= handler.callEndpoint('GET', false);
    //     Map<String, Object> responseParser = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
    //     List<Object> record = (List<Object>)responseParser.get('records');
    //     if(record.isEmpty()){
    //        //create remote site record 
    //     }
    // // }
}